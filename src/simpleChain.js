/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require('crypto-js/sha256');

const blocksStorageInterface = require('./blockStorageInterface');
const { readBlocksData, getBlockData, putBlockIntoStorage } = blocksStorageInterface;
const Mempool = require('./Mempool').Mempool;

const MINING_INTERVAL = 500;
let processQueueTimer = null;

/* ===== Block Class ==============================
|  Class with a constructor for block 			   |
|  ===============================================*/

class Block{
	constructor(data){
     this.hash = "",
     this.height = 0,
     this.body = data,
     this.time = 0,
     this.previousBlockHash = ""
    }
}

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

class Blockchain {
  constructor(){
    this.Mempool = new Mempool();
    this._initializeProceesingBlocks((error, isBlockchainEmpty) => {
        //Because we persist our blockchain we need to check if it has some blocks already 
        //If so, skip adding genesis block
        if (isBlockchainEmpty) {
          this.addBlock(new Block("First block in the chain - Genesis block"));
        }
        this.scheduleProccesingBlocks();
    });
  }

  _initializeProceesingBlocks(callback) {
    let isBlockchainEmpty = true;
    const callbacks = {
      onRead: (error, data) => { 
        isBlockchainEmpty = false; 
      },
      onError: (error) => { 
        this._unableToReadDataStream(error);
      },
      onClose: () => { 
        callback(null, isBlockchainEmpty); 
      }
    };
  
    readBlocksData({keys: true, limit: 1}, callbacks);
  }

  scheduleProccesingBlocks() {
    processQueueTimer = setTimeout(() => {
        this.processMempool();
      }, MINING_INTERVAL);
  }

  processMempool() {
    if (!this.Mempool.isQueueLocked()) {
      console.info('Process next item from mempool');
      this.Mempool.lockQueue();
      const newBlock = this.Mempool.getBlock();

      if(newBlock) {
        this.addBlockToDB(newBlock);
      }
    }

    this.scheduleProccesingBlocks();
  }

  addBlock(newBlock) {
    this.Mempool.putBlock(newBlock);
  }

  _getCurrentTime() {
    return new Date().getTime().toString().slice(0,-3);
  }

  _getBlockHash(newBlock) {
    return  SHA256(JSON.stringify(newBlock)).toString();
  }

  _buildNextBlock(height, previousBlockHash, newBlock) {
    const BlockToAdd = newBlock;
    BlockToAdd.height = height;
    BlockToAdd.previousBlockHash = previousBlockHash;
    BlockToAdd.time = this._getCurrentTime();
    BlockToAdd.hash = this._getBlockHash(BlockToAdd);

    return BlockToAdd;
  }

  // Add new block
  addBlockToDB(newBlock) {
    console.info('Attempt to add new block to db');
    let nextIndex = 0;
    let lastBlock = null;
    
    const callbacks = {
      onRead: (error, data) => { 
        nextIndex = parseInt(data.key, 10) + 1;
        lastBlock = data.value;
      },
      onError: (error) => { 
        this._unableToReadDataStream(error);
      },
      onClose: () => {
        const lastBlockHash = lastBlock ? JSON.parse(lastBlock).hash : null;
        const BlockToAdd = this._buildNextBlock(nextIndex, lastBlockHash, newBlock);
        this.addLevelDBData(nextIndex, BlockToAdd);
      }
    };

    readBlocksData({reverse: true, limit: 1}, callbacks);
  }

  addLevelDBData(key, value) {
    // if ( (12 < key && key > 18) || (45 > key && key < 54)) {
    //   console.log("HACKER ATTACKS!!")
    //   value.hash = Math.random();
    // }
    putBlockIntoStorage(key, JSON.stringify(value), (error) => {
      this.Mempool.unlockQueue();
      // @TODO: put back block on any error
      if (error) return console.log(`Block ${key} submission failed`, error);
      console.log('Key: ' + key);
      console.info(`Block ${value.hash} added after ${value.previousBlockHash} with height ${value.height}`);
    });
  }

  // Get block height
  getBlockHeight(callback) {
      let height = -1;

      const callbacks = {
        onRead: (error, data) => { 
          height = parseInt(data.key, 10) + 1;
        },
        onError: (error) => { 
          callback(error);
        },
        onClose: () => { 
          console.info(`Current height is: ${height}`);
          callback(null, height);
        }
      };
      
      readBlocksData({reverse: true, limit: 1}, callbacks);
  }

    // get block
  getBlock(blockHeight, callback){
      getBlockData(blockHeight, callback);
  }

    // validate block
  validateBlock(blockHeight, callback) {
      this.getBlock(blockHeight, (error, value) => {
        if (error) console.error(`Error: ${error} retrieving block: ${blockHeight}`);

        const Block = JSON.parse(value);

        // get block hash
        let blockHash = Block.hash;
        // remove block hash to test block integrity
        Block.hash = '';
        // generate block hash
        let validBlockHash = this._getBlockHash(Block);
        // Compare
        if (blockHash===validBlockHash) {
          console.info(`Block: ${blockHeight} is Valid!`)
          callback(error, true);
        } else {
          console.info(`Block # ${blockHeight} invalid hash:\n ${blockHash} <> ${validBlockHash}`);
          callback(error, false);
        }
      });

  }

   // Validate blockchain
  validateChain(callback){
      let errorLog = [];
      let previousHash = null;

      const callbacks = {
        onRead: (error, data) => {
          const key = parseInt(data.key);
          const block = JSON.parse(data.value);
  
          this.validateBlock(key, (error, isValid) => {
            let isBlockValid = isValid;
            if(previousHash) {
              isBlockValid = isBlockValid && block.previousBlockHash === previousHash;
            }

            if(!isBlockValid) {
              console.info(`${JSON.stringify(block)} is invalid`);
              errorLog.push(key);
            }
            previousHash = block.hash;
  
          });
        },
        onError: (error) => {
          callback(error, errorLog);
        },
        onClose: () => {
          callback(null, errorLog);
        }
      }

      readBlocksData(null, callbacks);
  }

  _unableToReadDataStream(error) {
      return console.warn('Unable to read data stream!', error);
  }

  _removeMempoolListener() {
    clearTimeout(processQueueTimer);
    console.info('Listening for new Blocks canceled');
  }
}

module.exports = {
  Blockchain,
  Block
}
