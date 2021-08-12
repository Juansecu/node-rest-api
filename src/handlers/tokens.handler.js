const _dataLib = require('../lib/data.lib');

const helpers = require('../helpers');

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

/**
 * @param {{payload: {
 *          password: string,
 *          phoneNumber: string
 * }}} data
 */
_tokens.post = (data, callback) => {
    const password =
        typeof data.payload.password === 'string' &&
        data.payload.password.match(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*?&])[A-Za-z\d$@$!%*?&]{8,20}$/
        )
            ? data.payload.password.trim()
            : '';
    const phoneNumber =
        typeof data.payload.phoneNumber === 'string' &&
        data.payload.phoneNumber.match(/^\+?\d{9,15}$/)
            ? data.payload.phoneNumber.trim()
            : '';

    if (password && phoneNumber) {
        // Lookup the user
        _dataLib.read(
            phoneNumber.replace('+', ''),
            'users',
            (error, userData) => {
                if (!error) {
                    // Hash the sent password, and compare it to the stored password
                    const passwordHash = helpers.hash(password);

                    if (passwordHash === userData.password) {
                        // If valid, create a new token with a random name. Set expiration to 1 hour from now
                        const tokenId = helpers.createRandomString(20);
                        const tokenExpiration = Date.now() + 3600000;
                        const tokenData = {
                            tokenId,
                            phoneNumber,
                            tokenExpiration
                        };

                        // Save the token
                        _dataLib.write(tokenData, tokenId, 'tokens', error => {
                            if (!error) callback(null, { token: tokenId });
                            else
                                callback(500, {
                                    message: 'Error creating token'
                                });
                        });
                    } else callback(401, { message: 'Incorrect password' });
                } else callback(404, { message: 'User not found' });
            }
        );
    } else callback(400, { message: 'Missing required fields' });
};

_tokens.put = (data, callback) => {};

module.exports = tokensHandler;
