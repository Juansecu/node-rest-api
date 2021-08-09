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

        // Send the response
        res.end('Hello World!');

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
    });
});

server.listen(3000, () => console.log('Server is listening on port 3000!'));
