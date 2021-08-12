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

/**
 * @param {{payload : {
 *          tokenId: string
 * }}} data
 * @param {function} callback
 */
_tokens.delete = (data, callback) => {
    // Check that the token ID is valid
    const tokenId =
        typeof data.payload.tokenId === 'string' &&
        data.payload.tokenId.match(/^[a-zA-Z0-9]{20}$/)
            ? data.payload.tokenId.trim()
            : '';

    if (tokenId) {
        // Lookup the token
        _dataLib.read(tokenId, 'tokens', (error, tokenData) => {
            if (!error) {
                // Delete the token
                _dataLib.delete(tokenId, 'tokens', error => {
                    if (!error) callback(null, { message: 'Token deleted' });
                    else {
                        console.error(error);
                        callback(500, {
                            message: 'Error deleting token'
                        });
                    }
                });
            } else callback(404, { message: 'Token not found' });
        });
    } else callback(400, { message: 'Token ID not provided' });
};

/**
 * @param {{payload : {
 *          tokenId: string,
 * }}} data
 * @param {function} callback
 */
_tokens.get = (data, callback) => {
    // Check that the token ID is valid
    const tokenId =
        typeof data.payload.tokenId === 'string' &&
        data.payload.tokenId.match(/^[a-zA-Z0-9]{20}$/)
            ? data.payload.tokenId.trim()
            : '';

    if (tokenId) {
        // Lookup the token
        _dataLib.read(tokenId, 'tokens', (error, tokenData) => {
            if (!error) {
                // Check that the token is not expired
                if (tokenData.tokenExpiration > Date.now()) {
                    // Return the token
                    callback(null, { token: tokenData });
                } else callback(401, { message: 'Token expired' });
            } else callback(404, { message: 'Token not found' });
        });
    } else callback(400, { message: 'Token ID not provided' });
};

/**
 * @param {{payload: {
 *          password: string,
 *          phoneNumber: string
 * }}} data
 * @param {function} callback
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

/**
 * @param {{payload : {
 *          tokenId: string,
 *          extend: boolean
 * }}} data
 * @param {function} callback
 */
_tokens.put = (data, callback) => {
    // Check that the token ID is valid
    const tokenId =
        typeof data.payload.tokenId === 'string' &&
        data.payload.tokenId.match(/^[a-zA-Z0-9]{20}$/)
            ? data.payload.tokenId.trim()
            : '';
    const extend =
        typeof data.payload.extend === 'boolean' && data.payload.extend
            ? data.payload.extend
            : false;

    if (tokenId && extend) {
        // Lookup the token
        _dataLib.read(tokenId, 'tokens', (error, tokenData) => {
            if (!error) {
                // Check that the token is not expired
                if (tokenData.tokenExpiration > Date.now()) {
                    // Extend the token expiration by the extend value
                    tokenData.tokenExpiration = Date.now() + 3600000;

                    // Save the token
                    _dataLib.update(tokenData, tokenId, 'tokens', error => {
                        if (!error)
                            callback(null, {
                                message: `${tokenId}'s token expiration was extended`
                            });
                        else
                            callback(500, {
                                message: 'Error extending token'
                            });
                    });
                } else callback(401, { message: 'Token expired' });
            } else callback(404, { message: 'Token not found' });
        });
    } else callback(400, { message: 'Missing required fields' });
};

_tokens.verifyToken = (tokenId, phoneNumber, callback) => {
    // Lookup the token
    _dataLib.read(tokenId, 'tokens', (error, tokenData) => {
        if (!error) {
            // Check that the token is not expired and that the phone number matches
            if (
                tokenData.tokenExpiration > Date.now() &&
                tokenData.phoneNumber === phoneNumber
            )
                callback(true);
            else callback(false);
        } else callback(false);
    });
};

module.exports = { _tokens, tokensHandler };
