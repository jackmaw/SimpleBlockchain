const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const isEmpty = require('lodash/isEmpty');

const Blockchain = require('./blockchain/Blockchain').Blockchain;
const Block = require('./blockchain/Block').Block;
const blockchain = new Blockchain("simple_blockchain_web_service");
const app = express();
const port = 8000;

app.use(morgan("tiny"));
app.use(bodyParser.json());

app.post('/block', (req, res) => {
    console.log(req.body)
    if (!req.body || isEmpty(req.body.body)) {
        res.status(400).json({
            error: 'INVALID_BLOCK_DATA',
            message: 'Block body not provided'
        });
    } else {
        try {
            const blockBody = JSON.stringify(req.body);
        } catch (error) {
            res.status(400).json({
                error: 'INVALID_BLOCK_DATA',
                message: `Error while parsing data: ${error}`
            });
        }

        const addBlockResult = blockchain.addBlock(new Block({body: req.body}));
        const trials = 20;
        let currentTrial = 0;
        let ADD_BLOCK_INTERVAL = 100;

        const interval = setInterval(() => {
            if (currentTrial++ < trials) {
                const blockStatus = blockchain.checkBlockStatus(addBlockResult.jobId);
                const {status, block} = blockStatus;
                if (status === 'INSERTED') {
                    clearInterval(interval);
                    res.status(201).json({
                        status,
                        block
                    });
                } else if (status === 'ERROR') {
                    clearInterval(interval);
                    res.status(500).json({
                        error: 'BLOCK_CANNOT_BE_ADDED',
                        message: blockStatus.error
                    }); 
                }
            } else {
                clearInterval(interval);
                res.status(500).json({
                    error: 'TIMEOUT',
                    message: ''
                }); 
            }
        }, ADD_BLOCK_INTERVAL);
    }
});

app.get('/block/:blockHeight', (req, res) => {
    const blockHeight = Number(req.params.blockHeight);
    if (Number.isNaN(blockHeight) || !Number.isInteger(blockHeight) || blockHeight < 0) {
        res.status(404).json({
            error: 'INVALID_HEIGHT',
            message: 'Block Height should be an integer >= 0'
        });
    } else {
        blockchain.getBlockFromStorage(blockHeight, (error, block) => {
            if (error) {
                if (error.notFound) {
                    res.status(404).json({
                        error: 'BLOCK_NOT_FOUND',
                        message: error.message
                    });
                } else {
                    res.status(500).json({
                        error: 'BLOCKCHAIN_UNAVAILABLE',
                        message: error.message
                    })
                }
            }
    
            res.json(block);
        });
    }
});

app.listen(port, () => console.log(`Simple blockchain web service listening on port ${port}!`))