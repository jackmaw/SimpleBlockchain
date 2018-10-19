const isEmpty = require('lodash/isEmpty');
const express = require('express');
const router = express.Router();

const { getErrorResponse } = require('../utils/errorsHelper');
const { isValidHeight } = require('../utils/blockHelper');
const { errorTypes } = require('../constants/errors');
const { checkStatusConstants } = require('../constants/block');
const { getCurrentTimestamp } = require('../utils/appHelper');

// curl -X "POST" "http://localhost:8000/block" \
//      -H 'Content-Type: application/json; charset=utf-8' \
//      -d $'{
//   "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
//   "star": {
//     "dec": "-26° 29'\'' 24.9",
//     "ra": "16h 29m 1.0s",
//     "story": "Found star using https://www.google.com/sky/"
//   }
// }'

// {
//     "hash": "a59e9e399bc17c2db32a7a87379a8012f2c8e08dd661d7c0a6a4845d4f3ffb9f",
//     "height": 1,
//     "body": {
//       "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
//       "star": {
//         "ra": "16h 29m 1.0s",
//         "dec": "-26° 29' 24.9",
//         "story": "466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f"
//       }
//     },
//     "time": "1532296234",
//     "previousBlockHash": "49cce61ec3e6ae664514d5fa5722d86069cf981318fc303750ce66032d0acff3"
//   }
function getRouter(Chain, Block, pendingStarRegistrations) {
    router
        .post('/', (req, res) => {
            //maybe add validate star
            if (!req.body || !req.body.address || isEmpty(req.body.star)) {
                res.status(400)
                    .json(getErrorResponse(errorTypes.INVALID_BLOCK_DATA, 'Block body not provided'));
            } else {
                let blockBody = null;

                try {
                    const {address, star} = req.body;
                    console.info(pendingStarRegistrations)
                    //check if address is allowed to add new star
                    if (!pendingStarRegistrations[address]) {
                        throw new Error('Address not authorized');
                    }

                    const timestamp = getCurrentTimestamp();
                    const timeDiff = timestamp - pendingStarRegistrations[address].requestTimestamp;
                    let newValidationWindow = 300 - timeDiff;

                    //check if validation window expires
                    if (newValidationWindow <= 0) {
                        delete pendingStarRegistrations[address];
                        throw new Error('Validation window expires');
                    }
                    const checkStarStorySize = Buffer.byteLength(star.story, 'ascii');

                    if (checkStarStorySize > 500) {
                        throw new Error('Star story size to large');
                    }

                    const encodedStarStory = Buffer.from(star.story, 'ascii').toString('hex');
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

                console.info(blockBody)
                const addBlockResult = Chain.addBlock(new Block({body: blockBody}));
                delete pendingStarRegistrations[req.address];
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

