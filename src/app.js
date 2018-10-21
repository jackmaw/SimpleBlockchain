const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const timeout = require('connect-timeout');
const { haltOnTimedout } = require('./utils/appHelper');

// Set up database
const Blockchain = require('./blockchain/Blockchain').Blockchain;
const Block = require('./blockchain/Block').Block;
const Chain = new Blockchain("simple_blockchain_web_service");

/*
In production ready app, should be redis 
and all entries should be added with TTL equal to validationWindow at given time
For simplicity i will use simple object and also i will skip writing code clearing outdated entries.
*/
const pendingWalletValidations = {};
const pendingStarRegistrations = {};

//Load route handlers
const blockRouter = require('./api/block');
const mempoolRouter = require('./api/mempool');
const requestValidationRouter = require('./api/requestValidation');
const messageSignatureRouter = require('./api/messageSignature');
const starsRouter = require('./api/stars');

//Initialize application
const app = express();
const port = 8000;

//middlewares
app.use(timeout('5s'));
app.use(haltOnTimedout);
app.use(bodyParser.json());
app.use(morgan("tiny"));

//application routes
app.use('/block', blockRouter(Chain, Block, pendingStarRegistrations));
app.use('/mempool', mempoolRouter(Chain));
app.use('/requestValidation', requestValidationRouter(pendingWalletValidations));
app.use('/message-signature', messageSignatureRouter(pendingWalletValidations, pendingStarRegistrations));
app.use('/stars', starsRouter(Chain));

app.listen(port, () => console.info(`Simple blockchain web service listening on port ${port}!`))