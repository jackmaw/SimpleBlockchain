let isQueueLocked = false;

class Mempool {
    constructor() {
      this.blocks = [];
    }
  
    putBlock(block) {
      this.blocks.push(block);
    }
  
    getBlock() {
      return this.blocks.shift();
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