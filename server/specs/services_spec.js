'use strict';

var sinon = require('sinon');
var _ = require('lodash');
var Inn = require('../javascripts/gilded_rose').Inn;
var services = require('../javascripts/services');
var repositories = require('../javascripts/repositories');
var utils = require('../javascripts/utils');
var http = require('http');

var Dispatcher = services.Dispatcher;
var SellerCashUpdater = services.SellerCashUpdater;
var BadRequest = services.BadRequest;
var OrderService = services.OrderService;
var SellerService = services.SellerService;
var Reduction = services.Reduction;
var Countries = repositories.Countries;
var Sellers = repositories.Sellers;
var UrlAssembler = require('url-assembler');
var Configuration = require('../javascripts/config').Configuration;
var db = require('./db');

(function disableLogs() {
    console.info = console.error = function() {};
})();

describe('Seller Service', function() {
    var sellers, sellerService, bob;

    beforeEach(function() {
        bob = {name: 'bob', hostname: 'localhost', port: '3000', path: '/path', cash: 0, online: false};
        sellers = new Sellers(db);
        sellerService = new SellerService(sellers);
    });

    it('should register new seller', function() {
        sellerService.register('http://localhost:3000/path', 'bob');
        var sellers = sellerService.allSellers();
        expect(sellers.length).toBe(1);
        var actual = sellers.shift();
        expect(actual.name).toBe('bob');
        expect(actual.cash).toBe(0);
        expect(actual.online).toBe(false);
        expect(actual.url instanceof UrlAssembler).toBeTruthy();
        expect(actual.url.toString()).toBe('http://localhost:3000/path');
    });

    describe('scoring', function(){
        it('should compute seller\'s cash based on computed bill compliance', function() {
            let bob = {name: 'bob', cash: 0};
            sellers.save(bob);
            
            let expectedBill = {items: [{name: 'mana cake', quality: 10}]};
            let actualBill =   {items: [{name: 'mana cake', quality: 10}]};
            sellerService.updateCash(bob, expectedBill, actualBill);
            
            expect(sellerService.allSellers()).toContain({name: 'bob', cash: 100})
        });
        it('should compute seller\'s cash based on number of items in bill', function() {
            let bob = {name: 'bob', cash: 0};
            sellers.save(bob);
            
            let expectedBill = {items: [{name: 'mana cake', quality: 10}, {name: 'strange cake', quality: 10}]};
            let actualBill =   {items: [{name: 'mana cake', quality: 10}, {name: 'strange cake', quality: 10}]};
            sellerService.updateCash(bob, expectedBill, actualBill);
            
            expect(sellerService.allSellers()).toContain({name: 'bob', cash: 200})
        });
        
        it('should lose cash when the seller\'s bill is missing', function() {
            let bob = {name: 'bob', cash: 0};
            sellers.save(bob);
            
            sellerService.updateCash(bob, {items: [{name: 'mana cake', quality: 10}]}, undefined);
            
            expect(sellerService.allSellers()).toContain({name: 'bob', cash: -300})
        });
        
        it('should lose cash when the seller\'s bill does not correspond with the expected one', function() {
            var bob = {name: 'bob', cash: 0};
            sellers.save(bob);
        
            let expectedBill = {items: [{name: 'mana cake', quality: 10}, {name: 'strange cake', quality: 10}]};
            let actualBill =   {items: [{name: 'mana cake', quality: 20}, {name: 'strange cake', quality: 10}]};
            sellerService.updateCash(bob, expectedBill, actualBill);
        
            expect(sellerService.allSellers()).toContain({name: 'bob', cash: -600})
        });
        
        it('should lose cash when the seller\'s bill does not correspond with the expected one but the total is the same', function() {
            var bob = {name: 'bob', cash: 0};
            sellers.save(bob);
        
            let expectedBill = {items: [{name: 'mana cake', quality: 10}, {name: 'strange cake', quality: 20}]};
            let actualBill =   {items: [{name: 'mana cake', quality: 20}, {name: 'strange cake', quality: 10}]};
            sellerService.updateCash(bob, expectedBill, actualBill);
        
            expect(sellerService.allSellers()).toContain({name: 'bob', cash: -600})
        });
        
        it('should deduct a penalty when a seller is offline', function(){
            var bob = {name: 'bob', cash: 200, online: true};
            var offlinePenalty = 100;
            sellers.save(bob);
        
            sellerService.setOffline(bob, offlinePenalty);
        
            expect(bob.online).toBe(false);
            expect(bob.cash).toBe(100);
        });

      describe('bills comparison', function () {
        it('compares simple bills', function () {
          expect(sellerService.equivalentBills({items: []}, undefined)).toBeFalsy();

          expect(sellerService.equivalentBills({items: []}, {items: []})).toBeTruthy();

          expect(sellerService.equivalentBills({items: []}, {items: 'not an array'})).toBeFalsy();

          expect(sellerService.equivalentBills(
            {
              items: [
                {name: 'one item', quality: 1, sellIn: 5}
              ]
            },
            {items: []})
          ).toBeFalsy();

          expect(sellerService.equivalentBills(
            {
              items: [
                {name: 'one item', quality: 1, sellIn: 5}
              ]
            },
            {
              items: [
                {name: 'other item', quality: 2, sellIn: 5}
              ]
            })
          ).toBeFalsy();

          expect(sellerService.equivalentBills(
            {
              items: [
                {name: 'one item', quality: 1, sellIn: 5}
              ]
            },
            {
              items: [
                {name: 'one item', quality: 2, sellIn: 5}
              ]
            })
          ).toBeFalsy();

          expect(sellerService.equivalentBills(
            {
              items: [
                {name: 'one item', quality: 1, sellIn: 5}]
            },
            {
              items: [
                {name: 'one item', quality: 1, sellIn: 5},
                {name: 'other item', quality: 2, sellIn: 5}
              ]
            })
          ).toBeFalsy();

          expect(sellerService.equivalentBills(
            {
              items: [
                {name: 'one item', quality: 1, sellIn: 5},
                {name: 'other item', quality: 2, sellIn: 5}
              ]
            },
            {
              items: [
                {name: 'one item', quality: 1, sellIn: 5}
              ]
            })
          ).toBeFalsy();

          expect(sellerService.equivalentBills(
            {
              items: [
                {name: 'one item', quality: 1, sellIn: 5},
                {name: 'other item', quality: 2, sellIn: 5}
              ]
            },
            {
              items: [
                {name: 'one item', quality: 1, sellIn: 5},
                {name: 'other item', quality: 2, sellIn: 5}
              ]
            })
          ).toBeTruthy();
          
          expect(sellerService.equivalentBills(
            {
              items: [
                {name: 'one item', quality: 1, sellIn: 5},
              ]
            },
            {
              items: [
                {name: 'one item', quality: 1, sellIn: 10},
              ]
            })
          ).toBeFalsy();
          
          expect(sellerService.equivalentBills(
            {
              items: [
                {name: 'one item', quality: 1, sellIn: 5},
              ]
            },
            {
              items: [
                {name: 'one item', quality: 1, sellIn: 5},
              ]
            })
          ).toBeTruthy();
          
        });
        it("tolerates extra properties out of items array", function () {
          expect(sellerService.equivalentBills(
            {
              items: [
                {name: 'one item', quality: 1, sellIn: 5}
              ]
            },
            {
              items: [
                {name: 'one item', quality: 1, sellIn: 5}
              ],
              extraProperty: 'extra'
            })
          ).toBeTruthy();
        });
        it("handles duplicate item names and qualities", function () {
          expect(sellerService.equivalentBills(
            {
              items: [
                {name: 'one item', quality: 2, sellIn: 5},
                {name: 'one item', quality: 2, sellIn: 4},
                {name: 'one item', quality: 4, sellIn: 5},
                {name: 'one item', quality: 1, sellIn: 5},
              ]
            },
            {
              items: [
                {name: 'one item', quality: 1, sellIn: 5},
                {name: 'one item', quality: 2, sellIn: 4},
                {name: 'one item', quality: 2, sellIn: 5},
                {name: 'one item', quality: 4, sellIn: 5},
              ]
            })
          ).toBeTruthy();
        });
        it("tolerates extra properties on items", function () {
          expect(sellerService.equivalentBills(
            {
              items: [
                {name: 'one item', quality: 1, sellIn: 5, possessor: 'ignored'}
              ]
            },
            {
              items: [
                {name: 'one item', quality: 1, sellIn: 5, possessor: 'ignored 2'}
              ]
            })
          ).toBeTruthy();
        });
        it('compares without taking items order into account', function () {
          expect(sellerService.equivalentBills(
            {
              items: [
                {name: 'one item', quality: 1, sellIn: 5},
                {name: 'other item', quality: 2, sellIn: 5}
              ]
            },
            {
              items: [
                {name: 'other item', quality: 2, sellIn: 5},
                {name: 'one item', quality: 1, sellIn: 5}
              ]
            })
          ).toBeTruthy();
        });
        });
  
    });

    it("adds bonus to seller", function () {
        var bob = {name: 'bob', cash: 200};
        sellers.save(bob);
        
        sellerService.addBonus('bob', 1000);
        
        expect(bob.cash).toBe(1200);
    });
    it("adds bonus when seller does not exist", function () {
        var bob = {name: 'bob', cash: 200};
        sellers.save(bob);
        
        sellerService.addBonus('unknown', 1000);
        
        expect(bob.cash).toBe(200);
    });
    
    it('should send notification to seller', function() {
        spyOn(utils, 'post');
        var message = {type: 'info', content: 'test'};

        sellerService.notify(bob, message);

        expect(utils.post).toHaveBeenCalledWith('localhost', '3000', '/path/feedback', message);
    });

    it('should get seller\'s cash history reduced in chunks of N iterations', function() {
        sellers.cashHistory = {'bob': [0, 0, 10, 10, 10]};

        var cashHistory = sellerService.getCashHistory(5);

        expect(cashHistory).toEqual({history: {'bob': [10]}, lastIteration: 5});
    });

    it('should get seller\'s cash history reduced in chunks of N iterations and add remaining iterations when last chunk is not completed', function() {
        sellers.cashHistory = {'bob': [0, 0, 10, 10, 10, 10, 10]};

        var cashHistory = sellerService.getCashHistory(3);

        expect(cashHistory).toEqual({history: {'bob': [10, 10, 10]}, lastIteration: 7});
    });

    it('should authorized unknown seller', function() {
        expect(sellerService.isAuthorized('carmen', 'mccallum')).toEqual(true);
    });

    it('should authorized seller if the same username and password are provided', function() {
        var travis = {name: 'travis', password:'pacman'};
        sellers.save(travis);

        expect(sellerService.isAuthorized('travis', 'pacman')).toEqual(true);
        expect(sellerService.isAuthorized('travis', 'vlad')).toEqual(false);
    });
});

