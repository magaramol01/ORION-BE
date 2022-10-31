'use strict';

const DataAccessAdaptorSingleton = require("../adaptors/dataAccessAdaptorSingleton");
const {RTDAS_REAL_TIME_ONE_DAY_DATA}  = require("../utils/tables");


exports.getLastRdas = async (id) => {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

   const selectQuery = `SELECT  vesselid,packettime,packetdata  from ${RTDAS_REAL_TIME_ONE_DAY_DATA} WHERE vesselid=${id} ORDER BY id DESC  LIMIT 1`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(selectQuery, null);

    if (dbResponse) {
        return dbResponse.rows;
    } else {
        console.error("Error Occurred While Fetching Data From rtdasrealtimedata Table");
        return [];
    }
};

