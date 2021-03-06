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

// Compress the contents of one .log file into a .gz.b64 file with the same dierectory
logsLib.compress = (fileName, newFileName, callback) => {
    const sourceFile = `${logsLib.baseDir}/${fileName}.log`;
    const destinationFile = `${logsLib.baseDir}/${newFileName}.gz.b64`;

    // Read the file
    fs.readFile(sourceFile, 'utf8', (error, data) => {
        if (!error && data) {
            // Compress the file
            zlib.gzip(data, (error, compressedData) => {
                if (!error && compressedData) {
                    fs.open(destinationFile, 'wx', (error, fileDescriptor) => {
                        if (!error) {
                            // Write the compressed data to the file
                            fs.writeFile(
                                fileDescriptor,
                                compressedData.toString('base64'),
                                error => {
                                    if (!error) {
                                        // Close the file
                                        fs.close(fileDescriptor, error => {
                                            if (!error) callback(null);
                                            else
                                                callback(
                                                    'Error closing the file'
                                                );
                                        });
                                    } else callback('Error writing to file');
                                }
                            );
                        } else callback('Error opening file');
                    });
                } else callback('Error compressing the file');
            });
        } else callback('Error reading the file');
    });
};

// Decompress the contents of a .gz.b64 file into a string
logsLib.decompress = (fileName, callback) => {
    fs.readFile(
        `${logsLib.baseDir}/${fileName}.gz.b64`,
        'utf8',
        (error, data) => {
            if (!error && data) {
                const inputBuffer = Buffer.from(data, 'base64');

                // Decompress the data
                zlib.gunzip(inputBuffer, (error, outputBuffer) => {
                    if (!error && outputBuffer) {
                        callback(null, outputBuffer.toString());
                    } else callback('Error decompressing the file');
                });

                callback(null, decompressedData);
            } else callback('Error reading the file');
        }
    );
};

// List all the files in the base directory
logsLib.list = (includeCompressedLogs, callback) => {
    // Get the list of files
    fs.readdir(logsLib.baseDir, (error, logFiles) => {
        if (!error && logFiles.length) {
            const trimmedFileNames = [];

            logFiles.forEach(fileName => {
                // Get the file name without the extension
                if (fileName.indexOf('.log') > -1)
                    trimmedFileNames.push(fileName.replace('.log', ''));

                // Add on the .gz files
                if (includeCompressedLogs && fileName.indexOf('.gz.b64') > -1)
                    trimmedFileNames.push(fileName.replace('.gz.b64', ''));
            });

            callback(null, trimmedFileNames);
        } else callback('Could not get the list of files');
    });
};

// Truncate a log file
logsLib.truncate = (fileName, callback) => {
    fs.truncate(`${logsLib.baseDir}/${fileName}.log`, 0, error => {
        if (!error) callback(null);
        else callback('Error truncating the file');
    });
};

module.exports = logsLib;
