module.exports = Persisting;

function Persisting (db, name, fields) {
  var self = this;
  var key = name + '-backup';
  fields = fields.slice()
  db.get(key, {sync: true}, function (err, value) {
    if (err) return;
    var backup = JSON.parse(value);
    for (field of fields) {
      if (backup.hasOwnProperty(field)) {
        self[field] = backup[field];
      }
    }
  });

  this.sync = function () {
    var backup = fields.reduce((backup, f) => {
      return Object.assign({[f]: self[f]}, backup);
    }, {})
    db.put(key, JSON.stringify(backup));
  }

  if (!process.env.TEST) {
    setInterval(this.sync, 1000);
  }
}
