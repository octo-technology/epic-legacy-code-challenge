var conf = require('../conf'),
    request = require('request'),
    server = require('../lib/server'),
    serverInstance;

describe('Default server', function () {
  beforeEach(function() {
    serverInstance = server.start(conf, function() {
      return {"items":[{"name":"Aged Brie","sellIn":6,"quality":7}]};
    });
  });
  afterEach(function() {
    serverInstance.close();
  });

  it('should handle feedback', function(done) {
    var feedback = request({url: 'http://' + conf.host + ':' + conf.port + '/feedback', method: 'POST'}, function (error, response) {
      expect(response.statusCode).toBe(200);
      done();
    });
    feedback.write('{"type": "INFO", "content": "this is my precious feedback"}');
  });

  it('should handle order', function(done) {
    var order = request({url: 'http://' + conf.host + ':' + conf.port + '/order', method: 'POST'}, function (error, response, body) {
      expect(response.statusCode).toBe(200);
      expect(body).toBe('{"items":[{"name":"Aged Brie","sellIn":6,"quality":7}]}');
      done();
    });
    order.write('{"items": [{"name": "Aged Brie","sellIn":10,"quality":3}],"daysElapsed":4}');
  });
});
