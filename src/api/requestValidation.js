const express = require('express');
const router = express.Router();

const { getErrorResponse } = require('../utils/errorsHelper');
const { getCurrentTimestamp, makeValidationMessage  } = require('../utils/appHelper');
const { errorTypes } = require('../constants/errors');

var bitcoin = require('bitcoinjs-lib') // v3.x.x
var bitcoinMessage = require('bitcoinjs-message')


// curl -X "POST" "http://localhost:8000/requestValidation" \
//      -H 'Content-Type: application/json; charset=utf-8' \
//      -d $'{
//   "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ"
// }'

// response: {
//     "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
//     "requestTimeStamp": "1532296090",
//     "message": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ:1532296090:starRegistry",
//     "validationWindow": 300
//   }
function getRouter(pendingWalletValidations) {
    router
        .post('/', (req, res) => {
            const address = req.body.address;

            if (!address) {
                //send error
                res.status(404).json();
            }

            const timestamp = getCurrentTimestamp();
            const responseBody = {
                address,
                requestTimestamp: timestamp,
                message: makeValidationMessage(address, timestamp),
                validationWindow: 300
            };
            
            pendingWalletValidations[address] = responseBody;
            res.status(200).json(responseBody);
        });

    return router;
}


module.exports = getRouter;

