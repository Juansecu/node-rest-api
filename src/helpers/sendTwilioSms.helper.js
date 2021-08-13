const https = require('https');
const querystring = require('querystring');

const config = require('../config');

/**
 * @param {string} message
 * @param {string} phoneNumber
 * @param {function} callback
 */
const sendTwilioSms = (message, phone, callback) => {
    // Validate the parameters
    const messageContent =
        typeof message === 'string' &&
        message.trim().match(/[a-zA-Z0-9]{15,1600}/)
            ? message.trim()
            : '';
    const phoneNumber =
        typeof phone === 'string' && phone.match(/^\d{10}$/)
            ? phone.trim()
            : '';

    // If the parameters are valid, send the SMS
    if (messageContent && phoneNumber) {
        // Configure the request payload
        const payload = {
            From: config.twillio.fromPhone,
            To: `+1${phoneNumber}`,
            Body: messageContent
        };

        // Stringify the payload
        const payloadString = querystring.stringify(payload);

        // Configure the request details
        const options = {
            protocol: 'https:',
            hostname: 'api.twilio.com',
            method: 'POST',
            path: `/2010-04-01/Accounts/${config.twillio.accountSid}/Messages.json`,
            auth: `${config.twillio.accountSid}:${config.twillio.authToken}`,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(payloadString)
            }
        };

        // Instanciate the request object
        const request = https.request(options, response => {
            // Grab the status code of the sent request
            const statusCode = response.statusCode;

            // Callback success if the status code is 200 or 201
            if (statusCode === 200 || statusCode === 201) callback('Sent');
            else callback(`Status code was ${statusCode}`);
        });

        // Bind the error event so it doesn't crash the process
        request.on('error', error => callback(error));

        // Add the payload to the request
        request.write(payloadString);

        // Send the request
        request.end();
    } else callback('Invalid parameters');
};

module.exports = sendTwilioSms;
