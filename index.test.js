const server = require('./index.js'); // Import Server/Application
const positiveData = require('./test_payloads/positiveInputJson.json');
const validateMissinigProperties = require('./test_payloads/validateMissinigProperties.json');
const validateStructure = require('./test_payloads/validateStructureInputJson.json');
const negativeData = require('./test_payloads/negativeInputJson.json');

// Start application before running the test case
beforeAll((done) => {
    server.events.on('start', () => {
        done();
    });
});

// Stop application after running the test case
afterAll((done) => {
    server.events.on('stop', () => {
        done();
    });
    server.stop();
});

test("Positive case should return with '200'", async function () {
    const options = {
        method: 'POST',
        url: '/api/childParentParsing',
        payload: JSON.stringify(positiveData)
    };
    const data = await server.inject(options);
    expect(data.statusCode).toBe(200);
});

test("Invalid JSON case should return validation message with '422'", async function () {
    const options = {
        method: 'POST',
        url: '/api/childParentParsing',
        payload: JSON.stringify(validateMissinigProperties)
    };
    const data = await server.inject(options);
    expect(data.statusCode).toBe(422);
    expect(JSON.parse(data.payload).VALIDATIONERROR).toBe("must have required property 'id'");
});

test("Invalid structure of Input JSON case should return with '500'", async function () {
    const options = {
        method: 'POST',
        url: '/api/childParentParsing',
        payload: JSON.stringify(validateStructure)
    };
    const data = await server.inject(options);
    expect(data.statusCode).toBe(500);
});

test("Negative case should return with '400'", async function () {
    const options = {
        method: 'POST',
        url: '/api/childParentParsing',
        payload: JSON.stringify(negativeData)
    };
    const data = await server.inject(options);
    expect(data.statusCode).toBe(400);
});