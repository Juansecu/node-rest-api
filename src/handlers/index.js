// Import the readdirSync function from path module
const { readdirSync } = require('fs');

// Define the handlers object
const handlers = {};

for (const file of readdirSync('./src/handlers')) {
    if (file.endsWith('.handler.js')) {
        const handlerName = file.replace('.handler.js', '');
        const handler = require(`./${file}`);

        handlers[handlerName] = handler;
    }
}

module.exports = handlers;
