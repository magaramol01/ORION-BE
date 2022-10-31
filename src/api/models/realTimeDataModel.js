'use strict';

const DataAccessAdaptorSingleton = require("../adaptors/dataAccessAdaptorSingleton");
const {RTDAS_REAL_TIME_DATA, SHIP} = require("../utils/tables");

exports.save = function (realTimeData) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `INSERT INTO ${RTDAS_REAL_TIME_DATA}` +
        `(packetdata, packettime, timereceived, vesselid)` +
        `VALUES($1, $2, $3, $4);`;
    const values = [realTimeData.packetData, realTimeData.packetTime, realTimeData.timeReceived, realTimeData.vessel];

    DataAccessAdaptor.executeQuery(query, values);
};

exports.createTable = async function () {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `CREATE TABLE ${RTDAS_REAL_TIME_DATA}
    (
        id serial
        constraint ${RTDAS_REAL_TIME_DATA}_pk
            primary key,
        packetData jsonb,
        packetTime timestamp,
        timeReceived timestamp,
        vesselId integer
            constraint ${RTDAS_REAL_TIME_DATA}_${SHIP}_id_fk
                references ${SHIP}
    );`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);

    if (dbResponse) {
        console.log("RTDASRealTimeData Table Created Successfully!!!");
    } else {
        console.error("Error occurred while creating RTDAS Real Time Data Table!!!");
    }
};