describe('Order Service', function() {
    var orderService, configuration;
    var countries;
    var itemNames = ['+5 Dexterity Vest', 'Aged Brie', 'Elixir of the Mongoose', 'Sulfuras, Hand of Ragnaros', 'Backstage passes to a TAFKAL80ETC concert', 'Conjured Mana Cake', 'Conjured Muffin'];
    var itemOwners = ['Barbarian', 'Paladin', 'Peon', 'Blacksmith', 'Soldier', 'Wizard', 'Priest'];

    beforeEach(function(){
        configuration = new Configuration();
        orderService = new OrderService(configuration);
        countries = new Countries(configuration);
    });

    it('should send order to seller', function() {
        spyOn(utils, 'post');
        var order = {
            items: [{
                name: "SULFURAS",
                sellIn: 5,
                quality: 10
            }],
            daysElapsed: 3
        };
        var cashUpdater = function() {};
        var onError = function() {};

        orderService.sendOrder({hostname: 'localhost', port: '3000', path: '/test'}, order, cashUpdater, onError);

        expect(utils.post).toHaveBeenCalledWith('localhost', '3000', '/test/order', order, cashUpdater, onError);
    });

    describe('create order', function() {
        const ITEM_COUNT = 3;
        var order;
        beforeEach(function(){
            spyOn(_, "random").andCallFake(function (min, max) {
                if (min === 1 && max === 10) {
                    return ITEM_COUNT;
                } else if (min === 1 && max === 50) {
                    return 42;
                } else if (min === 1 && max === 20) {
                    return 12;
                } else if (min === 1 && max === 100) {
                    return 25;
                }
                throw new Error("unexpected min and max");
            });
            spyOn(_, "shuffle").andCallFake(_.identity);

            order = orderService.createOrder();
        });
        it('should create an order with maximum 10 items', function() {
            expect(order.items.length).toEqual(ITEM_COUNT);
        });
        it('should create an order with random sellIn', function(){
            expect(_.pluck(order.items, "sellIn")).toEqual(_.times (ITEM_COUNT, _.constant(25)));
        });
        it('should create an order with random quality', function(){
            expect(_.pluck(order.items, "quality")).toEqual(_.times(ITEM_COUNT, _.constant(42)));
        });
        it('should create an order with random daysElapsed', function(){
            expect(order.daysElapsed).toEqual(12);
        });
        it('should create orders with item names', function() {
            var order = orderService.createOrder();
            expect(_.every(_.pluck(order.items, "name"), String)).toBeTruthy();
            expect(itemNames).toContain(order.items[0].name);
        });
        it('should create orders with owner', function() {
            var order = orderService.createOrder();
            expect(_.every(_.pluck(order.items, "owner"), String)).toBeTruthy();
            expect(itemOwners).toContain(order.items[0].owner);
        });
    });

    describe('bill', function(){
      it('should calculate the new qualities of items', function() {
          spyOn(configuration, 'all').andReturn({});
          const dexterityVest = {
              name: "+5 Dexterity Vest",
              sellIn: 5,
              quality: 10
          }
          const manaCake = {
              name: "Conjured Mana Cake",
              sellIn: 5,
              quality: 10
          }
          let order = {items: [dexterityVest, manaCake], daysElapsed: 2}
  
          let bill = orderService.bill(order);

          let expectedBill = {
            items: [{name: '+5 Dexterity Vest', sellIn: 3, quality: 8}, {
              name: 'Conjured Mana Cake',
              sellIn: 3,
              quality: 6
            }]
          };
          expect(bill).toEqual(expectedBill);
      });
  
      it('should not validate bill when items field is missing', function() {
          expect(function(){orderService.validateBill({})}).toThrow('The field \"items\" in the response is missing.');
      });
  
      it('should not validate bill when items is not an array', function() {
          expect(function(){orderService.validateBill({items: 'not an array'})}).toThrow('\"items\" is not an array.');
      });
    });
});

