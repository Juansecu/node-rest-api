const { createHmac } = require('crypto');

const config = require('../config');

// Hash helper
/**
 * @description Encrypt a string using SHA256 algorithm.
 *
 * @param {string} str
 */
const hashHelper = function (str) {
    if (typeof str === 'string' && str.length) {
        const hash = createHmac('sha256', config.hashingSecret)
            .update(str)
            .digest('hex');
        return hash;
    }

    throw new Error('String expected with a truly length');
};

module.exports = hashHelper;
