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

module.exports = {
    haltOnTimedout
};