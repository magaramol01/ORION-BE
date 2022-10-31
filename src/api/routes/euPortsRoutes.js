'use strict';

const EUPortsController = require("../controllers/euPortsController");
const multer = require('fastify-multer');
const upload = multer({dest: 'uploads/'});
const _ = require('lodash');
const csv = require('csvtojson');

module.exports = async function (fastify, opts) {

    fastify.post('/uploadEUPorts', {preHandler: upload.single('file')}, async function (req, reply) {
        if (!req.isMultipart()) {
            reply.code(400).send(new Error('Request is not multipart!!!'));
            return
        }

        csv().fromFile(req.file.path)
            .then(async (json) => {
                await EUPortsController.uploadEUPorts(json);

                reply
                    .code(200)
                    .header('Content-Type', 'application/json; charset=utf-8')
                    .send(JSON.stringify("Data saved successfully!!!"));
            });

        console.log('/uploadEUPorts :: ', reply.getResponseTime());
    });

    fastify.post('/saveEUPort', async function (request, reply) {
        const response = await EUPortsController.saveEUPort(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/saveEUPort :: ', reply.getResponseTime());
    });

    fastify.get('/getAllEUPorts', async function (request, reply) {
        const response = await EUPortsController.getAllEUPorts();

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/getAllEUPorts :: ', reply.getResponseTime());
    });

    fastify.get('/syncAllEUPorts', async function (request, reply) {
        const response = await EUPortsController.syncAllEUPorts();

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/syncAllEUPorts :: ', reply.getResponseTime());
    });

};