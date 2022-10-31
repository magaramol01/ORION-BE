'use strict';

require('log-timestamp');

const DataAccessAdaptorSingleton = require("../adaptors/dataAccessAdaptorSingleton");
const {RULES_CSV_DATA}  = require("../utils/tables");

exports.createTable = async function () {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `create table ${RULES_CSV_DATA}
    (
        id serial
        constraint ${RULES_CSV_DATA}_pk
            primary key,
        rulecsvdata varchar,
        rulecsvname varchar,
        uploadeddate timestamp,
        vesselid integer,
        userid integer
    );`;

    await DataAccessAdaptor.executeQueryAsync(query, null)
        .then(resp => {
            if (resp)
                console.log("rulecsvdata Table Created");
            else
                console.error("Could Not Create rulecsvdata Table");
        })
};

exports.saveRuleCsvData = async function (fileName,allData,vesselId,userId,formattedDateTime) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const insertQuery = `INSERT INTO ${RULES_CSV_DATA}
    (rulecsvname, rulecsvdata, vesselid, userid,uploadeddate)
      VALUES($1, $2, $3, $4, $5) RETURNING id;`;

    const values = [
        fileName,allData,vesselId,userId,formattedDateTime
    ];

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(insertQuery, values);

    if (dbResponse) {
        console.log("rule csv file data inserted in rulecsvdata Table");
        return dbResponse.rows[0];
    } else {
        console.error("Error Occurred While Inserting rulecsvdata In rulecsvdata Table");
    }
};

exports.lastRuleFile = async function (vesselId) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const updateQuery = `SELECT id,rulecsvname,vesselid,userid,uploadeddate FROM  ${RULES_CSV_DATA} where vesselid = $1;`;

    const values = [vesselId]

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(updateQuery, values);

    if (dbResponse) {
        console.log("all previous widget islatest is update successfully");
        return dbResponse.rows[dbResponse.rows.length-1];
    } else {
        console.error("Error Occurred While get Last Widget File Records from widgettagmapping Table");
        return false;
    }
};

exports.downloadRuleCsv = async function (id,vesselId) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const updateQuery = `SELECT rulecsvdata FROM  ${RULES_CSV_DATA} where id = $1 and vesselid = $2;`;

    const values = [id,vesselId]

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(updateQuery, values);

    if (dbResponse) {
        console.log("download file data get successfully !!!");
        return dbResponse.rows[0];
    } else {
        console.error("Error Occurred While get download file data from rulecsvdata Table");
        return false;
    }
};