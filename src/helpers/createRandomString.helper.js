const createRandomString = (length = 10) => {
    length = length || 10;

    // Start the final random string
    let finalRandomString = '';

    // Create a random charachter between the values of a and z, A and Z and 0 and 9
    const possibleCharacters =
        '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

    // Create a random string with the length of the user's choice
    for (let i = 0; i < length; i++) {
        // Get a random character from the possible characters
        const randomCharacter = possibleCharacters.charAt(
            Math.floor(Math.random() * possibleCharacters.length)
        );
        // Add the random character to the final random string
        finalRandomString += randomCharacter;
    }

    return finalRandomString;
};

module.exports = createRandomString;
