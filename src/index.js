const { initServer } = require('./server');
const { initWorkers } = require('./workers');

module.exports = (() => {
    initServer();
    initWorkers();
})();