describe('Dispatcher', function() {
    var dispatcher, orderService, sellerService, configuration, counter;

    beforeEach(function(){
        configuration = new Configuration();
        sellerService = new SellerService();
        orderService = new OrderService(configuration);
        dispatcher = new Dispatcher(sellerService, orderService, configuration);
        counter = {
          current() { return 8 },
          next() { return 8 }
        }
        spyOn(counter, 'next').andReturn(8)
    });

    it('should load configuration for reductions', function() {
        spyOn(configuration, 'all').andReturn({reduction: 'HALF PRICE',
            badRequest: {
                active:false
            }
        });
        spyOn(dispatcher, 'sendOrderToSellers').andCallFake(function(){});

        dispatcher.startBuying(counter);

        expect(dispatcher.sendOrderToSellers).toHaveBeenCalledWith(Reduction.HALF_PRICE, 8, false);
    });

    it('should broadcast a bad request', function() {
        spyOn(configuration, 'all').andReturn({
            reduction: 'HALF PRICE',
            badRequest: {
                active:true,
                period:2
            }
        });
        spyOn(dispatcher, 'sendOrderToSellers').andCallFake(function(){});

        dispatcher.startBuying(counter);

        expect(dispatcher.sendOrderToSellers).toHaveBeenCalledWith(Reduction.HALF_PRICE, 8, true);
    });

    it('should send the same order to each seller using reduction', function() {
        spyOn(configuration, 'all').andReturn({});
        var alice = {name: 'alice', hostname : 'seller', port : '8080', path : '/', cash: 0};
        var bob = {name: 'bob', hostname : 'seller', port : '8081', path : '/', cash: 0};
        spyOn(sellerService, 'addCash');
        spyOn(sellerService, 'allSellers').andReturn([alice, bob]);
        var order = {prices: [100, 50], quantities: [1, 2], country: 'IT'};
        spyOn(orderService, 'createOrder').andReturn(order);
        spyOn(orderService, 'sendOrder');

        dispatcher.sendOrderToSellers(Reduction.STANDARD);

        expect(orderService.createOrder).toHaveBeenCalled();
        expect(orderService.sendOrder).toHaveBeenCalledWith(alice, order, jasmine.any(Function), jasmine.any(Function));
        expect(orderService.sendOrder).toHaveBeenCalledWith(bob, order, jasmine.any(Function), jasmine.any(Function));
    });

    describe('startBuying', function () {
      beforeEach(function () {
        spyOn(global, 'setTimeout')
        spyOn(console, 'info')
        spyOn(dispatcher, 'sendOrderToSellers')
        spyOn(configuration, 'all').andReturn({
          badRequest: {
            active: false
          }
        })
      })

      it('calls sendOrderToSellers with a reduction and iteration number', function () {
        dispatcher.startBuying(counter);
        expect(dispatcher.sendOrderToSellers).toHaveBeenCalledWith(Reduction.STANDARD, 8, false)
      })

      it('schedules its next execution', function () {
        dispatcher.startBuying(counter);
        expect(global.setTimeout).toHaveBeenCalledWith(jasmine.any(Function), 5000)
      })
    })
});

