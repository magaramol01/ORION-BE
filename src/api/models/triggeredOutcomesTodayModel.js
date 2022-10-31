'use strict';

require('log-timestamp');
const _ = require('lodash');

const DataAccessAdaptorSingleton = require("../adaptors/dataAccessAdaptorSingleton");
const {Util} = require('../utils/util');
const {TRIGGERED_OUTCOMES_TODAY, TRIGGERED_OUTCOMES_HISTORY, FAILURE_ADVISORIES, RULE_CONFIGS, SHIP} = require("../utils/tables");

exports.saveTodayHistoryOutcomes = async function (todayHistoryData) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `INSERT INTO ${TRIGGERED_OUTCOMES_TODAY}` +
        `(acknowledgestatus, advisorykey, comment, companyname, data, livevalue, livevalueunit, machinetype, observantmessage, ` +
        `observanttype, rulekey, timestamp, vesselid)` +
        `VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`;
    const values = [todayHistoryData.acknowledgeStatus, todayHistoryData.advisorykey, todayHistoryData.comment,
        todayHistoryData.companyName, todayHistoryData.data, todayHistoryData.liveValue,
        todayHistoryData.liveValueUnit, todayHistoryData.machineType, todayHistoryData.observantMessage,
        todayHistoryData.observantType, todayHistoryData.ruleKey, todayHistoryData.timestamp, todayHistoryData.vesselId];

    DataAccessAdaptor.executeQuery(query, values);
};

exports.updateTodayHistoryById = async function (advisoryKey, ruleKey, vesselId,acknowledgedStatus,comment) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `UPDATE ${TRIGGERED_OUTCOMES_HISTORY}` +
        ` SET acknowledgeStatus = $4, comment = $5 ` +
        ` WHERE advisorykey = $1 AND rulekey = $2 AND vesselid = $3 ;`;
    const values = [advisoryKey, ruleKey, vesselId, acknowledgedStatus, comment];
    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, values);
    return !!dbResponse;
};

exports.deleteTodaysData = function () {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `TRUNCATE ${TRIGGERED_OUTCOMES_TODAY}`;
    DataAccessAdaptor.executeQuery(query, null);
};

exports.getAlertTodayHistoryJsonData = async function (observantType, vesselId) {
    let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    let query, values;
    if (vesselId) {
        query = `SELECT id, companyname as "companyName", data, livevalue as "liveValue", ` +
            `livevalueunit as "liveValueUnit", machinetype as "machineType", observantmessage as "observantMessage", 
            observanttype as "observantType", to_char(timestamp, '${Util.getDBCommonDateTimeFormat()}') as "timestamp", vesselid as "vesselId" ` +
            `FROM ${TRIGGERED_OUTCOMES_TODAY} ` +
            `WHERE vesselid = $1 AND observanttype = $2 ` +
            `ORDER BY timestamp DESC ` +
            'LIMIT 15;';
        values = [vesselId, observantType];
    } else {
        query = `SELECT id, companyname as "companyName", data, livevalue as "liveValue", ` +
            `livevalueunit as "liveValueUnit", machinetype as "machineType", observantmessage as "observantMessage", 
            observanttype as "observantType", to_char(timestamp, '${Util.getDBCommonDateTimeFormat()}') as "timestamp", vesselid as vesselId ` +
            `FROM ${TRIGGERED_OUTCOMES_TODAY} ` +
            `WHERE observanttype = $1 ` +
            `ORDER BY timestamp DESC ` +
            'LIMIT 15;';
        values = [observantType];
    }

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, values);
    if (dbResponse) {
        return dbResponse.rows;
    } else {
        console.error("Error while fetching data from triggeredOutcomesToday Table!!!");
    }
};

exports.getAlertTodayFromHistoryJsonData = async function (observantType, vesselId) {
    let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    let query, values;
    if (vesselId) {
        query = `SELECT id, companyname as "companyName", data, livevalue as "liveValue", ` +
            `livevalueunit as "liveValueUnit", machinetype as "machineType", observantmessage as "observantMessage", 
            observanttype as "observantType", to_char(timestamp, '${Util.getDBCommonDateTimeFormat()}') as "timestamp", vesselid as "vesselId" ` +
            `FROM ${TRIGGERED_OUTCOMES_HISTORY} ` +
            `WHERE vesselid = $1 AND observanttype = $2 ` +
            `ORDER BY timestamp DESC ` +
            'LIMIT 15;';
        values = [vesselId, observantType];
    } else {
        query = `SELECT id, companyname as "companyName", data, livevalue as "liveValue", ` +
            `livevalueunit as "liveValueUnit", machinetype as "machineType", observantmessage as "observantMessage", 
            observanttype as "observantType", to_char(timestamp, '${Util.getDBCommonDateTimeFormat()}') as "timestamp", vesselid as "vesselId" ` +
            `FROM ${TRIGGERED_OUTCOMES_HISTORY} ` +
            `WHERE observanttype = $1 ` +
            `ORDER BY timestamp DESC ` +
            'LIMIT 15;';
        values = [observantType];
    }

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, values);
    if (dbResponse) {
        return dbResponse.rows;
    } else {
        console.error("Error while fetching data from triggeredOutcomesToday Table!!!");
    }
};

