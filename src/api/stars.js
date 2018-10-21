const express = require('express');
const router = express.Router();

const { getErrorResponse } = require('../utils/errorsHelper');
const { errorTypes } = require('../constants/errors');
const { transformBlockFromStorage } = require('../utils/blockHelper');

function getRouter(Chain) {
    router
        .get('/address:walletAddress', (req, res) => {
            const walletAddress = req.params.walletAddress.slice(1);

            if (!walletAddress) {
                res.status(400)
                    .json(getErrorResponse(errorTypes.INVALID_WALLET_ADDRESS_IN_REQUEST, 'Invalid wallet address'));
            }

            const found = [];
            const callbacks = {
                onRead: (error, data) => {
                    if (error) {
                        console.warn(error);
                    } else {
                        let blockData = transformBlockFromStorage(data.value);

                        if (blockData.body.address === walletAddress) {
                            found.push(blockData);
                        }
                    }
                },
                onError: (error) => {
                    console.warn(error);
                },
                onClose: () => {
                    res.status(200).json(found);
                }
            }

            Chain.readAllBlocks({gt: 0}, callbacks);
        })
        .get('/hash:hashId', (req, res) => {
            const hashId = req.params.hashId.slice(1);
            if (!hashId) {
                res.status(400)
                    .json(getErrorResponse(errorTypes.INVALID_HASH_IN_REQUEST, 'Invalid hash provided'));
            }

            let found = null;
            const callbacks = {
                onRead: (error, data) => {
                    if (error) {
                        console.warn(error);
                    } else {
                        if (!found) {
                            let blockData = transformBlockFromStorage(data.value);
    
                            if (blockData.hash === hashId) {
                                found = blockData;
                            }
                        }
                    }
                },
                onError: (error) => {
                    res.status(500).json(error)
                },
                onClose: () => {
                    res.status(200).json(found);
                }
            }

            Chain.readAllBlocks({gt: 0}, callbacks);
        });

    return router;
}


module.exports = getRouter;

