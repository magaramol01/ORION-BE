'use strict';

const {Util} = require("../utils/util");
const CharterPartyFormController = require("../controllers/charterPartyFormController");
const CharterPartyFormModel = require("../models/charterPartyFormModel");

module.exports = async function (fastify, opts) {

    fastify.post('/saveCharterFormData', async function (request, reply) {
        const response = await CharterPartyFormController.create(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        Util.logRequestServeTime(request, reply, '/saveCharterFormData');
    });

    fastify.get('/getCharterFormData', async function (request, reply) {
        const response = CharterPartyFormModel.getLatestCharterData();

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        Util.logRequestServeTime(request, reply, '/getCharterFormData');
    });

}
