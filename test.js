const Blockchain = require('./src/simpleChain').Blockchain;
const Block = require('./src/simpleChain').Block;

let blockchain = new Blockchain("man_test");

(function theLoop (i) {
  setTimeout(function () {
    blockchain.addBlock(new Block('Testing data'));
    if (--i) theLoop(i);
  }, 50);
})(100);

setTimeout(() => {
  blockchain._removeMempoolListener();

  (function theLoop (i) {
    setTimeout(function () {
      blockchain.validateBlock(i, () => {});
      if (--i) theLoop(i);
    }, 200);
  })(100);
}, 100 * 600);

setTimeout(() => {
  blockchain.getBlockHeight(() => {})

  blockchain.validateChain((err, errorLog) => {
    if (errorLog.length) {
      console.log('Invalid blocks: ' + errorLog);
    } else {
      console.log('Blockchain is valid')
    }
  });
}, 100 * 600 + 100 * 250);