exports.createTable = async function () {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `CREATE TABLE ${TRIGGERED_OUTCOMES_TODAY}
    (
        id serial 
        constraint ${TRIGGERED_OUTCOMES_TODAY}_pk
            primary key,
        acknowledgeStatus boolean,
        advisoryKey integer
        constraint ${TRIGGERED_OUTCOMES_TODAY}_${FAILURE_ADVISORIES}_id_fk
            references ${FAILURE_ADVISORIES},
        comment varchar,
        companyName varchar,
        data jsonb,
        liveValue numeric,
        liveValueUnit varchar,
        machineType varchar,
        observantMessage varchar,
        observantType varchar,
        ruleKey integer
        constraint ${TRIGGERED_OUTCOMES_TODAY}_${RULE_CONFIGS}_id_fk
            references ${RULE_CONFIGS},
        timestamp timestamp,
        vesselId integer
        constraint ${TRIGGERED_OUTCOMES_TODAY}_${SHIP}_id_fk
            references ${SHIP}
    );`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);
    if (dbResponse) {
        console.log("TriggeredOutcomesToday Table Created Successfully!!!");
    } else {
        console.error("Error Creating TriggeredOutcomesToday Table!!!");
    }
};

exports.getTodayHistoryData = async function (observantType, vesselId) {
    let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `SELECT id, companyname as "companyName", data, livevalue as "liveValue", ` +
        `livevalueunit as "liveValueUnit", machinetype as "machineType", observantmessage as "observantMessage", ` +
        `observanttype as "observantType", to_char(timestamp, '${Util.getDBCommonDateTimeFormat()}') as "timestamp" , vesselid as "vesselId", advisorykey, ` +
        `comment, rulekey as "ruleKey", acknowledgestatus as "acknowledgeStatus" ` +
        `FROM ${TRIGGERED_OUTCOMES_HISTORY} ` +
        `WHERE vesselid = $1 AND observanttype = $2 ` +
        `ORDER BY timestamp DESC ` +
        'LIMIT 10000;';
    const values = [vesselId, observantType];

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, values);
    if (dbResponse) {
        return dbResponse.rows;
    } else {
        console.error("Error while fetching data from triggeredOutcomesHistory Table!!!");
    }
};
exports.getHistoryMinDateData = async function (observantType,vesselId,startTime,endTime,skipedRows,limitvalue) {
    // triggeredOutcomesTodayModel.js
    let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `SELECT d.id as "id", d.companyname as "companyName", d.data as "data", d.livevalue as "liveValue", ` +
        `d.livevalueunit as "liveValueUnit", d.machinetype as "machineType", d.observantmessage as "observantMessage", ` +
        `d.observanttype as "observantType", to_char(d.timestamp, '${Util.getDBCommonDateTimeFormat()}') as "timestamp" , d.vesselid as "vesselId", d.advisorykey as "advisorykey", ` +
        `d.comment as "comment", d.rulekey as "ruleKey", d.acknowledgestatus as "acknowledgeStatus" ` +
        `FROM ( ` +
        `SELECT advisorykey, MIN(timestamp) as max_time ` +
        `FROM ${TRIGGERED_OUTCOMES_TODAY} ` +
        `where timestamp BETWEEN $1 AND $2 ` +
        `AND vesselid = $3 AND observanttype=$4 AND acknowledgestatus = false ` +
        `GROUP BY advisorykey ) s JOIN ${TRIGGERED_OUTCOMES_TODAY} d ` +
        `ON s.advisorykey = d.advisorykey AND s.max_time = d.timestamp ` +
        `ORDER BY advisorykey,timestamp LIMIT $5 OFFSET $6;`;

    const newQuery=`SELECT d.id as "id", 
                d.livevalue as "liveValue", d.livevalueunit as "liveValueUnit", d.machinetype as "machineType", 
                d.observantmessage as "observantMessage", d.observanttype as "observantType", to_char(d.timestamp, 'YYYY-MM-DD HH24:MI:SS') as "timestamp" , 
                d.vesselid as "vesselId", d.advisorykey as "advisorykey", d.comment as "comment", d.rulekey as "ruleKey", 
                d.acknowledgestatus as "acknowledgeStatus" FROM (SELECT *
                FROM (
                SELECT timestamp = min(timestamp) OVER () AS sel,
                    min(timestamp),advisorykey,max(id) as id
                FROM ${TRIGGERED_OUTCOMES_TODAY}
                WHERE timestamp  
                        BETWEEN  $1 AND $2  
                    AND vesselid = $3
                    AND observanttype=$4 
                    AND acknowledgestatus = false 
                    group by advisorykey,timestamp
                ) AS t
                WHERE t.sel) s JOIN ${TRIGGERED_OUTCOMES_TODAY} d ON d.advisorykey = s.advisorykey 
                AND d.id = s.id ORDER BY advisorykey,timestamp  LIMIT $5 OFFSET $6;`;
    const values = [startTime , endTime ,vesselId, observantType,limitvalue,skipedRows];

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, values);
    if (dbResponse) {
        return dbResponse.rows;
    } else {
        console.error("Error while fetching data from triggeredOutcomesHistory Table!!!");
    }
};
exports.getHistoryMaxDateData = async function (observantType,vesselId,startTime,endTime,skipedRows,limitvalue) {
    //triggeredOutcomesTodayModel.js
    let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `SELECT d.id as "id", d.companyname as "companyName", d.data as "data", d.livevalue as "liveValue", ` +
        `d.livevalueunit as "liveValueUnit", d.machinetype as "machineType", d.observantmessage as "observantMessage", ` +
        `d.observanttype as "observantType", to_char(d.timestamp, '${Util.getDBCommonDateTimeFormat()}') as "timestamp" , d.vesselid as "vesselId", d.advisorykey as "advisorykey", ` +
        `d.comment as "comment", d.rulekey as "ruleKey", d.acknowledgestatus as "acknowledgeStatus" ` +
        `FROM ( ` +
        `SELECT advisorykey, MAX(timestamp) as max_time ` +
        `FROM ${TRIGGERED_OUTCOMES_TODAY} ` +
        `where timestamp BETWEEN $1 AND $2 ` +
        `AND vesselid = $3 AND observanttype=$4 AND acknowledgestatus = false ` +
        `GROUP BY advisorykey ) s JOIN ${TRIGGERED_OUTCOMES_TODAY} d ` +
        `ON s.advisorykey = d.advisorykey AND s.max_time = d.timestamp ` +
        `ORDER BY advisorykey,timestamp LIMIT $5 OFFSET $6;`;

    const newQuery=`SELECT d.id as "id",
                d.livevalue as "liveValue", d.livevalueunit as "liveValueUnit", d.machinetype as "machineType", 
                d.observantmessage as "observantMessage", d.observanttype as "observantType", to_char(d.timestamp, 'YYYY-MM-DD HH24:MI:SS') as "timestamp" , 
                d.vesselid as "vesselId", d.advisorykey as "advisorykey", d.comment as "comment", d.rulekey as "ruleKey", 
                d.acknowledgestatus as "acknowledgeStatus" FROM (SELECT *
                FROM (
                SELECT timestamp = max(timestamp) OVER () AS sel,
                    max(timestamp),advisorykey,max(id) as id
                FROM ${TRIGGERED_OUTCOMES_HISTORY}
                WHERE timestamp  
                        BETWEEN  $1 AND $2  
                    AND vesselid = $3
                    AND observanttype=$4 
                    AND acknowledgestatus = false 
                    group by advisorykey,timestamp
                ) AS t
                WHERE t.sel) s JOIN ${TRIGGERED_OUTCOMES_HISTORY} d ON d.advisorykey = s.advisorykey 
                AND d.id = s.id ORDER BY advisorykey,timestamp  LIMIT $5 OFFSET $6;`;
    const values = [startTime , endTime ,vesselId, observantType,limitvalue,skipedRows];

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, values);
    if (dbResponse) {
        return dbResponse.rows;
    } else {
        console.error("Error while fetching data from triggeredOutcomesHistory Table!!!");
    }
};

exports.getAllVesselsLatestAlarms = async function (observantType) {
    let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    // let query = `SELECT sgw.observantmessage, sgw.observanttype, 
    //       sgw.vesselid as vesselId, sgw.timestamp 
    //         FROM ${TRIGGERED_OUTCOMES_TODAY} sgw 
    //         LEFT JOIN ${TRIGGERED_OUTCOMES_TODAY} b 
    //             ON sgw.vesselid = b.vesselid 
    //             AND sgw.timestamp < b.timestamp 
    //         WHERE b.timestamp IS NULL AND sgw.observanttype = '${observantType}';`;
    let query = ` SELECT max(observantmessage) as observantmessage, max(observanttype) as observanttype,
    max(timestamp) as timestamp, vesselid as vesselId 
    FROM ${TRIGGERED_OUTCOMES_TODAY}
    WHERE observanttype = '${observantType}'
    GROUP BY vesselId;`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query);

    if (dbResponse) {
        return dbResponse.rows;
    } else {
        console.error("Error while fetching data from triggeredOutcomesToday Table!");
        return [];
    }
};