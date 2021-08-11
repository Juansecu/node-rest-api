// Parse JSON to Object helper
/**
 * @description Parse a JSON string to an object in all cases, without throwing errors.
 *
 * @param {string} jsonString - The JSON string to parse.
 */
const parseJsonToObject = jsonString => {
    try {
        const object = JSON.parse(jsonString);
        return object;
    } catch (error) {
        console.error(error);
        return null;
    }
};

module.exports = parseJsonToObject;
