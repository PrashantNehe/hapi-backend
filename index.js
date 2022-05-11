'use strict';
const Hapi = require('@hapi/hapi');
const Ajv = require("ajv")
const ajv = new Ajv() // options can be passed, e.g. {allErrors: true}
const Inert = require('@hapi/inert');
const Vision = require('@hapi/vision');
const HapiSwagger = require('hapi-swagger');
const Pack = require('./package');
const Joi = require('joi');

// Validation Shema for Uploaded JSON Body
const schema = {
    'type': 'object',
    'patternProperties': {
        "^[0-9]": {
            'type': ['array', 'null'],
            'items': {
                'type': 'object',
                'properties': {
                    'id': { 'type': 'number' },
                    'title': { 'type': 'string' },
                    'level': { 'type': 'number' },
                    'children': { 'type': 'array' },
                    'parent_id': { 'type': ['number','null'] },
                },
                'required': ['id', 'title', 'level', 'children', 'parent_id'],
            },
        }
    }
}
  
const validate = ajv.compile(schema)
const server = new Hapi.Server({
    host: 'localhost',
    port: 3000,
});

const swaggerOptions = {
    info: {
            title: 'Test API Documentation',
            version: Pack.version,
        },
    };

const mapParentChild = function(jsonInput) {
    const mergedObjects = Object.entries(jsonInput).map((item)=> item[1]).flat();
    return JSON.stringify(parsingLogic(mergedObjects));
}

//Logic to parse and join objects based on id and parent_id
const parsingLogic = function(array){
    let map = {};
    for(let i = 0; i < array.length; i++){
        let obj = array[i];
        obj.children= [];
        map[obj.id] = obj;
        let parent = obj.parent_id || '-';
        if(!map[parent]){ map[parent] = { children: []};}
        map[parent].children.push(obj);
    }
    return map['-'].children;
}

// server.route(Routes);
server.route({
    method: 'POST',
    path: '/api/childParentParsing',
    options: {
        handler: (request, h) => {
            try{
                //Here we validate JSON Input
                const valid = validate(request.payload);
                if (!valid) throw new Error(JSON.stringify(validate.errors)); //Throw Validation Message once we dont get expected JSON as a INPUT 
                
                //Logic to identify parent child relationship
                return h.response(JSON.parse(mapParentChild(request.payload))).code(200);
            } catch(err) {
                return (err.message && JSON.parse(err.message)[0].message) ? 
                h.response({'VALIDATIONERROR': JSON.parse(err.message)[0].message}).code(422)
                    : h.response({'FAIL': JSON.parse(err)}).code(500);
            }
        },
        description: 'POST Child Parent Parsing',
        notes: 'Please add input json into body section in swagger to get exact response',
        tags: ['api'],
        validate: {
            payload: Joi.object().required() // While runnnig swagger please add positive Input JSON object and then try to run it
        }
    }
})
// Initiate the server
const init = async () => {
    await server.register([
        Inert,
        Vision,
        {
            plugin: HapiSwagger,
            options: swaggerOptions
        }
    ]);
    await server.start();
    console.log('Server running on %ss', server.info.uri);
};

init();
module.exports = server;