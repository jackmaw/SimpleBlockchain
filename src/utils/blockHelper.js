/**
 * Checks if height is valid block height
 * @param {Number} height 
 */
function isValidHeight(height) {
    return !Number.isNaN(height) && Number.isInteger(height) && height >= 0;
}

/**
 * Reads string from fromEncoding to toEncoding
 * @param {String} stringToRead 
 * @param {String} fromEncoding 
 * @param {String} toEncoding 
 */
function readStringBuffer(stringToRead, fromEncoding, toEncoding) {
    return Buffer.from(stringToRead, fromEncoding).toString(toEncoding);
}

/**
 * Parse block from JSON format and decodes star story from hex to ascii format
 * @param {*} block 
 */
function transformBlockFromStorage(block) {
    let blockData = JSON.parse(block);
    let blockBody = JSON.parse(blockData.body);
     
    blockBody.star.story = readStringBuffer(blockBody.star.story, 'hex', 'ascii');
    blockData.body = blockBody;

    return blockData;
}

module.exports = {
    isValidHeight,
    readStringBuffer,
    transformBlockFromStorage
}