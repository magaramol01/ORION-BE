'use strict';

require('log-timestamp');

const DataAccessAdaptorSingleton = require("../adaptors/dataAccessAdaptorSingleton");
const {WIDGET_TAG_MAPPING, SHIP, USER}  = require("../utils/tables");
const widgetTagMapping = require("../mappers/widgetTagMapping");

let widgetTagMappingJsonData = null;

exports.loadWidgetTagMappingJsonDataInMemory = async function () {
    if (widgetTagMappingJsonData == null) {
        widgetTagMappingJsonData = await exports.getAllwidgetTagMapping();
    }
};

exports.getAllWidgetTagMappingJsonData = function () {
    return widgetTagMappingJsonData;
};

exports.createTable = async function () {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `create table ${WIDGET_TAG_MAPPING}
    (
        id serial
        constraint ${WIDGET_TAG_MAPPING}_pk
            primary key,
        islatest boolean,
        data json,
        userid integer
        constraint ${WIDGET_TAG_MAPPING}_${USER}_id_fk
            references "${USER}",
        vesselid integer
        constraint ${WIDGET_TAG_MAPPING}_${SHIP}_id_fk
            references ${SHIP},
        filename varchar,
        originaldata varchar  
    );`;

    await DataAccessAdaptor.executeQueryAsync(query, null)
        .then(resp => {
            if (resp)
                console.log("WidgetTagMapping Table Created")
            else
                console.error("Could Not Create WidgetTagMapping Table");
        })
};

exports.uploadWidgetTagFile = async function (vesselId,userId,isLatest,data,fileName,originaldata) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const insertQuery = `INSERT INTO ${WIDGET_TAG_MAPPING}
    (vesselid, userid, islatest, data,filename,originaldata)
      VALUES($1, $2, $3, $4, $5, $6) RETURNING id;`;

    const values = [
        vesselId,userId,isLatest,data,fileName,originaldata
    ];

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(insertQuery, values);

    if (dbResponse) {
        console.log("widget mapping file insered on widgettagmapping Table");
        return dbResponse.rows[0];
    } else {
        console.error("Error Occurred While Inserting widget mapping file In widgettagmapping Table");
    }
};

exports.getLastUpdatedWidgetByShip = async function (vesselId) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const updateQuery = `SELECT id,filename,vesselid FROM  ${WIDGET_TAG_MAPPING} where islatest = $1 and vesselid = $2;`;

    const values = [true,vesselId]

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(updateQuery, values);

    if (dbResponse) {
        console.log("all previous widget islatest is update successfully");
        return dbResponse.rows[0];
    } else {
        console.error("Error Occurred While get Last Widget File Records from widgettagmapping Table");
        return false;
    }
};

exports.getOriginalData = async function (id,vesselId) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const updateQuery = `SELECT originaldata FROM  ${WIDGET_TAG_MAPPING} where id = $1 and islatest = true and vesselid = $2;`;

    const values = [id,vesselId]

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(updateQuery, values);

    if (dbResponse) {
        console.log("all previous widget islatest is update successfully");
        return dbResponse.rows[0];
    } else {
        console.error("Error Occurred While get Last Widget File Records from widgettagmapping Table");
        return false;
    }
};

exports.updatePreviousIsLatest = async function (vesselId) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const updateQuery = `UPDATE ${WIDGET_TAG_MAPPING} SET islatest = $1 where vesselid = $2;`;

    const values = [false,vesselId]

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(updateQuery, values);

    if (dbResponse) {
        console.log("all previous widget islatest is update successfully");
        return dbResponse.rowCount === 1 ? true : false;
    } else {
        console.error("Error Occurred While Updating islatest from widgettagmapping Table");
        return false;
    }
};

exports.getAllwidgetTagMapping = async function () {
    let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const selectQuery = `SELECT id, data, vesselid as "vesselId"  from ${WIDGET_TAG_MAPPING} where islatest = true;`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(selectQuery, null);

    if (dbResponse) {
        console.log("Fetched All widgetTagMapping Data from widgetTagMapping Table");

        let allwidgetTagMapping = {};
        for(let i=0;i<dbResponse.rows.length;i++){
            const responseData = dbResponse.rows[i];
            const vesselId = responseData.vesselId;
            const data = responseData.data;

            const widgetToTagMap = new Map();

            for (let savedwidgetid in data){
                const widgetIdValue = data[savedwidgetid];
                let mapClass = new widgetTagMapping();
                mapClass.setTag(widgetIdValue.tag);
                mapClass.setCaption(widgetIdValue.caption);
                mapClass.setUnit(widgetIdValue.unit);
                mapClass.setPrecision(widgetIdValue.precision);
                mapClass.setStartValue(widgetIdValue.startValue);
                mapClass.setEndValue(widgetIdValue.endValue);
                mapClass.setMinValue(widgetIdValue.minValue);
                mapClass.setMaxValue(widgetIdValue.maxValue);
                mapClass.setLowerBoundValue(widgetIdValue.lowerBoundValue);
                mapClass.setUpperBoundValue(widgetIdValue.upperBoundValue);
                mapClass.setDigitalData(widgetIdValue.digitalData);
                widgetToTagMap.set(savedwidgetid, mapClass);
            }
            allwidgetTagMapping[vesselId] = widgetToTagMap;
        }
        return allwidgetTagMapping;
    } else {
        console.error("Error Occurred While fetching data from widgetTagMapping Table");
        return {};
    }
};
