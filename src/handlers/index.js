// Import the readdirSync function from path module
const { readdirSync } = require('fs');

// Define the handlers object
const handlers = {};

for (const file of readdirSync('./src/handlers')) {
    if (file.endsWith('.handler.js')) {
        const handlerName = file.replace('.handler.js', '');
        const handler = require(`./${file}`);

        if (typeof handler === 'object') {
            for (const key of Object.keys(handler)) {
                handlers[key.replace('Handler', '')] = handler[key];
            }
        } else handlers[handlerName] = handler;
    }
}

module.exports = handlers;
