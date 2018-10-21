/**
 * Checks timeout after every middleware; it will stop the request flow on a timeout
 * http://expressjs.com/en/resources/middleware/timeout.html
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */

function haltOnTimedout (req, res, next) {
    if (!req.timedout) next();
}

function getCurrentTimestamp() {
    return Date.now() / 1000 | 0;
}

function getCurrentValidationWindow(requestTimestamp, validationWindow) {
    const timeDiff = getCurrentTimestamp() - requestTimestamp;
    return validationWindow - timeDiff;
}

function makeValidationMessage(walletAddress, timestamp) {
    if (!walletAddress || !timestamp) {
        throw new Error('Cannot create validation message: Invalid parameters');
    }

    return `${walletAddress}:${timestamp}:starRegistry`;
}

module.exports = {
    haltOnTimedout,
    getCurrentTimestamp,
    makeValidationMessage,
    getCurrentValidationWindow
};