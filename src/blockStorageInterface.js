const level = require('level');

//We need that to be able to use keys as numbers
const lexint = require('lexicographic-integer-encoding')('hex')
const chainDB = './chaindata';
const db = level(chainDB, {keyEncoding: lexint});

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

function getBlockData(blockHeight, callback) {
    db.get(blockHeight, (error, value) => {callback(error, value)});
}

function putBlockIntoStorage(key, value, callback) {
    db.put(key, value, callback);
}

module.exports = {
    readBlocksData,
    getBlockData,
    putBlockIntoStorage
};