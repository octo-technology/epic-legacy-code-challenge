var Shop = require('../gilded-rose/gilded_rose');
/**
 * Where all the logic should be executed (http entry point)
 *
 * @param {Object} reqBody - http request body payload
 * @return {Object} response that will be returned as json
 * @api public
 */
var applyLogic = function (reqBody) {
    let shop = new Shop(reqBody.items);
    for (var i = 0; i < reqBody.daysElapsed; i++) {
        shop.updateQuality()
    }
    return {
        items: shop.items
    };
};

module.exports = applyLogic;
