'use strict';

const cron = require('node-cron');
const appSettingsModel = require('../models/appSettingsModel');

const TodayOutcomesController = require("../controllers/triggeredOutcomesTodayController");
const machineController = require("../controllers/machineController");
const {Util} = require("../utils/util");

module.exports = async function (fastify, opts) {

    fastify.post('/createTodayHistory', async function (request, reply) {
        const response = await TodayOutcomesController.create(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        Util.logRequestServeTime(request, reply, '/createTodayHistory');
    });

    fastify.post('/getAllFilterAlarmTodayHistory', async function (request, reply) {
        const response = await TodayOutcomesController.filterData(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(response);

        Util.logRequestServeTime(request, reply, '/getAllFilterAlarmTodayHistory');
    });

    fastify.post('/getAllFilterAlertTodayHistory', async function (request, reply) {
        const response = await TodayOutcomesController.filterData(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(response);

        Util.logRequestServeTime(request, reply, '/getAllFilterAlertTodayHistory');
    });

    fastify.get('/getAllTodayHistory', async function (request, reply) {
        const response = {
            "alertAllData": await TodayOutcomesController.readAllData("alert", request),
            "alarmAllData": await TodayOutcomesController.readAllData("alarm", request),
            "machineArray": await machineController.machinesForAlert(request)
        };

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        Util.logRequestServeTime(request, reply, '/getAllTodayHistory');
    });

    fastify.post('/updateTodayHistory', async function (request, reply) {
        const response = await TodayOutcomesController.update(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        Util.logRequestServeTime(request, reply, '/updateTodayHistory');
    });

    fastify.get('/getTodayAlertData', async function (request, reply) {
        const response = {
            "alertHistory":  await TodayOutcomesController.getAlertHistory(request),
            "machineArray" : await machineController.machinesForAlert()
        };

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        Util.logRequestServeTime(request, reply, '/getAllTodayHistory');
    });

    cron.schedule('59 */23 * * *', () => {
        TodayOutcomesController.removeTodaysData();
    }, {
        scheduled: true,
        timezone: appSettingsModel.getAppSettingsJsonData().timeZone
    });

};