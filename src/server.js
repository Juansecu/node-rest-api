const http = require('http');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;

const server = http.createServer((req, res) => {
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
            payload: buffer,
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
});

// Define the handlers
const handlers = {};

// Define a request router
const router = {};

// Sample handler
handlers.sample = (data, callback) => {
    // Callback a http status code, and a payload object
    callback(406, { name: 'Sample handler' });
};

// Not found handler
handlers.notFound = (data, callback) => {
    // Callback a http status code, and a payload object
    callback(404, { name: 'Not found handler' });
};

router.sample = handlers.sample;

server.listen(3000, () => console.log('Server is listening on port 3000!'));
