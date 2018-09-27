const Blockchain = require('./src/Blockchain').Blockchain;
const Block = require('./src/Block').Block;

let blockchain = new Blockchain("man_test");

(function theLoop (i) {
  setTimeout(function () {
    blockchain.addBlock(new Block({body: 'Testing data'}));
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
  blockchain.getBlockHeight(() => {});

  blockchain.validateChain((err, isValid, errorLog) => {
    if (!isValid) {
      console.log('Invalid blocks: ' + errorLog);
    } else {
      console.log('Blockchain is valid')
    }
  });
}, 100 * 600 + 100 * 220);