describe('Seller\'s cash updater', function() {
    var sellerCashUpdater, configuration, sellerService, orderService, configurationTestDouble;

    beforeEach(function() {
        configuration = {
            all: function() {
                return configurationTestDouble
            }
        };
        sellerService = new SellerService();
        orderService = new OrderService(configuration);
        sellerCashUpdater = new SellerCashUpdater(sellerService, orderService, configuration);
        configurationTestDouble = {gameIsStarted: true}
    });

    it('should deduct a penalty when the sellers\'s response is neither 200 nor 404', function() {
        var bob = {name: 'bob', hostname : 'seller', port : '8081', path : '/', cash: 0};
        spyOn(sellerService, 'setOnline');
        spyOn(sellerService, 'updateCash');

        sellerCashUpdater.doUpdate(bob, {total: 100}, -1)({statusCode: 400});

        expect(sellerService.updateCash).toHaveBeenCalledWith(bob, {total: 100}, undefined, -1);
    });

    it('should NOT update cash when the game is not started', function() {
        configurationTestDouble = {gameIsStarted:false};
        var bob = {name: 'bob', hostname : 'seller', port : '8081', path : '/', cash: 0};
        spyOn(sellerService, 'setOnline');
        spyOn(sellerService, 'updateCash');

        sellerCashUpdater.doUpdate(bob, {total: 100}, -1)({statusCode: 400});

        expect(sellerService.updateCash).not.toHaveBeenCalled();
    });

    it('should NOT deduct a penalty when the sellers\'s response is 404', function() {
        var bob = {name: 'bob', hostname : 'seller', port : '8081', path : '/', cash: 0};
        spyOn(sellerService, 'setOnline');
        spyOn(sellerService, 'updateCash');

        sellerCashUpdater.doUpdate(bob, {total: 100}, -1)({statusCode: 404});

        expect(sellerService.updateCash).not.toHaveBeenCalled();
    });
});

