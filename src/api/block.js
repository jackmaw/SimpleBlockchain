const isEmpty = require('lodash/isEmpty');
const express = require('express');
const router = express.Router();

const { getErrorResponse } = require('../utils/errorsHelper');
const { isValidHeight, transformBlockFromStorage, readStringBuffer, hasMoreThanAscii } = require('../utils/blockHelper');
const { errorTypes } = require('../constants/errors');
const { checkStatusConstants } = require('../constants/block');
const { getCurrentValidationWindow } = require('../utils/appHelper');
const { VALIDATION_WINDOW, STAR_STORY_LIMIT } = require('../constants/star');

function getRouter(Chain, Block, pendingStarRegistrations) {
    router
        .post('/', (req, res) => {

            if (!req.body || !req.body.address || isEmpty(req.body.star)) {
                res.status(400)
                    .json(getErrorResponse(errorTypes.INVALID_BLOCK_DATA, 'Block body not provided'));
            } else {
                let blockBody = null;

                try {
                    const {address, star} = req.body;

                    //check if address is allowed to add new star
                    if (!pendingStarRegistrations[address]) {
                        throw new Error('Address not authorized');
                    }

                    //check if validation window expires
                    let newValidationWindow = getCurrentValidationWindow(pendingStarRegistrations[address].requestTimestamp, VALIDATION_WINDOW);
                    if (newValidationWindow <= 0) {
                        delete pendingStarRegistrations[address];
                        throw new Error('Validation window expires');
                    }
                    
                    //check star coordinates
                    if (!star.dec) {
                        throw new Error('Star: dec property is missing');
                    }

                    if (!star.ra) {
                        throw new Error('Star: ra property is missing');
                    }

                    //validate if all chars are ascii
                    if (hasMoreThanAscii(star.story)) {
                        throw new Error('Star: non ASCII characters presented in star story');
                    }
    
                    //check star story size
                    const checkStarStorySize = Buffer.byteLength(star.story, 'ascii');
                    if (checkStarStorySize > STAR_STORY_LIMIT) {
                        throw new Error('Star story size to large');
                    }

                    const encodedStarStory = readStringBuffer(star.story, 'ascii', 'hex');
                    star.story = encodedStarStory;

                    //check if story have required length
                    blockBody = JSON.stringify({
                        address,
                        star
                    });
                } catch (error) {
                    res.status(400)
                        .json(getErrorResponse(errorTypes.INVALID_BLOCK_DATA, `Error while parsing data: ${error}`));
                        return;
                }

                const addBlockResult = Chain.addBlock(new Block({body: blockBody}));
                delete pendingStarRegistrations[req.body.address];
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
                        const blockData = JSON.parse(block);
                        const blockBody = JSON.parse(blockData.body);
                        console.log(blockBody)
                        if (status === 'INSERTED') {
                            clearInterval(interval);
                            res.status(200).json({
                                ...blockData,
                                body: blockBody
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
                    
                    try {
                        const blockData = transformBlockFromStorage(block);
                        res.status(200).json(blockData);
                    } catch (error) {
                        res.status(500)
                            .json(getErrorResponse(errorTypes.ERROR_WHILE_DECODING_BLOCK, error.message));
                    }
                });
            }
        });

    return router;
}


module.exports = getRouter;

