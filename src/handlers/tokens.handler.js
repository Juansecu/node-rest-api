// Container for the tokens submethods
const _tokens = {};

// Tokens handler
const tokensHandler = (data, callback) => {
    const acceptableMethods = ['DELETE', 'GET', 'POST', 'PUT'];

    if (acceptableMethods.indexOf(data.method.toUpperCase()) > -1)
        _tokens[data.method](data, callback);
    else callback(405, { message: 'Method not allowed' });
};

_tokens.delete = (data, callback) => {};

_tokens.get = (data, callback) => {};

_tokens.post = (data, callback) => {};

_tokens.put = (data, callback) => {};

module.exports = tokensHandler;
