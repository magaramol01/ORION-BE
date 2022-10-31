'use strict';

const HistoryOutcomesController = require("../controllers/triggeredOutcomesHistoryController");
const {Util} = require("../utils/util");

module.exports = async function (fastify, opts) {

    fastify.post('/deleteHistory', async function (request, reply) {
        const response = await HistoryOutcomesController.removeById(request.query.id);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        Util.logRequestServeTime(request, reply, '/deleteHistory');
    });

};