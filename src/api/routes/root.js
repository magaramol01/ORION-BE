'use strict';

module.exports = async function (fastify, opts) {

    fastify.ready(() => {
        console.log(fastify.printRoutes())
    });

};
