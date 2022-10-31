'use strict';

const tokenController = require("../controllers/tokenController");

module.exports = async function (fastify, opts) {

    fastify.post('/11537a70-dd82-4881-81dc-3de55f22bdd6/authenticate', async function (request, reply) {
        const response = await tokenController.userAuthenticate(request);

        if (response === "Invalid parameters passed" || response === "invalid user name or password unable to authenticate") {
            let invalidResponse = {
                message: response,
                error: "Invalid Input",
                statusCode: 400
            };

            reply
                .code(400)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send(JSON.stringify(invalidResponse));
        } else {
            reply
                .code(200)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send(JSON.stringify(response));
        }
        console.log('/11537a70-dd82-4881-81dc-3de55f22bdd6/authenticate :: ', reply.getResponseTime());
    });

    fastify.post('/11537a70-dd82-4881-81dc-3de55f22bdd6/getdata', async function (request, reply) {
        const response = await tokenController.getUserAuthenticationData(request);

        if (response === "Invalid parameters passed" || response === "The associated token with this API call has expired" || response === "Token is invalid" || response === "Imo are not registered") {
            let invalidResponse = {
                message: response,
                error: "Invalid Input",
                statusCode: 400
            };

            reply
                .code(400)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send(JSON.stringify(invalidResponse));
        } else {
            reply
                .code(200)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send(JSON.stringify(response));
        }

        console.log('/11537a70-dd82-4881-81dc-3de55f22bdd6/getdata :: ', reply.getResponseTime());
    });

};