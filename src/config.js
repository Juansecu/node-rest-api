let environment;

let currentEnvironment = 'development';

const environments = {};

environments.development = {
    environment: 'development',
    hashingSecret: 'sggs-55svssvg',
    httpPort: 3000,
    httpsPort: 3001,
    maxChecks: 5,
    twillio: {
        accountSid: 'ACb32d411ad7fe886aac54c665d25e5c5d',
        authToken: '9455e3eb3109edc12e3d8c92768f7a67',
        fromNumber: '+15558675310',
        toNumber: '+15558675310'
    }
};

environments.production = {
    environment: 'production',
    hashingSecret: 'stbvsrbbxxf$3wsh',
    httpPort: 4000,
    httpsPort: 443,
    maxChecks: 5,
    twillio: {
        accountSid: 'ACb32d411ad7fe886aac54c665d25e5c5d',
        authToken: '9455e3eb3109edc12e3d8c92768f7a67',
        fromNumber: '+15558675310',
        toNumber: '+15558675310'
    }
};

environments.staging = {
    environment: 'staging',
    hashingSecret: 'ksbsstgvced53bsvs%',
    httpPort: 5000,
    httpsPort: 5001,
    maxChecks: 5,
    twillio: {
        accountSid: 'ACb32d411ad7fe886aac54c665d25e5c5d',
        authToken: '9455e3eb3109edc12e3d8c92768f7a67',
        fromNumber: '+15558675310',
        toNumber: '+15558675310'
    }
};

currentEnvironment = process.env.NODE_ENV || 'development';

environment =
    typeof environments[currentEnvironment] === 'undefined'
        ? environments.development
        : environments[currentEnvironment];

module.exports = environment;
