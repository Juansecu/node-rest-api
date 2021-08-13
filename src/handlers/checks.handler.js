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

/**
 * @param {{
 *     headers: {
 *         authorization: string
 *     },
 *     payload: {
 *         checkId: string
 *     }
 * }} data
 * @param {(
 *          statusCode: number,
 *          messageObject: { message: string }
 * )} callback
 */
_checks.delete = (data, callback) => {
    // Check that the checkId is valid
    const checkId =
        typeof data.payload.checkId === 'string' &&
        data.payload.checkId.match(/^[a-zA-Z0-9]{20}$/)
            ? data.payload.checkId.trim()
            : '';

    if (checkId) {
        // Lookup the check
        _dataLib.read(checkId, 'checks', (error, checkData) => {
            if (!error) {
                // Get the token from the headers
                const token =
                    typeof data.headers.authorization === 'string' &&
                    data.headers.authorization.match(/^[a-zA-Z0-9]{20}$/)
                        ? data.headers.authorization.trim()
                        : '';

                // Verify the token and the given phone number match and belongs to the user who created the check
                _tokens.verifyToken(token, checkData.userPhoneNumber, valid => {
                    if (valid) {
                        // Delete the check
                        _dataLib.delete(
                            checkId,
                            'checks',
                            (error, response) => {
                                if (!error) {
                                    // Lookup the user
                                    _dataLib.read(
                                        checkData.userPhoneNumber.replace(
                                            '+',
                                            ''
                                        ),
                                        'users',
                                        (error, userData) => {
                                            if (!error) {
                                                const userChecks =
                                                    typeof userData.checks ===
                                                        'object' &&
                                                    userData.checks instanceof
                                                        Array
                                                        ? userData.checks
                                                        : [];

                                                // Get the check position from the user's checks
                                                const checkPosition =
                                                    userChecks.indexOf(checkId);

                                                // Remove the check from the user's checks
                                                if (checkPosition > -1) {
                                                    userChecks.splice(
                                                        checkPosition,
                                                        1
                                                    );

                                                    // Update the user's checks
                                                    _dataLib.update(
                                                        userData,
                                                        userData.phoneNumber.replace(
                                                            '+',
                                                            ''
                                                        ),
                                                        'users',
                                                        error => {
                                                            if (!error) {
                                                                // Return the message of the delete
                                                                callback(null, {
                                                                    message:
                                                                        'Check deleted'
                                                                });
                                                            } else
                                                                callback(500, {
                                                                    message:
                                                                        'Error updating user'
                                                                });
                                                        }
                                                    );
                                                } else
                                                    callback(404, {
                                                        message: `Check not found as an assigned check to the user ${userData.firstName} ${userData.lastName}`
                                                    });
                                            } else
                                                callback(404, {
                                                    message: 'User not found'
                                                });
                                        }
                                    );
                                } else
                                    callback(500, {
                                        message: 'Error deleting check'
                                    });
                            }
                        );
                    } else callback(401, { message: 'Invalid token' });
                });
            } else callback(404, { message: 'Check not found' });
        });
    } else callback(400, { message: 'Missing checkId' });
};

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
        // Lookup the check
        _dataLib.read(checkId, 'checks', (error, checkData) => {
            if (!error) {
                // Get the token from the headers
                const token =
                    typeof data.headers.authorization === 'string' &&
                    data.headers.authorization.match(/^[a-zA-Z0-9]{20}$/)
                        ? data.headers.authorization.trim()
                        : '';

                console.log(checkData.userPhoneNumber);

                // Verify the token and the given phone number match and belongs to the user who created the check
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

/**
 * @param {{
 *     headers: {
 *         authorization: string
 *     },
 *     payload: {
 *         checkId: string,
 *         method?: string,
 *         protocol?: string,
 *         successCodes?: number[],
 *         timeoutSeconds?: number,
 *         url?: string,
 *     }
 * }} data
 * @param {(
 *           statusCode: number,
 *          messageObject: { message: string }
 * )} callback
 */
_checks.put = (data, callback) => {
    // Check that all the required fields are present
    const checkId =
        typeof data.payload.checkId === 'string' &&
        data.payload.checkId.match(/^[a-zA-Z0-9]{20}$/)
            ? data.payload.checkId.trim()
            : '';

    // Check for the optional fields
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

    if (checkId) {
        if (
            method ||
            protocol ||
            successCodes.length ||
            timeoutSeconds ||
            url
        ) {
            // Lookup the check by reading the ID
            _dataLib.read(checkId, 'checks', (error, checkData) => {
                if (!error) {
                    // Get the token from the headers
                    const token =
                        typeof data.headers.authorization === 'string' &&
                        data.headers.authorization.match(/^[a-zA-Z0-9]{20}$/)
                            ? data.headers.authorization.trim()
                            : '';

                    _tokens.verifyToken(
                        token,
                        checkData.userPhoneNumber,
                        valid => {
                            if (valid) {
                                // Update the check where necessary
                                if (method) checkData.method = method;
                                if (protocol) checkData.protocol = protocol;
                                if (successCodes)
                                    checkData.successCodes = successCodes;
                                if (timeoutSeconds)
                                    checkData.timeoutSeconds = timeoutSeconds;
                                if (url) checkData.url = url;

                                // Save the check
                                _dataLib.update(
                                    checkData,
                                    checkId,
                                    'checks',
                                    error => {
                                        if (!error) {
                                            // Return the check data
                                            callback(200, {
                                                check: checkData
                                            });
                                        } else
                                            callback(500, {
                                                message: 'Error updating check'
                                            });
                                    }
                                );
                            } else
                                callback(401, {
                                    message: 'Unauthorized'
                                });
                        }
                    );
                } else
                    callback(404, {
                        message: 'Check not found'
                    });
            });
        } else callback(400, { message: 'Nothing to update' });
    } else callback(400, { message: 'Missing check ID' });
};

module.exports = checksHandler;
