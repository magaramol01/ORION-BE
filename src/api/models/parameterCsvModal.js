'use strict';

require('log-timestamp');

const DataAccessAdaptorSingleton = require("../adaptors/dataAccessAdaptorSingleton");
const {PARAMETER_CSV_DATA}  = require("../utils/tables");

exports.createTable = async function () {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `create table ${PARAMETER_CSV_DATA}
    (
        id serial
        constraint ${PARAMETER_CSV_DATA}_pk
            primary key,
        parametercsvdata varchar,
        parametercsvname varchar,
        uploadeddate timestamp,
        vesselid integer,
        userid integer
    );`;

    await DataAccessAdaptor.executeQueryAsync(query, null)
        .then(resp => {
            if (resp)
                console.log("parametercsvdata Table Created");
            else
                console.error("Could Not Create parametercsvdata Table");
        })
};

exports.saveParameterCsvData = async function (fileName,allData,vesselId,userId,formattedDateTime) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const insertQuery = `INSERT INTO ${PARAMETER_CSV_DATA}
    (parametercsvname, parametercsvdata, vesselid, userid,uploadeddate)
      VALUES($1, $2, $3, $4, $5) RETURNING id;`;

    const values = [
        fileName,allData,vesselId,userId,formattedDateTime
    ];

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(insertQuery, values);

    if (dbResponse) {
        console.log("rule csv file data inserted in parametercsvdata Table");
        return dbResponse.rows[0];
    } else {
        console.error("Error Occurred While Inserting parametercsvdata In parametercsvdata Table");
    }
};

exports.lastParameterFile = async function (vesselId) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const updateQuery = `SELECT id,parametercsvname,vesselid,userid,uploadeddate FROM  ${PARAMETER_CSV_DATA} where vesselid = $1;`;

    const values = [vesselId]

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(updateQuery, values);

    if (dbResponse) {
        return dbResponse.rows[dbResponse.rows.length-1];
    } else {
        console.error("Error Occurred While get Last File Records from parametercsvdata Table");
        return false;
    }
};

exports.downloadParameterCsv = async function (id,vesselId) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const updateQuery = `SELECT parametercsvdata FROM  ${PARAMETER_CSV_DATA} where id = $1 and vesselid = $2;`;

    const values = [id,vesselId]

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(updateQuery, values);

    if (dbResponse) {
        console.log("download file data get successfully !!!");
        return dbResponse.rows[0];
    } else {
        console.error("Error Occurred While get download file data from parametercsvdata Table");
        return false;
    }
};