describe('BadRequest', function(){
    var badRequest, sellerService, sellers, configuration;

    beforeEach(function(){
        configuration = new Configuration();
        sellers = new Sellers(db);
        sellerService = new SellerService(sellers);
        badRequest = new BadRequest(configuration);
    });

    it('should suggest bad request periodically', function() {
        spyOn(configuration, 'all').andReturn({badRequest: {
            active: true,
            period: 3,
            modes: [1,2,3,4,5,6,7,8,9,10]
        }});

        expect(badRequest.shouldSendBadRequest(1)).toEqual(false);
        expect(badRequest.shouldSendBadRequest(2)).toEqual(false);
        expect(badRequest.shouldSendBadRequest(3)).toEqual(true);
        expect(badRequest.shouldSendBadRequest(4)).toEqual(false);
        expect(badRequest.shouldSendBadRequest(6)).toEqual(true);
        expect(badRequest.shouldSendBadRequest(7)).toEqual(false);
    });

    it('should not suggest bad request if not activated', function() {
        spyOn(configuration, 'all').andReturn({badRequest: {
            active: false,
            period: 3,
            modes: [1,2,3,4,5,6,7,8,9,10]
        }});

        expect(badRequest.shouldSendBadRequest(1)).toEqual(false);
        expect(badRequest.shouldSendBadRequest(2)).toEqual(false);
        expect(badRequest.shouldSendBadRequest(3)).toEqual(false);
        expect(badRequest.shouldSendBadRequest(4)).toEqual(false);
        expect(badRequest.shouldSendBadRequest(6)).toEqual(false);
        expect(badRequest.shouldSendBadRequest(7)).toEqual(false);
    });

    it('should randomly corrupt order', function() {
        spyOn(configuration, 'all').andReturn({badRequest: {
            modes: [1,2,3,4,5,6,7,8,9,10]
        }});

        var order =  {
            "prices":[64.73,29.48,73.49,58.88,46.61,65.4,16.23],
            "quantities":[8,3,10,6,5,9,5],
            "country":"FR",
            "reduction":"STANDARD"
        };

        var corrupted = badRequest.corruptOrder(order);

        expect(corrupted).not.toEqual(order);
    });

    it('should deduct cash if response status is not "bad request"', function() {
        var self = {sellerService: sellerService},
            seller = {name: "alice", cash: 200},
            expectedBill={total:47},
            currentIteration = 17;
        spyOn(sellerService, 'deductCash');
        spyOn(sellerService, 'notify');

        var fun = badRequest.updateSellersCash(self, seller, expectedBill, currentIteration);

        fun({statusCode: 200});

        expect(sellerService.deductCash).toHaveBeenCalledWith(seller, 23.5, currentIteration);
    });
    
    it('should add cash if response status is "bad request"', function() {
        var self = {sellerService: sellerService},
            seller = {name: "alice", cash: 200},
            expectedBill={total:47},
            currentIteration = 17;
        spyOn(sellerService, 'addCash');
        spyOn(sellerService, 'notify');

        var fun = badRequest.updateSellersCash(self, seller, expectedBill, currentIteration);

        fun({statusCode: 400});

        expect(sellerService.addCash).toHaveBeenCalledWith(seller, 47, currentIteration);
    });
});

