var repositories = require('../repositories');
var _ = require('lodash');
var Inn = require('../gilded_rose').Inn;
var utils = require('../utils'),
    colors = require('colors');

function OrderService (configuration) {
  this.countries = new repositories.Countries(configuration);
}

module.exports = OrderService;

var service = OrderService.prototype;

service.sendOrder = function (seller, order, cashUpdater, logError) {
  console.info(colors.grey('Sending order ' + utils.stringify(order) + ' to seller ' + utils.stringify(seller)));
  utils.post(seller.hostname, seller.port, seller.path + '/order', order, cashUpdater, logError);
};

service.createOrder = function () {
    var itemCount = _.random(1, 10);
    var items = new Array(itemCount);
    for (var item = 0; item < itemCount; item++) {
        var name = _.shuffle(Inn.activeItemNames())[0];
        var sellIn = _.random(1, 100);
        var quality = _.random(1, 50);
        var owner = _.shuffle(Inn.owners())[0];
        items[item] = Inn.createItem(name , sellIn, quality, owner);
    }

    return {
        items: items,
        daysElapsed: _.random(1, 20)
    }
};

service.bill = function (order) {
  let items = _.cloneDeep(order.items);
  let shop = new Inn(items);
  for (var i = 0; i < order.daysElapsed; i++) {
    shop.updateQuality()
  }
  return shop;
}

service.validateBill = function (bill) {
  if(!_.has(bill, 'items')) {
    throw {message: 'The field \"items\" in the response is missing.'};
  }

  if(!_.isArray(bill.items)) {
    throw {message: '\"items\" is not an array.'};
  }
}
