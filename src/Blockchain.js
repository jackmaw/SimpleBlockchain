/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/
const storageInterface = require('./storageInterface');
const { readBlocksData, getBlockData, putBlockIntoStorage } = storageInterface;
const Mempool = require('./Mempool').Mempool;
const Block = require('./Block').Block;

const MINING_INTERVAL = 500; //ms
let processQueueTimer = null;

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

class Blockchain {
  constructor(){
    //On my machine, levelDb cannot handle adding block if it happens to fast.
    //Thus I needed to add some queue in form of mempool between levelDb and the blockchain 
    //Publish/Subscriber would be better but i choose scheduler for simplicity.
    this.Mempool = new Mempool();
    this._checkIfEmpty((error, isBlockchainEmpty) => {
        //Because we persist our blockchain we need to check if it has some blocks already 
        //If so, skip adding genesis block
        if (isBlockchainEmpty) {
          this.addBlock(new Block({body: "First block in the chain - Genesis block"}));
        }

        this.scheduleProccesingBlocks();
    });
  }

  /**
   * Checks if genesis block was already added to the blockchain
   * @param {*} callback 
   */
  _checkIfEmpty(callback) {
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

  /**
   * Takes next block to process after MINING_INTERVAL passed
   */
  scheduleProccesingBlocks() {
    processQueueTimer = setTimeout(() => {
        this.processMempool();
      }, MINING_INTERVAL);
  }

  /**
   * Get next block from mempool and adds it into the blockchain
   */
  processMempool() {
    if (!this.Mempool.isQueueLocked()) {
      console.info('Process next item from mempool');
      this.Mempool.lockQueue();
      const newBlock = this.Mempool.getBlock();

      if(newBlock) {
        this.addBlockToDB(newBlock);
      }
    } else {
      this.scheduleProccesingBlocks();
    }
  }

  /**
   * Adds block to the blockchain 
   * @param {Block} newBlock 
   */
  addBlock(newBlock) {
    this.Mempool.putBlock(newBlock);
  }

  /**
   * Add all mandatory data into block and return it
   * @param {Number} height 
   * @param {String} previousBlockHash 
   * @param {Block} newBlock 
   */
  _buildNextBlock(height, previousBlockHash, newBlock) {
    newBlock.setHeight(height);
    newBlock.setPreviousBlockHash(previousBlockHash);
    newBlock.setTime();
    newBlock.setBlockHash();

    return newBlock;
  }

  /**
   * Reads last block height and hash, creates new block and attempt to put block into db
   * @param {Block} newBlock 
   */
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

  /**
   * Adds block into db
   * @param {Number} key 
   * @param {Block} BlockToAdd 
   */
  addLevelDBData(key, BlockToAdd) {
    // if ( (12 < key && key < 18) || (45 < key && key < 54)) {
    //   console.log("HACKER ATTACKS!!")
    //   BlockToAdd.hash = Math.random();
    // }
    putBlockIntoStorage(key, BlockToAdd.toString(), (error) => {
      if (error) {
        this.Mempool.putBlock(BlockToAdd, 1);
        console.log(`Block ${key} submission failed`, error);
      } else {
        console.info('Key: ' + key);
        console.info(`Block ${BlockToAdd.getBlockHash()} added after ${BlockToAdd.getPreviousBlockHash()} with height ${BlockToAdd.getHeight()}`);  
      }

      this.Mempool.unlockQueue();
      this.scheduleProccesingBlocks();
    });
  }

/**
 * Get blockchain height - which is number of blocks + 1 already in blockchain
 * @param {Function} callback 
 */
  getBlockHeight(callback) {
      let height = 0;

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

/**
 * Reads block from db based on its height
 * @param {Number} blockHeight 
 * @param {Function} callback 
 */
  getBlockFromStorage(blockHeight, callback){
      getBlockData(blockHeight, callback);
  }

/**
 * Validates block - check if its hash its correct
 * @param {Number} blockHeight 
 * @param {Function} callback 
 */
  validateBlock(blockHeight, callback) {
    this.getBlockFromStorage(blockHeight, (error, value) => {
      if (error) this._unableToReadBlock(error);

      const BlockToCheck = new Block(JSON.parse(value));

      // get block hash
      let blockHash = BlockToCheck.getBlockHash();
      // set block hash again to test block integrity
      BlockToCheck.setBlockHash();
      // generate block hash
      let validBlockHash = BlockToCheck.getBlockHash();
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


/**
 * Validates whole blockchain - checks every block hash and if it links to the previous one
 * @param {Function} callback 
 */
   validateChain(callback){
    let errorLog = [];
    let previousHash = null;
    let currentKey = 0;

    //I found that leveldb mess up elements order in like 1/5 attempts when using reading stream, 
    //we need to use getBlockFromStorage then
    this.getBlockHeight((error, height) => {
      if (error) {
        callback(error, null);
        return;
      }

      if (height === 0) {

        callback(null, true, errorLog);

      } else {
        const that = this;

        (function checkNextBlock(key){
          setTimeout(() => {
            that.getBlockFromStorage(key, (error, value) => {
              if (error) { 
                that._unableToReadBlock(error);
              } else {
                const block = new Block(JSON.parse(value));
    
                that.validateBlock(block.getHeight(), (error, isValid) => {
                  let isBlockValid = isValid && block.previousBlockHash === previousHash;
    
                  if(!isBlockValid) {
                    console.info(`${JSON.stringify(block)} is invalid`);
                    errorLog.push(block.getHeight());
                  }
                  previousHash = block.hash;

                  key++;
                  if (key < height) {
                    checkNextBlock(key);
                  } else {
                    callback(null, !errorLog.length, errorLog);
                  }
                });
              }
            });
          }, 0);
        })(currentKey);
      }
    });
}

/**
 * Error handling when reading stream of data from db failed
 * @param {Error} error 
 */
  _unableToReadDataStream(error) {
    return console.warn('Unable to read data stream!', error);
  }

/**
 * Error handling when reading single value fails
 * @param {Error} error 
 */
  _unableToReadBlock(error) {
    return console.error(`Error: ${error} retrieving block: ${blockHeight}`);
  }

  /**
   * Utility method which allow us to stop processing blocks, for tests or if something bad happens
   */
  _removeMempoolListener() {
    clearTimeout(processQueueTimer);
    console.info('Listening for new Blocks canceled');
  }
}

module.exports = {
  Blockchain
}
