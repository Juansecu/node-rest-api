const fs = require('fs');
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;

const config = require('./config');

const helpers = require('./helpers');

const handlers = require('./handlers');

// All the server logic for both the http and https requests
const unifiedServer = (req, res) => {
    let buffer = '';

    // Get the URL and parse it
    const parsedUrl = url.parse(req.url, true);

    // Get the HTTP method
    const method = req.method.toLowerCase();

    // Get the headers as an object
    const headers = req.headers;

    // Get the payload, if any
    const decoder = new StringDecoder(
        req.headers['content-encoding'] || 'utf8'
    );

    // Get the path
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/\/+$/, '');

    // Get the query string as an object
    const queryStringObject = parsedUrl.query;

    req.on('data', data => {
        buffer += decoder.write(data);
    });

    req.on('end', () => {
        buffer += decoder.end();

        // Chooses the handler this request should go to. If no handler is found, use the notFound handler
        const chosenHandler =
            router[trimmedPath.replace(/^\/+/, '')] || handlers.notFound;

        // Construct the data object to pass to the handler
        const data = {
            headers,
            method,
            payload: helpers.parseJsonToObject(buffer),
            queryStringObject,
            trimmedPath
        };

        // Rout the request to the handler specified in the router
        chosenHandler(data, (statusCode, payload) => {
            // Use the status code called back by the handler, or default to 200
            statusCode = typeof statusCode === 'number' ? statusCode : 200;

            // Use the payload called back by the handler, or default to an empty object
            payload = typeof payload === 'object' ? payload : {};

            // Convert the payload to a string
            const payloadString = JSON.stringify(payload);

            // Return the response
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);

            // Log the request path
            console.log(
                `Request for ${
                    trimmedPath ? trimmedPath : path
                } with method ${method} with `,
                queryStringObject,
                ` query params received!`
            );
            console.log('Headers:', headers);
            console.log(`Payload: ${buffer}`);
            console.log('Response:', statusCode, payloadString);
        });
    });
};

// Instatiate the HTTP server
const httpServer = http.createServer(unifiedServer);

// Instatiate the HTTPS server
const httpsServerOptions = {
    cert: fs.readFileSync('./certificates/cert.pem'),
    key: fs.readFileSync('./certificates/key.pem')
};
const httpsServer = https.createServer(httpsServerOptions, unifiedServer);

// Define a request router
const router = {};

helpers.sendTwilioSms('Hellossxsgxssvsxgxssgsxgs', '4158375309', console.error);

// Assign the handlers to the router
for (const handlerName in handlers) {
    if (handlerName === 'notFound') continue;
    router[handlerName] = handlers[handlerName];
}

httpServer.listen(config.httpPort, () =>
    console.log(
        `HTTP server is listening on port ${config.httpPort} in ${config.environment} mod!`
    )
);

httpsServer.listen(config.httpsPort, () =>
    console.log(
        `HTTPS server is listening on port ${config.httpsPort} in ${config.environment} mod!`
    )
);
