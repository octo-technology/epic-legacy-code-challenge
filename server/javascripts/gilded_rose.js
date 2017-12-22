'use strict';

const _ = require('lodash');
const DEFAULT_MAX_QUALITY = 50;
const SULFURAS_QUALITY = 80;
const EXPIRATION_DAY = 0;
const MINIMUM_QUALITY = 0;
const TEN_DAYS_LEFT = 10;
const FIVE_DAYS_LEFT = 5;


class Item {
    constructor(name, sellIn, quality, owner) {
        this.name = name;
        this.sellIn = sellIn;
        this.quality = quality;
        this.owner = owner;
    }
}

class Inn {
    constructor(items=[]) {
        this.items = items;
    }

    updateQuality() {
        if (this.containsPhilosopherStone()) {
            return this.items;
        }

        let totalLostQuality = 0;
        this.items.forEach(item => {
            if(item.quality < 0 ) {
                item.quality = -item.quality;
            }
        })
        this.items.forEach(item => {
            let previousQuality =  item.quality;
            switch (item.name) {
                case 'Sulfuras, Hand of Ragnaros':
                case 'Unobtainium Axe':
                case 'Unobtainium Sword':
                    break;
                case 'Aged Brie' :
                    Inn.updateAgedBrie(item);
                    break;
                case 'Backstage passes to a TAFKAL80ETC concert' :
                    Inn.updateBackstage(item);
                    break;
                case 'Conjured Mana Cake':
                case 'Conjured Muffin':
                    Inn.updateConjured(item);
                    break;
                default :
                    Inn.updateDefault(item);
                    break;
            }
            let qualityDifference = item.quality - previousQuality;
            if(qualityDifference < 0) {
                totalLostQuality -= qualityDifference
            }
        });
        
        this.items
          .filter(item => item.name === 'Unobtainium Axe' || item.name === 'Unobtainium Sword')
          .forEach(item => Inn.updateUnobtainium(item, totalLostQuality));
    };

    containsPhilosopherStone() {
        return _.some(this.items, function (item) {
            return 'Philosopher\'s stone' === item.name;
        });
    }

    static createItem(name, sellIn, quality, owner) {
        if (name === 'Sulfuras, Hand of Ragnaros') {
            return new Item(name, 0, 80, owner);
        }
        return new Item(name, sellIn, quality, owner);
    }


    static activeItemNames() {
        return [
            '+5 Dexterity Vest',
            'Aged Brie',
            'Elixir of the Mongoose',
            'Sulfuras, Hand of Ragnaros',
            'Backstage passes to a TAFKAL80ETC concert',
            // 'Conjured Mana Cake',
            // 'Conjured Muffin',
            // 'Philosopher\'s stone',
            // 'Unobtainium Axe',
            // 'Unobtainium Sword',
        ];
    }

    static owners() {
        return [
          'Paladin', 
          'Peon', 
          'Blacksmith', 
          'Soldier', 
          'Priest',
          'Gobelin',
          'Hobbit',
          'Dwarf',
          'Elf',
          'Leprechaun',
          // 'Barbarian',
          // 'Wizard'
        ];
    }

    static updateAgedBrie(item) {
        Inn.increaseQualityForItem(item, 1);
        Inn.dailyDecreaseSellIn(item);
        if (item.sellIn < EXPIRATION_DAY) {
            Inn.increaseQualityForItem(item, 1);
        }
    }

    static updateConjured(item) {
        Inn.decreaseQualityForItem(item, 2);
        Inn.dailyDecreaseSellIn(item);
        if (item.sellIn < EXPIRATION_DAY) {
            Inn.decreaseQualityForItem(item, 2);
        }
    }
    
    static updateUnobtainium(item, totalLostQuality) {
        Inn.increaseQualityForItem(item, totalLostQuality);
    }

    static updateBackstage(item) {
        this.changeBackstageQualityDependingOnDaysLeft(item);
        Inn.dailyDecreaseSellIn(item);
        if (item.sellIn < EXPIRATION_DAY) {
            item.quality = 0;
        }
    }

    static changeBackstageQualityDependingOnDaysLeft(item) {
        if (item.sellIn > TEN_DAYS_LEFT) {
            Inn.increaseQualityForItem(item, 1);
        } else if (item.sellIn <= TEN_DAYS_LEFT && item.sellIn > FIVE_DAYS_LEFT) {
            Inn.increaseQualityForItem(item, 2);
        } else if (item.sellIn <= FIVE_DAYS_LEFT) {
            Inn.increaseQualityForItem(item, 3);
        }
    }

    static updateDefault(item) {
        Inn.decreaseQualityForItem(item, 1);
        Inn.dailyDecreaseSellIn(item);
        if (item.sellIn < EXPIRATION_DAY) {
            Inn.decreaseQualityForItem(item, 1);
        }
    }

    static dailyDecreaseSellIn(item) {
        item.sellIn -= 1;
    }

    static increaseQualityForItem(item, quantity) {
        if(item.owner === 'Wizard') {
            quantity *= 2;
        }
        const nonNegativeQuality = Math.max(MINIMUM_QUALITY, item.quality);
        item.quality = Math.min(DEFAULT_MAX_QUALITY, nonNegativeQuality + quantity);
    }

    static decreaseQualityForItem(item, quantity) {
        if(item.owner === 'Barbarian') {
            quantity *= 2;
        }
        item.quality = Math.max(MINIMUM_QUALITY, item.quality - quantity);
    }
}


module.exports = {
    Inn,
    Item
};