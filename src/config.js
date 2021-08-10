let environment;

let currentEnvironment = 'development';

const environments = {};

environments.development = {
    port: 3000,
    environment: 'development'
};

environments.production = {
    port: 4000,
    environment: 'production'
};

environments.staging = {
    port: 5000,
    environment: 'staging'
};

currentEnvironment = process.env.NODE_ENV || 'development';

environment =
    typeof environments[currentEnvironment] === 'undefined'
        ? environments.development
        : environments[currentEnvironment];

module.exports = environment;
