process.env.TEST = 'true';
module.exports = {
  get() {
    var cb = [].shift.call(arguments);
    if (typeof cb === 'function') {
      var e = Error('NotFound');
      e.notFound = true
      db(e)
    }
  },
  put() {}
}
