const express = require('express');
const router = express.Router();

const bitcoin = require('bitcoinjs-lib');
const bitcoinMessage = require('bitcoinjs-message');

const { getErrorResponse } = require('../utils/errorsHelper');
const { getCurrentTimestamp, makeValidationMessage  } = require('../utils/appHelper');
const { errorTypes } = require('../constants/errors');



// curl -X "POST" "http://localhost:8000/message-signature/validate" \
//      -H 'Content-Type: application/json; charset=utf-8' \
//      -d $'{
//   "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
//   "signature": "H6ZrGrF0Y4rMGBMRT2+hHWGbThTIyhBS0dNKQRov9Yg6GgXcHxtO9GJN4nwD2yNXpnXHTWU9i+qdw5vpsooryLU="
// }'

// {
//     "registerStar": true,
//     "status": {
//       "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
//       "requestTimeStamp": "1532296090",
//       "message": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ:1532296090:starRegistry",
//       "validationWindow": 193,
//       "messageSignature": "valid"
//     }
//   }
function getRouter(pendingWalletValidations, pendingStarRegistrations) {
    router
        .post('/validate', (req, res) => {
            console.log(req.body)
            const { address, signature } = req.body;

            if(!address || !signature) {
                //throw error
                res.status(400).json();
            }

            if (!pendingWalletValidations[address]) {
                //no validations for this wallet addres error
                res.status(404).json();
            } else {
                //check every pending validation
                const pendingValidation = pendingWalletValidations[address];
                const timestamp = getCurrentTimestamp();
                const timeDiff = timestamp - pendingValidation.requestTimestamp;
                let newValidationWindow = 300 - timeDiff;

                //update validation window
                if (newValidationWindow < 0) {
                    //send error validation window expired
                    res.status(408).json();
                    //remove from array
                        delete pendingWalletValidations[address];
                } else {
                    pendingValidation.validationWindow = newValidationWindow;
    
                    const signatureToCheck = bitcoinMessage.verify(pendingValidation.message, address, signature)
                    console.log(signatureToCheck)
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

                        // user can add one star now
                        pendingStarRegistrations[address] = {
                            requestTimestamp: pendingValidation.requestTimestamp
                        };
                        res.status(200).json(registerStarMessage);
                    } else {
                        //message validation failed
                        res.status(401).json(registerStarMessage);
                    }
                }
            }
        });

    return router;
}


module.exports = getRouter;

