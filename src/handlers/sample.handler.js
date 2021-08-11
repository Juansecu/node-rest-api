// Sample handler
const sampleHandler = (data, callback) => {
    // Callback a http status code, and a payload object
    callback(406, { name: 'Sample handler' });
};

module.exports = sampleHandler;
