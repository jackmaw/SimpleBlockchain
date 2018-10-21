const express = require('express');
const router = express.Router();

const { getErrorResponse } = require('../utils/errorsHelper');
const { getCurrentTimestamp, makeValidationMessage  } = require('../utils/appHelper');
const { errorTypes } = require('../constants/errors');
const { VALIDATION_WINDOW } = require('../constants/star');

function getRouter(pendingWalletValidations) {
    router
        .post('/', (req, res) => {
            const address = req.body.address;

            if (!address) {
                res.status(400)
                    .json(getErrorResponse(errorTypes.INVALID_WALLET_ADDRESS_IN_REQUEST, 'Invalid wallet address'));
            }

            const timestamp = getCurrentTimestamp();
            const responseBody = {
                address,
                requestTimestamp: timestamp,
                message: makeValidationMessage(address, timestamp),
                validationWindow: VALIDATION_WINDOW
            };
            
            pendingWalletValidations[address] = responseBody;
            res.status(200).json(responseBody);
        });

    return router;
}


module.exports = getRouter;

