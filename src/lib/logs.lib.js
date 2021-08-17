/**
 * Library for storing logs
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Container for the module
const logsLib = {};

// Base directory for the logs
logsLib.baseDir = path.resolve('.logs');

// Append a string to a file. Creates the file if it doesn't exist.
logsLib.append = (str, fileName, callback) => {
    // Open the file for appending
    fs.open(
        `${logsLib.baseDir}/${fileName}.log`,
        'a',
        (error, fileDescriptor) => {
            if (!error) {
                // Append the string to the file and close the it
                fs.appendFile(fileDescriptor, `${str}\n`, error => {
                    if (!error) {
                        // Close the file
                        fs.close(fileDescriptor, error => {
                            if (!error) callback(null);
                            else callback('Error closing the file');
                        });
                    } else callback('Error appending to file');
                });
            } else callback('Could not open file for appending');
        }
    );
};

module.exports = logsLib;
