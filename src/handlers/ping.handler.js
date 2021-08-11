// Ping handler
const pingHandler = (data, callback) => {
    callback(200, { name: 'Pong' });
};

module.exports = pingHandler;