describe('Standard Reduction', function() {
    var standardReduction;

    beforeEach(function() {
        standardReduction = Reduction.STANDARD;
    });

    it('should de reduced by 15% when total is bigger than 50,000', function() {
        expect(standardReduction.reductionFor(50001)).toBe(0.15);
    });

    it('should de reduced by 10% when total is between [10,000, 50,000)', function() {
        expect(standardReduction.reductionFor(10000)).toBe(0.10);
        expect(standardReduction.reductionFor(10500)).toBe(0.10);
    });

    it('should de reduced by 7% when total is between [7,000, 10,000)', function() {
        expect(standardReduction.reductionFor(7000)).toBe(0.07);
        expect(standardReduction.reductionFor(7500)).toBe(0.07);
    });

    it('should be reduced by 5% when total is between [5,000, 7,000)', function() {
        expect(standardReduction.reductionFor(5000)).toBe(0.05);
        expect(standardReduction.reductionFor(5500)).toBe(0.05);
    });

    it('should be reduced by 3% when total is between [1,000, 5,000)', function() {
        expect(standardReduction.reductionFor(1000)).toBe(0.03);
        expect(standardReduction.reductionFor(1100)).toBe(0.03);
    });

    it('should not be reduced when when the total between [0, 1,000)', function() {
        expect(standardReduction.reductionFor(500)).toBe(0.00);
    });
});
