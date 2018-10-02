const isEmpty = require('lodash/isEmpty');
const express = require('express');
const router = express.Router();

const { getErrorResponse } = require('../utils/errorsHelper');
const { isValidHeight } = require('../utils/blockHelper');
const { errorTypes } = require('../constants/errors');
const { checkStatusConstants } = require('../constants/block');

function getRouter(Chain, Block) {
    router
        .post('/', (req, res) => {
            if (!req.body || isEmpty(req.body.body)) {
                res.status(400)
                    .json(getErrorResponse(errorTypes.INVALID_BLOCK_DATA, 'Block body not provided'));
            } else {
                try {
                    const blockBody = JSON.stringify(req.body);
                } catch (error) {
                    res.status(400)
                        .json(getErrorResponse(errorTypes.INVALID_BLOCK_DATA, `Error while parsing data: ${error}`));
                }

                const addBlockResult = Chain.addBlock(new Block({body: req.body.body}));
                /*
                    For now its ok to check status here, because only one client adds blocks to the blockchain.
                    Also, every block should be added after 100-200ms, thus we can check status here and wait until block was consumed by Chain.
                    However, when more clients start using our web service that is not the case anymore, and on top of that, in mempool can be n blocks waiting for consumption.
                    Thus we should immediately send block status and jobId here (addBlockResult), and our API consumer should check status via /mempool/:jobId. 
                */
                let currentTrial = 0;
                const interval = setInterval(() => {
                    if (currentTrial++ < checkStatusConstants.NUMBER_OF_TRIALS) {
                        const blockStatus = Chain.checkBlockStatus(addBlockResult.jobId);
                        const {status, block} = blockStatus;

                        if (status === 'INSERTED') {
                            clearInterval(interval);
                            res.status(200).json({
                                status,
                                block: JSON.parse(block)
                            });
                        } else if (status === 'ERROR') {
                            clearInterval(interval);
                            res.status(500)
                                .json(getErrorResponse(errorTypes.BLOCK_CANNOT_BE_ADDED, blockStatus.error));
                        }
                    } else {
                        clearInterval(interval);
                        res.status(503)
                            .json(getErrorResponse(errorTypes.TIMEOUT, ''));
                    }
                }, checkStatusConstants.CHECK_STATUS_INTERVAL);
            }
        })
        .get('/:blockHeight', (req, res) => {
            const blockHeight = Number(req.params.blockHeight);
            if (!isValidHeight(blockHeight)) {
                res.status(404)
                    .json(getErrorResponse(errorTypes.INVALID_HEIGHT, 'Block Height should be an integer >= 0'));
            } else {
                Chain.getBlockFromStorage(blockHeight, (error, block) => {
                    if (error) {
                        if (error.notFound) {
                            res.status(404)
                                .json(getErrorResponse(errorTypes.BLOCK_NOT_FOUND_IN_BLOCKCHAIN, error.message));
                        } else {
                            res.status(500)
                                .json(getErrorResponse(errorTypes.BLOCKCHAIN_UNAVAILABLE, error.message));
                        }
                    }
            
                    res.json(JSON.parse(block));
                });
            }
        });

    return router;
}


module.exports = getRouter;

