var util = require('util');
var Persisting = require('../repositories/persisting');

module.exports = IterationCounter;

util.inherits(IterationCounter, Persisting);
function IterationCounter (db) {
  this.counter = 0;
  Persisting.call(this, db, 'iteration-counter', ['counter']);
}

IterationCounter.prototype.current = function () {
  return this.counter;
}

IterationCounter.prototype.next = function () {
  var next = ++this.counter;
  this.sync();
  return next;
}
