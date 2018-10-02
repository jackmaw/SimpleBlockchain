
const {randomBytes} = require('crypto');

const BLOCK_STATUSES = {
    ENQUEUED: 'ENQUEUED',
    INSERTED: 'INSERTED',
    REJECTED: 'REJECTED',
    PROCESSING: 'PROCESSING'
};

const MEMPOOL_LIMIT = 1000;
let isQueueLocked = false;

class Mempool {
    constructor() {
      this.blocksByJobId = {};
      this.blocks = [];
    }
    
    putBlock(block) {
      const jobId = randomBytes(16).toString('hex');
      const status = BLOCK_STATUSES.ENQUEUED;

      const blockWithJobId = {
        jobId,
        block,
        status
      };

      if (this.blocks.length === MEMPOOL_LIMIT) {
        //Remove oldest block
        const oldestBlock = this.blocks.shift();
        delete blocksByJobId[oldestBlock.jobId];
      }

      this.blocks.push(blockWithJobId);
      this.blocksByJobId[jobId] = blockWithJobId;

      return {
          status,
          jobId
      };
    }
  
    getBlock() {
      const nextBlock = this.blocks.shift();
      if (nextBlock) {
          this.blocksByJobId[nextBlock.jobId].status = BLOCK_STATUSES.PROCESSING;
      }

      return nextBlock;
    }

    checkBlock(jobId) {
        if (this.blocksByJobId[jobId]) {
            return this.blocksByJobId[jobId];
        }
    }

    updateBlockStatus(jobId, status, block, error) {
        if (this.blocksByJobId[jobId]) {
            this.blocksByJobId[jobId].status = status;
            this.blocksByJobId[jobId].block = block;

            if (error) {
                this.blocksByJobId[jobId].error = error;
            }
        }
    }

    lockQueue() {
        isQueueLocked = true;
    }

    unlockQueue() {
        isQueueLocked = false;
    }

    isQueueLocked() {
        return isQueueLocked;
    }
}

module.exports = {
    Mempool,
    BLOCK_STATUSES
}