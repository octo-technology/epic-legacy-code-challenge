var sinon = require('sinon');
var util = require('util');

var Persisting = require('../javascripts/repositories/persisting');

function Repo (db) {
  this.hello = ['world'];
  Persisting.call(this, db, 'my-repo', ['hello']);
}

var Database = {
  get: function () {},
  put: function () {}
}

describe('A persisting respository', function () {
  beforeEach(function () {
    sinon.stub(global, 'setInterval')
    process.env.TEST='';
  })
  afterEach(function () {
    global.setInterval.restore();
    process.env.TEST='true';
  })

  describe('given a levelDB connection', function () {
    var $db;
    beforeEach(() => $db = sinon.mock(Database));
    afterEach(() => $db.restore());
    it('gets its backup synchronously', function () {
      $db.expects('get').withArgs('my-repo-backup', {sync: true});

      var repo = new Repo(Database);

      $db.verify();
    });

    describe('if there is no backup', function () {
      it('uses the default values', function () {
        $db.expects('get').callsArgWith(2, {notFound: true})
        var repo = new Repo(Database);
        expect(repo.hello).toEqual(['world'])
      })
    })

    describe('if there is a backup', function () {
      it('restores the data', function () {
        $db.expects('get').callsArgWith(2, null, JSON.stringify({hello: ['old', 'data']}));
        var repo = new Repo(Database);
        expect(repo.hello).toEqual(['old', 'data'])
      });

      describe('that contains no data for a given field', function () {
        it('keeps the default data', function () {
        $db.expects('get').callsArgWith(2, null, JSON.stringify({}));
        var repo = new Repo(Database);
        expect(repo.hello).toEqual(['world'])
        });
      })
    })

    it('schedules saves at a regular interval', function () {
      var repo = new Repo(Database);
      expect(global.setInterval.calledOnce).toBe(true, 'setInterval not called');
      expect(global.setInterval.calledWith(repo.sync, 1000)).toBe(true, 'wrong arguments for setInterval')
    });

    describe('.sync()', function () {
      beforeEach(() => $db.expects('get').callsArgWith(2, {notFound: true}))
      it('write its fields to disk', function () {
        $db.expects('put').withArgs('my-repo-backup', JSON.stringify({hello: ['my', 'new', 'data']}));
        var repo = new Repo(Database);
        repo.hello = ['my', 'new', 'data'];

        repo.sync();

        $db.verify()
      })
    })
  })
});
