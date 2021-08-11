// Not found handler
const notFoundHandler = (data, callback) => {
    // Callback a http status code, and a payload object
    callback(404, { name: 'Not found handler' });
};

module.exports = notFoundHandler;
