var sinon = require('sinon');
var proxyquire = require('proxyquire');
var path = require('path');

var sublevel = {sub: function () {}};
describe('the db service', function () {
  var $sublevel, $level;
  var expected = {expected: 'database'};
  beforeEach(() => $sublevel = sinon.mock(sublevel))
  afterEach(() => $sublevel.restore())
  beforeEach(() => {
    $level = sinon.stub().returns(expected);
  })

  var dbService; 
  beforeEach(() => dbService = proxyquire('../javascripts/services/db', {
    'level': $level,
    './config': { name: 'some-name' }
  }));

  it('configures a LevelDB connection', function () {
    var expectedPath = path.join(__dirname, '..', 'data', 'some-name');
    expect(dbService).toBe(expected);
    expect($level.calledWith(expectedPath)).toBe(true, 'wrong arguments called')
  });
});
