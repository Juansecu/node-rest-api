const http = require('http');
const https = require('https');
const url = require('url');

const _dataLib = require('./lib/data.lib');

const helpers = require('./helpers');

// Instatiate the workers object
const workers = {};

// Lookup all the checks, get their data, send a validator request and save the results
workers.gatherAllChecks = () => {
    // Get all the checks
    _dataLib.list('checks', (error, checkNames) => {
        if (!error && checkNames.length) {
            // Get the data for each check
            checkNames.forEach(checkName => {
                // Get the data for the check
                _dataLib.read(checkName, 'checks', (error, data) => {
                    if (!error && data) {
                        // Send the validator request
                        workers.validateCheckData(data, checkName, error => {
                            if (error) console.error(error);
                        });
                    } else
                        console.log(
                            `Error reading data from ${checkName} check`
                        );
                });
            });
        } else console.log('Could not find any check to process');
    });
};

// Sanity check the check data
workers.validateCheckData = (checkData, checkName, callback) => {
    checkName =
        typeof checkName === 'string' &&
        checkName.trim().match(/^[a-zA-Z0-9]{20}$/)
            ? checkName
            : null;
    checkData = typeof checkData === 'object' && checkData ? checkData : {};
    checkData.checkId =
        typeof checkData.checkId === 'string' &&
        checkData.checkId.trim().match(/^[a-zA-Z0-9]{20}$/)
            ? checkData.checkId
            : '';
    checkData.userPhoneNumber =
        typeof checkData.userPhoneNumber === 'string' &&
        checkData.userPhoneNumber.trim().match(/^\+?\d{9,15}$/)
            ? checkData.userPhoneNumber
            : '';
    checkData.protocol =
        typeof checkData.protocol === 'string' &&
        ['http', 'https'].indexOf(checkData.protocol) > -1
            ? checkData.protocol
            : 'http';
    checkData.url =
        typeof checkData.url === 'string' && checkData.url.trim().length
            ? checkData.url.trim()
            : '';
    checkData.method =
        typeof checkData.method === 'string' &&
        ['DELETE', 'GET', 'POST', 'PUT'].indexOf(
            checkData.method.toUpperCase()
        ) > -1
            ? checkData.method
            : '';
    checkData.successCodes =
        typeof checkData.successCodes === 'object' &&
        checkData.successCodes instanceof Array &&
        checkData.successCodes.length
            ? checkData.successCodes
            : [];
    checkData.timeoutSeconds =
        typeof checkData.timeoutSeconds === 'number' &&
        checkData.timeoutSeconds % 1 === 0 &&
        checkData.timeoutSeconds &&
        checkData.timeoutSeconds < 6
            ? checkData.timeoutSeconds
            : 0;

    // Set the keys that may not be set (if the workers have never seen this check before)
    checkData.state =
        typeof checkData.state === 'string' &&
        ['up', 'down'].indexOf(checkData.state) > -1
            ? checkData.state
            : 'down';
    checkData.lastCheck =
        typeof checkData.lastCheck === 'number' && checkData.lastCheck
            ? checkData.lastCheck
            : 0;

    // Check if the check data is valid
    if (
        checkName &&
        checkData.checkId &&
        checkName === checkData.checkId &&
        checkData.userPhoneNumber &&
        checkData.protocol &&
        checkData.url &&
        checkData.method &&
        checkData.successCodes.length &&
        checkData.timeoutSeconds
    )
        workers.performCheck(checkData);
    else callback(new Error(`Invalid check data from check ${checkName}`));
};

// Perform the check, send the original check data and the outcome of the check process to the next step in the process
workers.performCheck = checkData => {
    // Mark that the outcome is being processed
    let outcomeStatus = 'processing';

    // Prepare the initial check outcome
    const checkOutcome = {
        error: null,
        responseCode: 200
    };
    // Parse the hostname and the path out of the original check data
    const parsedUrl = url.parse(
        `${checkData.protocol}://${checkData.url}`,
        true
    );
    const hostname = parsedUrl.hostname;
    const path = parsedUrl.path;
    // Construct the request object
    const request = {
        method: checkData.method.toUpperCase(),
        protocol: `${checkData.protocol}:`,
        hostname,
        path,
        timeout: checkData.timeoutSeconds * 1000
    };
    // Instantiate the request object (using either the http or https module)
    const requestModule = checkData.protocol === 'https' ? https : http;
    const req = requestModule.request(request, res => {
        // Grab the status of the sent request
        const statusCode = res.statusCode;

        // Update the check outcome and pass the data along
        checkOutcome.responseCode = statusCode;

        if (outcomeStatus === 'processing') {
            workers.processCheckOutcome(checkData, checkOutcome);
            outcomeStatus = 'performed';
        }
    });

    // Bind to the error event, so it doesn't get thrown away
    req.on('error', error => {
        checkOutcome.error = error;
        checkOutcome.responseCode = 500;

        if (outcomeStatus === 'processing') {
            workers.processCheckOutcome(checkData, checkOutcome);
            outcomeStatus = 'performed';
        }
    });

    // Bind to the the timeout event, so it doesn't get thrown away
    req.on('timeout', () => {
        checkOutcome.error = 'timeout';
        checkOutcome.responseCode = 408;

        if (outcomeStatus === 'processing') {
            workers.processCheckOutcome(checkData, checkOutcome);
            outcomeStatus = 'performed';
        }
    });

    // Send the request
    req.end();
};

// Process the check outcome, update the check data as needed and trigger an alert if needed
workers.processCheckOutcome = (checkData, checkOutcome) => {
    // Decide if the check is up or down
    const state =
        !checkOutcome.error &&
        checkOutcome.responseCode &&
        checkData.successCodes.indexOf(checkOutcome.responseCode) > -1
            ? 'up'
            : 'down';
    // Decide if an alert is warranted
    const alertWarranted =
        checkData.lastCheck &&
        checkData.state !== state &&
        checkData.state !== 'processing'
            ? true
            : false;

    // Update the check data
    checkData.state = state;
    checkData.lastCheck = Date.now();

    // Save the updated check data
    _dataLib.update(checkData, checkData.checkId, 'checks', error => {
        if (!error) {
            // Trigger an alert if needed
            if (alertWarranted) workers.triggerAlert(checkData);
            else console.log(`No alert needed for ${checkData.checkId}`);
        } else console.error('Error to update check data:', error);
    });
};

// Trigger an alert
workers.triggerAlert = checkData => {
    const message = `Alert: Your check "${checkData.checkId}" is ${checkData.state}`;

    helpers.sendTwilioSms(
        message,
        checkData.userPhoneNumber.replace('+', ''),
        error => {
            if (!error)
                console.log(`Alert sent to ${checkData.userPhoneNumber}`);
            else console.error('Error sending alert:', error);
        }
    );
};

// Timer to execute the worker-process once per minute
workers.loop = () => {
    // Call the loop function, so the checks will execute later on
    setInterval(() => workers.gatherAllChecks(), 1000 * 60);
};

module.exports.initWorkers = () => {
    // Execute all the checks immediately
    workers.gatherAllChecks();

    // Call the loop function, so the checks will execute later on
    workers.loop();
};
