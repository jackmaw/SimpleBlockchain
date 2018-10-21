const express = require('express');
const router = express.Router();

const bitcoin = require('bitcoinjs-lib');
const bitcoinMessage = require('bitcoinjs-message');

const { getErrorResponse } = require('../utils/errorsHelper');
const { getCurrentValidationWindow  } = require('../utils/appHelper');
const { errorTypes } = require('../constants/errors');
const { VALIDATION_WINDOW } = require('../constants/star');

function getRouter(pendingWalletValidations, pendingStarRegistrations) {
    router
        .post('/validate', (req, res) => {
            const { address, signature } = req.body;

            if (!address) {
                res.status(400)
                    .json(getErrorResponse(errorTypes.INVALID_WALLET_ADDRESS_IN_REQUEST, 'Invalid wallet address'));
            }

            if (!signature) {
                res.status(400)
                    .json(getErrorResponse(errorTypes.INVALID_SIGNATURE_IN_REQUEST, 'No signature was provided'));
            }

            if (!pendingWalletValidations[address]) {
                res.status(404)
                    .json(getErrorResponse(errorTypes.NO_PENDING_WALLIDATION_FOR_WALLET, `There is no pending validation for wallet: ${address}`));
            } else {
                const pendingValidation = pendingWalletValidations[address];  
                let newValidationWindow = getCurrentValidationWindow(pendingValidation.requestTimestamp, VALIDATION_WINDOW);
                
                if (newValidationWindow < 0) {
                    res.status(408)
                        .json(getErrorResponse(errorTypes.VALIDATION_WINDOW_EXPIRES, `Validation window expires for wallet: ${address}`));
                    delete pendingWalletValidations[address];
                } else {
                    pendingValidation.validationWindow = newValidationWindow;
    
                    const signatureToCheck = bitcoinMessage.verify(pendingValidation.message, address, signature)
                    const registerStarMessage = {
                        registerStar: false,
                        status: {
                            ...pendingValidation,
                            messageSignature: "invalid"
                        }
                    }
                    if (signatureToCheck) {
                        registerStarMessage.registerStar = true;
                        registerStarMessage.status.messageSignature = "valid";

                        pendingStarRegistrations[address] = {
                            requestTimestamp: pendingValidation.requestTimestamp
                        };
                        res.status(200).json(registerStarMessage);
                    } else {
                        res.status(403)
                            .json(getErrorResponse(errorTypes.MESSAGE_VALIDATION_FAILED, `Signature verification failed`));
                    }
                }
            }
        });

    return router;
}


module.exports = getRouter;

