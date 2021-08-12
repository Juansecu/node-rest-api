const _dataLib = require('../lib/data.lib');

const helpers = require('../helpers');

// Container for the users submethods
const _users = {};

// Users handler
const usersHandler = function (data, callback) {
    const acceptableMethods = ['GET', 'POST', 'PUT', 'DELETE'];

    if (acceptableMethods.indexOf(data.method.toUpperCase()) > -1) {
        /* if (data.method === 'PUT') {
            const user = data.body;
            const users = require('./../../../data/users');
            const index = users.findIndex(u => u.id === user.id);
            users[index] = user;
            callback(null, users);
        } else if (data.method === 'DELETE') {
            const users = require('./../../../data/users');
            const index = users.findIndex(u => u.id === data.params.id);
            users.splice(index, 1);
            callback(null, users);
        }*/
        _users[data.method](data, callback);
    } else callback(405, { message: 'Method not allowed' });
};

/**
 * @param {{payload: {
 *          phoneNumber: string,
 * }}} data
 * @param {function} callback
 */
_users.delete = function (data, callback) {
    // Check that all the required fields are present
    const phoneNumber =
        typeof data.payload.phoneNumber === 'string' &&
        data.payload.phoneNumber.match(/^\+?\d{9,15}$/)
            ? data.payload.phoneNumber.trim()
            : '';

    if (phoneNumber) {
        // Lookup the user
        _dataLib.read(
            phoneNumber.replace('+', ''),
            'users',
            (error, userData) => {
                if (!error) {
                    // Remove the user
                    _dataLib.delete(
                        phoneNumber.replace('+', ''),
                        'users',
                        error => {
                            if (!error) {
                                callback(null, { message: 'User deleted' });
                            } else
                                callback(500, {
                                    message: 'Error deleting user'
                                });
                        }
                    );
                } else callback(404, { message: 'User not found' });
            }
        );
    } else callback(400, { message: 'Missing required fields' });
};

/**
 * @param {{payload: {
 *          phoneNumber: string
 * }}} data
 * @param {function} callback
 */
_users.get = function (data, callback) {
    // Check that all the required fields are present
    const phoneNumber =
        typeof data.payload.phoneNumber === 'string' &&
        data.payload.phoneNumber.match(/^\+?\d{9,15}$/)
            ? data.payload.phoneNumber.trim()
            : '';

    if (phoneNumber) {
        // Lookup the user
        _dataLib.read(
            phoneNumber.replace('+', ''),
            'users',
            (error, userData) => {
                if (!error) {
                    // Remove the hashed password from the user object before returning it to the requestor
                    delete userData.password;
                    callback(null, userData);
                } else callback(404, { message: 'User not found' });
            }
        );
    } else callback(400, { message: 'Missing required fields' });
};

/**
 * @param {{payload: {
 *          email: string,
 *          firstName: string,
 *          lastName: string,
 *          password: string,
 *          phoneNumber: string,
 *          tosAgreement: boolean
 * }}} data
 * @param {function} callback
 */
_users.post = function (data, callback) {
    // Check that all the required fields are present
    const email =
        typeof data.payload.email === 'string' &&
        data.payload.email.match(
            /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/
        )
            ? data.payload.email.trim()
            : null;
    const firstName =
        typeof data.payload.firstName === 'string' &&
        data.payload.firstName.match(/^[a-zA-Z]{2,15}$/)
            ? data.payload.firstName.trim()
            : '';
    const lastName =
        typeof data.payload.lastName === 'string' &&
        data.payload.lastName.match(/^[a-zA-Z]{3,15}$/)
            ? data.payload.lastName.trim()
            : '';
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
    const tosAgreement =
        typeof data.payload.tosAgreement === 'boolean' &&
        data.payload.tosAgreement
            ? data.payload.tosAgreement
            : false;

    if (
        email &&
        firstName &&
        lastName &&
        password &&
        phoneNumber &&
        tosAgreement
    ) {
        // Make sure the user doesn't already exist
        _dataLib.read(phoneNumber.replace('+', ''), 'users', (error, data) => {
            if (error && error.code === 'ENOENT') {
                // Hash the password
                const hashedPassword = helpers.hash(password);

                if (hashedPassword) {
                    // Create the user object
                    const user = {
                        email,
                        firstName,
                        lastName,
                        password: hashedPassword,
                        phoneNumber,
                        tosAgreement
                    };

                    // Store the user
                    _dataLib.write(
                        user,
                        phoneNumber.replace('+', ''),
                        'users',
                        error => {
                            if (!error) callback(null, user);
                            else callback(error);
                        }
                    );
                } else
                    callback(500, {
                        message: "Could not hash the user's password"
                    });
            } else callback(409, { message: 'User already exists' });
        });
    } else callback(400, { message: 'Missing required fields' });
};

/**
 * @param {{payload: {
 *          phoneNumber: string,
 *          email?: string,
 *          firstName?: string,
 *          lastName?: string,
 *          password?: string
 * }}} data
 * @param {function} callback
 */
_users.put = function (data, callback) {
    // Check that all the required fields are present
    const phoneNumber =
        typeof data.payload.phoneNumber === 'string' &&
        data.payload.phoneNumber.match(/^\+?\d{9,15}$/)
            ? data.payload.phoneNumber.trim()
            : '';

    // Check that at least one of the optional fields is present
    const email =
        typeof data.payload.email === 'string' &&
        data.payload.email.match(
            /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/
        )
            ? data.payload.email.trim()
            : '';
    const firstName =
        typeof data.payload.firstName === 'string' &&
        data.payload.firstName.match(/^[a-zA-Z]{2,15}$/)
            ? data.payload.firstName.trim()
            : '';
    const lastName =
        typeof data.payload.lastName === 'string' &&
        data.payload.lastName.match(/^[a-zA-Z]{3,15}$/)
            ? data.payload.lastName.trim()
            : '';
    const password =
        typeof data.payload.password === 'string' &&
        data.payload.password.match(/^[a-zA-Z]{8,20}$/)
            ? data.payload.password.trim()
            : '';

    if (phoneNumber) {
        // Error if nothing is sent to update
        if (email || firstName || lastName || password) {
            // Make sure the user exists
            _dataLib.read(
                phoneNumber.replace('+', ''),
                'users',
                (error, userData) => {
                    if (!error) {
                        // Update the user
                        if (email) userData.email = email;
                        if (firstName) userData.firstName = firstName;
                        if (lastName) userData.lastName = lastName;
                        if (password)
                            userData.password = helpers.hash(password);

                        // Store the new user data
                        _dataLib.write(
                            userData,
                            phoneNumber.replace('+', ''),
                            'users',
                            error => {
                                if (!error) callback(null, userData);
                                else {
                                    console.error(error);
                                    callback(500, {
                                        message: 'Could not update user'
                                    });
                                }
                            }
                        );
                    } else callback(404, { message: 'User not found' });
                }
            );
        } else callback(400, { message: 'Nothing to update' });
    } else callback(400, { message: 'Missing required fields' });
};

module.exports = { _users, usersHandler };
