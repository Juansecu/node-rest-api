let environment;

let currentEnvironment = 'development';

const environments = {};

environments.development = {
    environment: 'development',
    hashingSecret: 'sggs-55svssvg',
    httpPort: 3000,
    httpsPort: 3001
};

environments.production = {
    environment: 'production',
    hashingSecret: 'stbvsrbbxxf$3wsh',
    httpPort: 4000,
    httpsPort: 443
};

environments.staging = {
    environment: 'staging',
    hashingSecret: 'ksbsstgvced53bsvs%',
    httpPort: 5000,
    httpsPort: 5001
};

currentEnvironment = process.env.NODE_ENV || 'development';

environment =
    typeof environments[currentEnvironment] === 'undefined'
        ? environments.development
        : environments[currentEnvironment];

module.exports = environment;
