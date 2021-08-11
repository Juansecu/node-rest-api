const { readdirSync } = require('fs');

const helpers = {};

for (const file of readdirSync(__dirname)) {
    if (file.endsWith('.helper.js')) {
        const helperName = file.replace('.helper.js', '');
        const helper = require(`./${file}`);

        helpers[helperName] = helper;
    }
}

module.exports = helpers;
