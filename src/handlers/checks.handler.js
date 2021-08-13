const config = require('../config');

const _dataLib = require('../lib/data.lib');

const { _tokens } = require('./tokens.handler');

const helpers = require('../helpers');

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

/**
 * @param {{
 *     headers: {
 *         authorization: string
 *     },
 *     queryStringObject: {
 *        checkId: string
 *     }
 * }} data
 * @param {(
 *          statusCode: number,
 *          messageObject: { message: string }
 * )} callback
 */
_checks.get = (data, callback) => {
    const checkId =
        typeof data.queryStringObject.checkId === 'string' &&
        data.queryStringObject.checkId.match(/^[a-zA-Z0-9]{20}$/)
            ? data.queryStringObject.checkId.trim()
            : '';

    if (checkId) {
        // Lookup the user
        _dataLib.read(checkId, 'checks', (error, checkData) => {
            if (!error) {
                // Get the token from the headers
                const token =
                    typeof data.headers.authorization === 'string' &&
                    data.headers.authorization.match(/^[a-zA-Z0-9]{20}$/)
                        ? data.headers.authorization.trim()
                        : '';

                console.log(checkData.userPhoneNumber);

                // Verify the token and the given phone number match, and belongs to the user who created the check
                _tokens.verifyToken(token, checkData.userPhoneNumber, valid => {
                    if (valid) {
                        // Return the check data
                        callback(null, {
                            check: checkData
                        });
                    } else callback(401, { message: 'Invalid token' });
                });
            } else callback(404, { message: 'Check not found' });
        });
    } else callback(400, { message: 'Missing checkId' });
};

/**
 * @param {{
 *     headers: {
 *        authorization: string
 *     },
 *     payload: {
 *         method: string,
 *         protocol: string,
 *         successCodes: number[],
 *         timeoutSeconds: number,
 *         url: string
 *     }
 * }} data
 * @param {(
 *          statusCode: number,
 *          messageObject: { message: string }
 * )} callback
 */
_checks.post = (data, callback) => {
    // Check that all the required fields are present
    const method =
        typeof data.payload.method === 'string' &&
        ['DELETE', 'GET', 'POST', 'PUT'].indexOf(
            data.payload.method.toUpperCase()
        ) > -1
            ? data.payload.method
            : '';
    const protocol =
        typeof data.payload.protocol === 'string' &&
        ['http', 'https'].indexOf(data.payload.protocol) > -1
            ? data.payload.protocol
            : '';
    const successCodes =
        typeof data.payload.successCodes === 'object' &&
        data.payload.successCodes instanceof Array &&
        data.payload.successCodes.length &&
        data.payload.successCodes.every(
            code => typeof code === 'number' && code > 0
        )
            ? data.payload.successCodes
            : [];
    const timeoutSeconds =
        typeof data.payload.timeoutSeconds === 'number' &&
        data.payload.timeoutSeconds % 1 === 0 &&
        data.payload.timeoutSeconds > 0 &&
        data.payload.timeoutSeconds < 6
            ? data.payload.timeoutSeconds
            : 0;
    const url =
        typeof data.payload.url === 'string' && data.payload.url.length
            ? data.payload.url
            : '';

    if (method && protocol && successCodes.length && timeoutSeconds && url) {
        // Get the token from the headers
        const token =
            typeof data.headers.authorization === 'string' &&
            data.headers.authorization.match(/^[a-zA-Z0-9]{20}$/)
                ? data.headers.authorization.trim()
                : '';

        // Lookup the user by reading the token
        _dataLib.read(token, 'tokens', (error, tokenData) => {
            if (!error) {
                const userPhoneNumber = tokenData.phoneNumber;

                // Lookup the user by reading the phone number
                _dataLib.read(
                    userPhoneNumber.replace('+', ''),
                    'users',
                    (error, userData) => {
                        if (!error) {
                            const userChecks =
                                typeof userData.checks === 'object' &&
                                userData.checks instanceof Array
                                    ? userData.checks
                                    : [];

                            // Verify that the user has less than the maximum number of checks
                            if (userChecks.length < config.maxChecks) {
                                // Create a random ID for the check
                                const checkId = helpers.createRandomString(20);

                                // Create the check object, and include the user's phone number
                                const check = {
                                    checkId,
                                    userPhoneNumber,
                                    protocol,
                                    url,
                                    method,
                                    successCodes,
                                    timeoutSeconds
                                };

                                // Save the check
                                _dataLib.write(
                                    check,
                                    checkId,
                                    'checks',
                                    error => {
                                        if (!error) {
                                            // Add the check ID to the user's checks
                                            userData.checks = userChecks;
                                            userData.checks.push(checkId);

                                            // Save the new user data
                                            _dataLib.update(
                                                userData,
                                                userPhoneNumber.replace(
                                                    /\+/,
                                                    ''
                                                ),
                                                'users',
                                                error => {
                                                    if (!error) {
                                                        // Return the check data
                                                        callback(200, {
                                                            check
                                                        });
                                                    } else
                                                        callback(500, {
                                                            message:
                                                                'Error updating user data with the new check'
                                                        });
                                                }
                                            );
                                        } else
                                            callback(500, {
                                                message: 'Error saving check'
                                            });
                                    }
                                );
                            } else
                                callback(429, {
                                    message:
                                        'You have reached the maximum number of checks per user'
                                });
                        } else
                            callback(404, {
                                message: 'User not found'
                            });
                    }
                );
            } else callback(401, { message: 'Unauthorized' });
        });
    } else callback(400, { message: 'Missing required fields' });
};

_checks.put = (data, callback) => {};

module.exports = checksHandler;
