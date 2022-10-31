'use strict';

const DataAccessAdaptorSingleton = require("../adaptors/dataAccessAdaptorSingleton");
let {GraphUnitData} = require("../controllers/graphUnitData");

const {GRAPH_DATA, SHIP} = require("../utils/tables");

exports.loadGraphJsonDataInMemory = async function () {
    const allGraphData = await exports.getAllGraphData();

    let allGraphResult = allGraphData.reduce((c, v) => {
        c[v.vesselId] = c[v.vesselId] || {};
        c[v.vesselId][v.modbusParameterIdentifier] = c[v.vesselId][v.modbusParameterIdentifier] || {};
        c[v.vesselId][v.modbusParameterIdentifier]['graphData'] = v.graphData;
        return c;
    }, {});

    let flagResult = allGraphData.reduce((c, v) => {
        c[v.vesselId] = c[v.vesselId] || {};
        c[v.vesselId][v.modbusParameterIdentifier] = c[v.vesselId][v.modbusParameterIdentifier] || {};
        c[v.vesselId][v.modbusParameterIdentifier]['graphData'] = true;
        return c;
    }, {});

    if (!GraphUnitData) {
        GraphUnitData = require("../controllers/graphUnitData");
    }
    GraphUnitData.getInstance().setGraphDataFromDB(allGraphResult, flagResult);
};

exports.createTable = async function () {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `CREATE TABLE ${GRAPH_DATA}
    (
        id serial
        constraint ${GRAPH_DATA}_pk
            primary key,
        graphData jsonb,
        modbusParameterIdentifier varchar,
        vesselId integer
        constraint ${GRAPH_DATA}_${SHIP}_id_fk
            references ${SHIP}
    );`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);
    if (dbResponse) {
        console.log("Graph Data Table Created Successfully!!!")
    } else {
        console.error("Error while creating Graph Data Table!!!");
    }
};

exports.getByModbusParameterIdentifier = async function (modbusParameterIdentifier, shipName) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const reThinkDb = DataAccessAdaptor.getDBReference();

    let singleModbusParameterIdentifierData = [];

    try {
        singleModbusParameterIdentifierData = await new Promise((resolve, reject) => {
            reThinkDb.table('graphData')
                .filter({'modbusParameterIdentifier': modbusParameterIdentifier, 'vesselName': shipName})
                .run(DataAccessAdaptor.connection, function (err, cursor) {
                    if (err) {
                        console.error(err);
                    }
                    const graphData = cursor.toArray(function (err, result) {
                        if (err) {
                            console.error(err);
                        }
                    });
                    resolve(graphData);
                });
        });

        return singleModbusParameterIdentifierData;
    } catch (e) {
        console.error(e);
    }
};

exports.updateGraphData = async function (vesselId, modbusParameterIdentifier, graphData) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `UPDATE ${GRAPH_DATA}` +
        ` SET graphdata = $3` +
        ` WHERE vesselid = $1 AND modbusparameteridentifier = $2;`;
    const values = [vesselId, modbusParameterIdentifier, JSON.stringify(graphData)];

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, values);
    if (!dbResponse) {
        console.error("Error while updating data into Graph Data Table!!!");
    }
};

exports.insertGraphData = async function (graphData) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `INSERT INTO ` + GRAPH_DATA +
        ` (vesselid, modbusparameteridentifier, graphdata)` +
        ` VALUES ($1, $2, $3);`;
    const values = [graphData.vesselId, graphData.modbusParameterIdentifier, JSON.stringify(graphData.graphData)];

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, values);
    if (!dbResponse) {
        console.error("Error while inserting data into Graph Data Table!!!");
    }
};

exports.getAllGraphData = async function () {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    let graphData = [];

    const query = `SELECT id, vesselid as "vesselId", graphdata as "graphData", modbusparameteridentifier as "modbusParameterIdentifier" FROM ${GRAPH_DATA}`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);
    if (dbResponse) {
        graphData = dbResponse.rows;
    } else {
        console.error("Error while fetching data from Graph Data Table!!!");
    }

    return graphData;
};
