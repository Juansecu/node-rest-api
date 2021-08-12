/**
 * Library for storing and editing data.
 */

const fs = require('fs');
const path = require('path');

const helpers = require('../helpers');

const dataLib = {};

// Base directory for data files
dataLib.baseDir = path.join(__dirname, '../../.data');

// Delete a file
dataLib.delete = function (fileName, dir, callback) {
    // Unlink the file
    fs.unlink(`${dataLib.baseDir}/${dir}/${fileName}.json`, error => {
        if (!error) callback(null);
        else callback(error);
    });
};

// Read data from a file
dataLib.read = function (fileName, dir, callback) {
    fs.readFile(
        `${dataLib.baseDir}/${dir}/${fileName}.json`,
        'utf8',
        (error, data) => {
            if (!error) {
                // Parse the data
                const dataObject = helpers.parseJsonToObject(data);
                callback(null, dataObject);
            } else callback(error, data);
        }
    );
};

// Update data inside a file
dataLib.update = function (data, fileName, dir, callback) {
    // Open the file for writing
    fs.open(
        `${dataLib.baseDir}/${dir}/${fileName}.json`,
        'r+',
        (error, fileDescriptor) => {
            if (!error) {
                // Convert the data to a string
                const dataString = JSON.stringify(data);

                // Truncate the file
                fs.ftruncate(fileDescriptor, error => {
                    if (!error) {
                        // Write the data to the file and close it
                        fs.writeFile(fileDescriptor, dataString, error => {
                            if (!error) {
                                fs.close(fileDescriptor, error => {
                                    if (!error) callback(null);
                                    else callback(error);
                                });
                            } else callback(error);
                        });
                    } else callback(error);
                });
            } else callback(error);
        }
    );
};

// Write the data to a file
dataLib.write = function (data, fileName, dir, callback) {
    // Open the file for writing
    fs.open(
        `${dataLib.baseDir}/${dir}/${fileName}.json`,
        'wx',
        (error, fileDescriptor) => {
            if (!error) {
                // Convert the data to a string
                const dataString = JSON.stringify(data);

                // Write the data to the file and close it
                fs.writeFile(fileDescriptor, dataString, error => {
                    if (!error) {
                        fs.close(fileDescriptor, error => {
                            if (!error) callback(null);
                            else callback(error);
                        });
                    } else callback(error);
                });
            } else {
                if (error.code === 'ENOENT') {
                    // Create the directory if it doesn't exist
                    fs.mkdir(`${dataLib.baseDir}/${dir}`, error => {
                        if (!error) {
                            // Write the data to the file
                            dataLib.write(data, fileName, dir, callback);
                        } else callback(error);
                    });
                } else callback(error);
            }
        }
    );
};

module.exports = dataLib;
