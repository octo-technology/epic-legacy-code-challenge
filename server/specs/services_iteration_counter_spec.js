var IterationCounter = require('../javascripts/services/iteration-counter');
var Persisting = require("../javascripts/repositories/persisting");

var Database = {
  get: function () {},
  put: function () {}
}

describe('IterationCounter', function () {
  var iterationCounter;
  beforeEach(function () {
    iterationCounter = new IterationCounter(Database);
    spyOn(iterationCounter, 'sync')
  })
  it('is a persisting repository', function () {
    expect(iterationCounter instanceof Persisting).toBe(true);
  })

  describe('.current()', function () {
    it('gives the current iteration number', function () {
      expect(iterationCounter.current()).toEqual(0);
    })
  })

  describe('.next()', function () {
    it('gives the next iteration number', function () {
      expect(iterationCounter.next()).toEqual(1);
    })

    it('changes the current iteration number', function () {
      iterationCounter.next();
      expect(iterationCounter.current()).toEqual(1);
    })

    it('calls its sync method', function () {
      iterationCounter.next();
      expect(iterationCounter.sync).toHaveBeenCalled()
    });
  })
})
