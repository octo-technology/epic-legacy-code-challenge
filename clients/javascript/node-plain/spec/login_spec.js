var applyLogic = require('../lib/logic.js');
describe('test', function () {
    it('should test something', function () {
        var reqBody = {
            items: [
                {
                    name: "Aged Brie",
                    sellIn: 6,
                    quality: 7
                },
                {
                    name: "Aged Brie",
                    sellIn: 3,
                    quality: 1
                }
            ],
            daysElapsed: 2
        };
        var result = applyLogic(reqBody)
        expect(result.items).toEqual([
                        {
                            name: "Aged Brie",
                            sellIn: 4,
                            quality: 9
                        },
                        {
                            name: "Aged Brie",
                            sellIn: 1,
                            quality: 3
                        }
                    ])
    });
})