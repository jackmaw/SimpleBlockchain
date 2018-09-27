/* ===== Block Class ==============================
|  Class with a constructor for block 			   |
|  ===============================================*/
const SHA256 = require('crypto-js/sha256');

class Block {
	constructor(data){
    this.hash = data.hash || null,
    this.height = data.height || 0,
    this.body = data.value,
    this.time = data.time || 0,
    this.previousBlockHash = data.previousBlockHash || null;
  }

  setHeight(height) {
    this.height = height;
  }

  setPreviousBlockHash(previousBlockHash) {
    this.previousBlockHash = previousBlockHash;
  }

  setTime() {
    //We dont slice here, because it returns unix timestamp
    this.time = new Date().getTime().toString();
  }


  setBlockHash() {
    this.hash = null;
    this.hash = SHA256(JSON.stringify(this.toString())).toString();
  }

  getBlockHash() {
    return this.hash;
  }

  getPreviousBlockHash() {
    return this.previousBlockHash;
  }

  getHeight() {
    return this.height;
  }

  getTime() {
    return this.time;
  }

  toString() {
    return JSON.stringify(this);
  }
}

module.exports = {
    Block
}