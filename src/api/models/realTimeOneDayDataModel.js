'use strict';

const cron = require('node-cron');
const appSettingsModel = require('../models/appSettingsModel');
const {RTDAS_REAL_TIME_ONE_DAY_DATA, SHIP} = require("../utils/tables");

const DataAccessAdaptorSingleton = require("../adaptors/dataAccessAdaptorSingleton");

exports.save = function (realTimeData) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `INSERT INTO ${RTDAS_REAL_TIME_ONE_DAY_DATA}` +
        `(packetdata, packettime, timereceived, vesselid)` +
        `VALUES($1, $2, $3, $4);`;
    const values = [realTimeData.packetData, realTimeData.packetTime, realTimeData.timeReceived, realTimeData.vessel];

    DataAccessAdaptor.executeQuery(query, values);
};

exports.clearAllTableData = function () {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `TRUNCATE ${RTDAS_REAL_TIME_ONE_DAY_DATA}`;
    DataAccessAdaptor.executeQuery(query, null);
    console.log("Data from RTDASRealTimeOneDayData table cleared Successfully!!!" + new Date());
};

exports.createTable = async function () {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `CREATE TABLE ${RTDAS_REAL_TIME_ONE_DAY_DATA}
    (
        id serial
        constraint ${RTDAS_REAL_TIME_ONE_DAY_DATA}_pk
            primary key,
        packetData jsonb,
        packetTime timestamp,
        timeReceived timestamp,
        vesselId integer
            constraint ${RTDAS_REAL_TIME_ONE_DAY_DATA}_${SHIP}_id_fk
                references ${SHIP}
    );`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);

    if (dbResponse) {
        console.log("RTDASRealTimeOneDayData Table Created Successfully!!!");
    } else {
        console.error("Error occurred while creating RTDASRealTimeOneDayData Table!!!");
    }
};

cron.schedule(appSettingsModel.getAppSettingsJsonData().cronJobs.realTimeDataCron.expression, () => {
    exports.clearAllTableData();
}, {
    scheduled: appSettingsModel.getAppSettingsJsonData().cronJobs.realTimeDataCron.isScheduled,
    timezone: appSettingsModel.getAppSettingsJsonData().timeZone
});