
const {randomBytes} = require('crypto');
let isQueueLocked = false;

class Mempool {
    constructor() {
      //puchnie - komentarz
      this.blocksByJobId = {};
      this.blocks = [];
    }
  
    putBlock(block) {
      const jobId = randomBytes(16).toString('hex');
      const status = 'ENQUEUED';
      const blockWithJobId = {
        jobId,
        block,
        status
      };
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
          this.blocksByJobId[nextBlock.jobId].status = 'PROCESSING';
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
    Mempool
}