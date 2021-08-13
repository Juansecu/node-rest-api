// Container for the checks submethods
const _checks = {};

// Checks handler
const checksHandler = (data, callback) => {
    const acceptableMethods = ['DELETE', 'GET', 'POST', 'PUT'];

    if (acceptableMethods.indexOf(data.method.toUpperCase()) > -1)
        _checks[data.method](data, callback);
    else callback(405, { message: 'Method not allowed' });
};

_checks.delete = (data, callback) => {};

_checks.get = (data, callback) => {};

_checks.post = (data, callback) => {};

_checks.put = (data, callback) => {};

module.exports = checksHandler;
