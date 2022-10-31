'use strict';

const DataAccessAdaptorSingleton = require("../adaptors/dataAccessAdaptorSingleton");
const {MODBUS_TRACKER_DATA_HISTORY} = require("../utils/tables");

exports.saveModbusTrackerDataHistory = function (modbusTrackerHistoryData) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `INSERT INTO ${MODBUS_TRACKER_DATA_HISTORY}` +
        `(time, isnavigationdatareceived, ismachinerydatareceived, vesselid)` +
        `VALUES($1, $2, $3, $4);`;
    const values = [modbusTrackerHistoryData.time, modbusTrackerHistoryData.isNavigationDataReceived,
        modbusTrackerHistoryData.isMachineryDataReceived, modbusTrackerHistoryData.vesselId];

    DataAccessAdaptor.executeQuery(query, values);
};

exports.getAllModbusTrackerDataHistory = async function () {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const selectQuery = `SELECT time, isnavigationdatareceived as "isNavigationDataReceived", 
    ismachinerydatareceived as "isMachineryDataReceived", vesselid as "vesselId" 
     FROM ${MODBUS_TRACKER_DATA_HISTORY};`;
    const dbResponse = await DataAccessAdaptor.executeQueryAsync(selectQuery, null);

    if (dbResponse) {
        return dbResponse.rows;
    } else {
        console.error("Error Occurred While fetching data from Modbus Tracker Data History table");
    }

    return [];
};

exports.getModbusTrackerDataHistoryByVesselId = async function (vesselId) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const selectQuery = `SELECT time, isnavigationdatareceived as "isNavigationDataReceived", 
     ismachinerydatareceived as "isMachineryDataReceived", vesselid as "vesselId" 
     FROM ${MODBUS_TRACKER_DATA_HISTORY} WHERE vesselid = ${vesselId} ORDER BY time DESC;`;
    const dbResponse = await DataAccessAdaptor.executeQueryAsync(selectQuery, null);

    if (dbResponse) {
        return dbResponse.rows;
    } else {
        console.error("Error Occurred While fetching data from Modbus Tracker Data History table");
    }

    return [];
};

exports.getModbusTrackerDataHistoryByVesselIdAndPagination = async function (vesselId, noOfItems, skippedRowsIndex) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const selectQuery = `SELECT id, time, isnavigationdatareceived as "isNavigationDataReceived", 
     ismachinerydatareceived as "isMachineryDataReceived", vesselid as "vesselId", count(*) OVER() as "totalRows"  
     FROM ${MODBUS_TRACKER_DATA_HISTORY} WHERE vesselid = ${vesselId} 
     ORDER BY time DESC 
     LIMIT ${noOfItems} 
     OFFSET ${skippedRowsIndex};`;
    const dbResponse = await DataAccessAdaptor.executeQueryAsync(selectQuery, null);

    if (dbResponse) {
        return dbResponse.rows;
    } else {
        console.error("Error Occurred While fetching data from Modbus Tracker Data History table");
    }

    return [];
};

exports.getModbusTrackerDataHistoryByVesselIdAndDates = async function (vesselId, fromDate, toDate) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const selectQuery = `SELECT id, time, isnavigationdatareceived as "isNavigationDataReceived", 
     ismachinerydatareceived as "isMachineryDataReceived", vesselid as "vesselId"   
     FROM ${MODBUS_TRACKER_DATA_HISTORY} WHERE vesselid = ${vesselId} AND 
     time BETWEEN '${fromDate}' AND '${toDate}'  
     ORDER BY time ASC;`;
    const dbResponse = await DataAccessAdaptor.executeQueryAsync(selectQuery, null);

    if (dbResponse) {
        return dbResponse.rows;
    } else {
        console.error("Error Occurred While fetching data from Modbus Tracker Data History table");
    }

    return [];
};

exports.createTable = async function () {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `create table ${MODBUS_TRACKER_DATA_HISTORY}
    (
        id serial
        constraint ${MODBUS_TRACKER_DATA_HISTORY}_pk
            primary key,
        time varchar,
        isNavigationDataReceived boolean,
        isMachineryDataReceived boolean,
        vesselId integer
    );`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);

    if (dbResponse) {
        console.log("Modbus Tracker Data History Table Created Successfully!!!");
    } else {
        console.error("Error occurred while creating Modbus Tracker Data History Table!!!");
    }
};