const level = require('level');

//We need that to be able to use keys as numbers
const lexint = require('lexicographic-integer-encoding')('hex')
const chainDB = './chaindata';
const db = level(chainDB, {keyEncoding: lexint});

/**
 * Creates stream which read values based on readOptions from leveldb
 * @param {Object} readOptions - all valid leveldb.createReadStream options 
 * @param {Object} callbacks
 * @param {Function} callbacks.onRead
 * @param {Function} callbacks.onError
 * @param {Function} callbacks.onClose
 */
function readBlocksData(readOptions, callbacks) {
    const { onRead, onError, onClose } = callbacks;

    db.createReadStream(readOptions)
        .on('data', (data) => { 
            onRead(null, data);
        })
        .on('error', (error) => { 
            onError(error, null);
        })
        .on('close', () => {
            onClose();
        });
}

/**
 * Creates stream which read single block based on key
 * @param {Object} blockHeight
 * @param {Function} callback
 */
function getBlockData(blockHeight, callback) {
    db.get(blockHeight, (error, value) => {callback(error, value)});
}

/**
 * Put value into the leveldb based on key
 * @param {String} key 
 * @param {String} value 
 * @param {FUnction} callback 
 */
function putBlockIntoStorage(key, value, callback) {
    db.put(key, value, callback);
}

module.exports = {
    readBlocksData,
    getBlockData,
    putBlockIntoStorage
};