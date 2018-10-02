/**
 * Checks if height is valid block height
 * @param {Number} height 
 */
function isValidHeight(height) {
    return !Number.isNaN(height) && Number.isInteger(height) && height >= 0;
}

module.exports = {
    isValidHeight
}