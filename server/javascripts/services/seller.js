var url = require('url');
var utils = require('../utils');
var UrlAssembler = require('url-assembler');
var _ = require('lodash');
var colors = require('colors');

function SellerService (_sellers) {
  this.sellers = _sellers;
}
module.exports = SellerService;

var service = SellerService.prototype;

service.addCash = function (seller, amount, currentIteration) {
  this.sellers.updateCash(seller.name, amount, currentIteration);
};

service.deductCash = function (seller, amount, currentIteration) {
  this.sellers.updateCash(seller.name, -amount, currentIteration);
};

service.getCashHistory = function (chunk) {
  var cashHistory = this.sellers.cashHistory;
  var cashHistoryReduced = {};
  var lastIteration;

  var seller;
  for(seller in cashHistory) {
    cashHistoryReduced[seller] = [];

    var i = 0;
    for(; i < cashHistory[seller].length; i++) {
      if((i + 1) % chunk === 0) {
        cashHistoryReduced[seller].push(cashHistory[seller][i]);
      }
    }

    if(i % chunk !== 0) {
      cashHistoryReduced[seller].push(cashHistory[seller][i - 1]);
    }

    lastIteration = i;
  }

  return {history: cashHistoryReduced, lastIteration: lastIteration};
};

service.isAuthorized = function (name, password) {
  var seller = this.sellers.get(name);
  if(seller) {
    var samePwd = (seller.password === password);
    console.info('Attempt to re-register %s, same password %j', name, samePwd);
    return samePwd;
  }
  return true;
};

service.register = function (sellerUrl, name, password) {
  var parsedUrl = url.parse(sellerUrl);
  var seller = {
    name: name,
    password: password,
    hostname: parsedUrl.hostname,
    port: parsedUrl.port,
    path: parsedUrl.path,
    cash: 0.0,
    online: false,
    url: new UrlAssembler(sellerUrl)
  };
  this.sellers.save(seller);
  console.info('New seller registered: ' + utils.stringify(seller))
};

service.allSellers = function () {
  return this.sellers.all();
};

service.updateCash = function (seller, expectedBill, actualBill, currentIteration) {
  try {
    var message,cashLoss, cashedEarned, nbItems;
    nbItems = expectedBill.items.length;
    cashLoss = 300 * nbItems;
    cashedEarned = 100 * nbItems;

    if(_.isEmpty(actualBill)) {
      this.deductCash(seller, cashLoss, currentIteration);
      message = 'Goddamn, ' + seller.name + ' has neither sent us a valid bill nor responded 404. ' + cashLoss + ' will be charged.';
      this.notify(seller, {'type': 'ERROR', 'content': message});
    }

    else {
      if(service.equivalentBills(expectedBill, actualBill)) {
        this.addCash(seller, cashedEarned, currentIteration);
        this.notify(seller, {'type': 'INFO', 'content': 'Hey, ' + seller.name + ' earned ' + cashedEarned});
      }

      else {
        this.deductCash(seller, cashLoss, currentIteration);
        message = 'Goddamn, ' + seller.name + ' replied ' + JSON.stringify(actualBill) + ' but right answer was ' + JSON.stringify(expectedBill) + '. ' + cashLoss + ' will be charged.';
        this.notify(seller, {'type': 'ERROR', 'content': message});
      }
    }
  }
  catch (exception) {
    this.notify(seller, {'type': 'ERROR', 'content': exception.message});
  }
};

service.equivalentBills = function(expectedBill, actualBill) {
  if (!(actualBill && _.isArray(actualBill.items))) return false;
  if (expectedBill.items.length !== actualBill.items.length) return false;
  return _.isEqual(comparableItemsOf(expectedBill), comparableItemsOf(actualBill));
  
  function comparableItemsOf(bill) {
    return _(bill.items).map(relevantProperties).sortByAll(['name','quality','sellIn']).value();
  }
  function relevantProperties(item) {
    return _.pick(item, ['name','quality','sellIn']);
  }
};

service.addBonus = function (sellerName, bonus) {
  var seller = this.sellers.get(sellerName);
  if(seller === undefined) {
    console.error(colors.red('seller ' + sellerName + ' not found'));
  } else {
    seller.cash += bonus;
    console.info(colors.blue(sellerName + ' got ' + bonus + ' bonus'));
  }
};
service.setOffline = function (seller, offlinePenalty, currentIteration) {
  this.sellers.setOffline(seller.name);

  if(offlinePenalty !== 0) {
    console.info('Seller ' + seller.name + ' is offline: a penalty of ' + offlinePenalty + ' is applied.');
    this.deductCash(seller, offlinePenalty, currentIteration);
  }
};

service.setOnline = function (seller) {
  this.sellers.setOnline(seller.name);
};

service.notify = function (seller, message) {
  utils.post(seller.hostname, seller.port, seller.path + '/feedback', message);

  if(message.type === 'ERROR') {
    console.error('Notifying ' + seller.name + ': ' + message.content);
  } else {
    console.info('Notifying ' + seller.name + ': ' + message.content);
  }
};
