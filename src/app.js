const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const timeout = require('connect-timeout');
const { haltOnTimedout } = require('./utils/appHelper');

// Set up database
const Blockchain = require('./blockchain/Blockchain').Blockchain;
const Block = require('./blockchain/Block').Block;
const Chain = new Blockchain("simple_blockchain_web_service");

//In real application, should be redis
const pendingWalletValidations = {};
const pendingStarRegistrations = {};

//Load route handlers
const blockRouter = require('./api/block');
const mempoolRouter = require('./api/mempool');
const requestValidationRouter = require('./api/requestValidation');
const messageSignatureRouter = require('./api/messageSignature');

//Initialize application
const app = express();
const port = 8000;

//middlewares
app.use(timeout('5s'));
app.use(haltOnTimedout);
app.use(bodyParser.json());
app.use(morgan("tiny"));

app.use('/block', blockRouter(Chain, Block, pendingStarRegistrations));
app.use('/mempool', mempoolRouter(Chain));
app.use('/requestValidation', requestValidationRouter(pendingWalletValidations));
app.use('/message-signature', messageSignatureRouter(pendingWalletValidations, pendingStarRegistrations));


app.listen(port, () => console.info(`Simple blockchain web service listening on port ${port}!`))