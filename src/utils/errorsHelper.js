/**
 * Normalizes error responses
 * @param {String} error - should be errorType from constants/errors.js
 * @param {String} message 
 */
function getErrorResponse(error, message) {
    return {
        error,
        message
    }
}

module.exports = {
    getErrorResponse
}