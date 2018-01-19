'use strict';

const _ = require('lodash');
const Inn = require('../javascripts/gilded_rose').Inn;
const Item = require('../javascripts/gilded_rose').Item;

describe('Gilded Rose', function () {
    let inn;

    beforeEach(function () {
        inn = new Inn();
    });

    describe('item creation', function () {
        it('should create item with quality, sellIn', function () {
            const item = Inn.createItem('name', 12, 22);
            expect(item).toEqual(new Item('name', 12, 22));
        });

        it('should always create "Sulfuras, Hand of Ragnaros" with sellIn of 0 and quality of 80', function () {
            const item = Inn.createItem('Sulfuras, Hand of Ragnaros', _.random(1, 100), _.random(1, 50));
            expect(item).toEqual(new Item('Sulfuras, Hand of Ragnaros', 0, 80));
        });
        it('should create item with quality, sellIn and owner', function () {
            const item = Inn.createItem('name', 12, 22, 'Wizard');
            expect(item).toEqual(new Item('name', 12, 22, 'Wizard'));
            expect(item.owner).toEqual('Wizard');
        });
    });

    describe('with basic items', function () {
        beforeEach(function () {
            inn.items.push(new Item('+5 Dexterity Vest', 10, 20));
            inn.items.push(new Item('Aged Brie', 2, 0));
            inn.items.push(new Item('Elixir of the Mongoose', 5, 7));
            inn.items.push(new Item('Sulfuras, Hand of Ragnaros', 0, 80));
            inn.items.push(new Item('Backstage passes to a TAFKAL80ETC concert', 15, 20));
        });

        it('should_not_change_quality_nor_sellIn_for_sulfuras', function () {
            // When
            inn.updateQuality();

            // Then
            expect(inn.items[3].quality).toEqual(80);
            expect(inn.items[3].sellIn).toEqual(0);

            // once again
            makeALongTimePass();

            // Then
            expect(inn.items[3].quality).toEqual(80);
            expect(inn.items[3].sellIn).toEqual(0);
        });

        it('should_decrease_sellIn_for_all_products_but_sulfuras', function () {
            // When
            inn.updateQuality();

            // Then
            expect(inn.items[0].sellIn).toEqual(9);
            expect(inn.items[1].sellIn).toEqual(1);
            expect(inn.items[2].sellIn).toEqual(4);
            expect(inn.items[4].sellIn).toEqual(14);

            // once again
            inn.updateQuality();

            // Then
            expect(inn.items[0].sellIn).toEqual(8);
            expect(inn.items[1].sellIn).toEqual(0);
            expect(inn.items[2].sellIn).toEqual(3);
            expect(inn.items[4].sellIn).toEqual(13);
        });

        it('should_decrease_quality_for_general_products', function () {
            // When
            inn.updateQuality();

            // Then
            expect(inn.items[0].quality).toEqual(19);
            expect(inn.items[2].quality).toEqual(6);

            // once again
            inn.updateQuality();

            // Then
            expect(inn.items[0].quality).toEqual(18);
            expect(inn.items[2].quality).toEqual(5);
        });

        it('should_increase_quality_for_brie_and_backstage_pass', function () {
            // When
            inn.updateQuality();

            // Then
            expect(inn.items[1].quality).toEqual(1);
            expect(inn.items[4].quality).toEqual(21);
        });

        it('should_decrease_quality_twice_for_general_products_when_sell_by_date_has_passed', function () {
            [0, 2].forEach(function (itemIdx) {
                // Given
                let item = inn.items[itemIdx];

                moveToLastDayBeforeSellByDate(item);

                let qualityBeforeUpdate = item.quality;

                // When
                inn.updateQuality();

                // Then
                let expectedQuantities = [qualityBeforeUpdate - 2, 0];

                expect(expectedQuantities.indexOf(item.quality)).toBeGreaterThan(-1);
            });
        });

        it('should_never_set_quality_below_0', function () {
            makeALongTimePass();

            inn.items.forEach(function (item) {
                expect(item.quality).not.toBeLessThan(0);
            });
        });

        it('should_never_set_quality_above_50_except_for_sulfuras', function () {
            makeALongTimePass();

            inn.items.forEach(function (item) {
                if (item !== inn.items[3]) {
                    expect(item.quality).not.toBeGreaterThan(50);
                }
            });
        });

        it('should_increase_brie_quality_by_2_when_sell_by_date_is_passed', function () {
            // Given
            moveToLastDayBeforeSellByDate(inn.items[1]);

            let qualityBeforeUpdate = inn.items[1].quality;

            // When
            inn.updateQuality();

            // Then
            expect(inn.items[1].quality).toEqual(qualityBeforeUpdate + 2);
        });

        it('should_increase_backstage_passes_quality_by_2_when_concert_is_in_10_days_or_less', function () {
            // Given
            moveToNthDayBeforeSellByDate(inn.items[4], 10);

            let qualityBeforeUpdate = inn.items[4].quality;

            // When
            inn.updateQuality();

            // Then
            expect(inn.items[4].quality).toEqual(qualityBeforeUpdate + 2);
        });

        it('should_increase_backstage_passes_quality_by_3_when_concert_is_in_5_days_or_less', function () {
            // Given
            moveToNthDayBeforeSellByDate(inn.items[4], 5);

            let qualityBeforeUpdate = inn.items[4].quality;

            // When
            inn.updateQuality();

            // Then
            expect(inn.items[4].quality).toEqual(qualityBeforeUpdate + 3);
        });

    });

    describe('with item started with negative quality', function () {
        beforeEach(function () {
            inn.items.push(new Item('Conjured Mana Cake', 10, 1));
        });

        it('should consider negative quality is equal to zero', function () {
            // When
            inn.updateQuality();

            // Then
            expect(inn.items[0].quality).toEqual(0);
        });
    });

    describe('with conjured items', function () {
        beforeEach(function () {
            inn.items.push(new Item('Conjured Mana Cake', 3, 6));
            inn.items.push(new Item("Conjured Muffin", 1, 5));
        });

        it('should_decrease_quality_twice_as_fast_for_conjured_items', function () {
            // When
            inn.updateQuality();

            // Then
            expect(inn.items[0].quality).toEqual(4);
            expect(inn.items[1].quality).toEqual(3);

            // once again
            inn.updateQuality();

            // Then
            expect(inn.items[0].quality).toEqual(2);
            expect(inn.items[1].quality).toEqual(0);
        });

        it('should_decrease_quality_twice_for_general_products_when_sell_by_date_has_passed', function () {
            // Given
            let item = inn.items[0];

            moveToLastDayBeforeSellByDate(item);

            let qualityBeforeUpdate = item.quality;

            // When
            inn.updateQuality();

            // Then
            let expectedQuantities = [qualityBeforeUpdate - 2, 0];

            expect(expectedQuantities.indexOf(item.quality)).toBeGreaterThan(-1);
        });

    });

    describe('with philosopher\'s stone', function () {
        beforeEach(function () {
            inn.items.push(new Item('Philosopher\'s stone', 12, 42));
            inn.items.push(new Item("Conjured Muffin", 1, 5));
            inn.items.push(new Item('Elixir of the Mongoose', 5, 7));
            inn.items.push(new Item('Aged Brie', 2, 0));
        });

        it('should not update quality of all items', function () {
            // When
            inn.updateQuality();

            // Then
            expect(inn.items[0].quality).toEqual(42);
            expect(inn.items[1].quality).toEqual(5);
            expect(inn.items[2].quality).toEqual(7);
            expect(inn.items[3].quality).toEqual(0);
        })
    });
    describe('with negative quality', function () {
        beforeEach(function () {
            inn.items.push(new Item("Conjured Muffin", 1, -5));
            inn.items.push(new Item('Elixir of the Mongoose', 5, -7));
            inn.items.push(new Item('Aged Brie', 2, -1));
        });

        it('should consider quality as if it was positive', function () {
            // When
            inn.updateQuality();

            // Then
            expect(inn.items[0].quality).toEqual(3);
            expect(inn.items[1].quality).toEqual(6);
            expect(inn.items[2].quality).toEqual(2);
        })
    });

    describe('owned by a barbarian', function () {
        it("should decrease quality of barbarian's items twice as fast", function () {
            // Given
            inn.items.push(new Item("Conjured Muffin", 1, 5, 'Anyone'));
            inn.items.push(new Item('Elixir of the Mongoose', 5, 7, 'Barbarian'));
            inn.items.push(new Item('Backstage passes to a TAFKAL80ETC concert', 5, 5, 'Barbarian'));
            
            // When
            inn.updateQuality();

            // Then
            expect(inn.items[0].quality).toEqual(3);
            expect(inn.items[1].quality).toEqual(5); // Barbabian decreases quality twice
            expect(inn.items[2].quality).toEqual(8); // Barbarian does not increase quality twice
        });
        it("should increase quality of wizard's items twice as fast", function () {
            // Given
            inn.items.push(new Item('Backstage passes to a TAFKAL80ETC concert', 5, 5, 'Anyone'));
            inn.items.push(new Item('Elixir of the Mongoose', 5, 7, 'Wizard'));
            inn.items.push(new Item('Backstage passes to a TAFKAL80ETC concert', 5, 5, 'Wizard'));
            
            // When
            inn.updateQuality();

            // Then
            expect(inn.items[0].quality).toEqual(8);
            expect(inn.items[1].quality).toEqual(6); // Wizard does not decrease quality twice 
            expect(inn.items[2].quality).toEqual(11); // Wizard increases quality twice
        });
        it("should let quality to zero when backstage pass expires and is owned by a barbarian", function () {
            // Given
            inn.items.push(new Item('Backstage passes to a TAFKAL80ETC concert', 0, 5, 'Barbarian'));
            
            // When
            inn.updateQuality();

            // Then
            expect(inn.items[0].quality).toEqual(0);
        })
    });

    describe("Unobtainium", function () {
      it("gets the lost quality of other items", function () {
         // Given
         inn.items.push(new Item('Unobtainium Axe', 5, 10));
         inn.items.push(new Item('Backstage passes to a TAFKAL80ETC concert', 5, 5));
         inn.items.push(new Item('Elixir of the Mongoose', 5, 7));
         inn.items.push(new Item('Unobtainium Sword', 5, 20));
         inn.items.push(new Item('Elixir of the Mongoose', 5, 7));
         
         // When
         inn.updateQuality();

         // Then
         expect(inn.items[0].quality).toEqual(12);
         expect(inn.items[1].quality).toEqual(8);
         expect(inn.items[2].quality).toEqual(6);
         expect(inn.items[3].quality).toEqual(22);
         expect(inn.items[4].quality).toEqual(6); 
      });
      it("gets the lost quality twice when owned by a wizard", function () {
         // Given
         inn.items.push(new Item('Elixir of the Mongoose', 5, 7));
         inn.items.push(new Item('Unobtainium Sword', 5, 20, 'Wizard'));
         inn.items.push(new Item('Elixir of the Mongoose', 5, 7));
         
         // When
         inn.updateQuality();

         // Then
         expect(inn.items[0].quality).toEqual(6);
         expect(inn.items[1].quality).toEqual(24);
         expect(inn.items[2].quality).toEqual(6); 
      });
    });

    const makeALongTimePass = () => {
        for (let i = 0; i < 200; i++) {
            inn.updateQuality();
        }
    };

    const moveToLastDayBeforeSellByDate = (item) => {
        moveToNthDayBeforeSellByDate(item, 1);
    };

    const moveToNthDayBeforeSellByDate = (item, n) => {
        const limit = item.sellIn - n + 1;
        for (let i = 0; i < limit; i++) {
            inn.updateQuality();
        }
    };

});
