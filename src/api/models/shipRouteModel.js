'use strict';

require('log-timestamp');
const DataAccessAdaptorSingleton = require("../adaptors/dataAccessAdaptorSingleton");
const { VOYAGE_FORECAST}  = require("../utils/tables");
const { VESSEL_JOURNEY_COUNTER}  = require("../utils/tables");
const { STORM_GLASS_WEATHER}  = require("../utils/tables");
const {fetchVoyageForecastData} = require("../controllers/marinTrafficController");

exports.getJourneyCounter = async  function(vesselId) {

    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const query = `SELECT journeycounter FROM ${VESSEL_JOURNEY_COUNTER} where vesselid = ${vesselId}  ;`;
    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);

    if (dbResponse) {
        return dbResponse.rows;
    } else {
        console.error("Could Not Load Fleet Table Data");
    }

};


exports.updateJourneyConterVoyageForcast = async function(nextJourneyCounter,Route,vesselId) {

    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const updateQuery = `UPDATE ${VOYAGE_FORECAST} SET route = $1, journeycounter = $2 where vesselid = $3 RETURNING id;`;

    const values = [Route, nextJourneyCounter, vesselId]

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(updateQuery, values);

    if (dbResponse) {
        console.log("Updated journeycounter from VOYAGE_FORECAST Table")
        return true;
    } else {
        console.error("Error Occurred While Updating journeycounter from VOYAGE_FORECAST Table");
        return false;
    }

};



exports.insertJourneyConterVoyageForecast = async function(nJc,Route,vesselId,response,username,ct) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const updateQuery=`UPDATE ${VOYAGE_FORECAST} SET Flag=false where vesselid =${vesselId};`;
    const insertQuery = `INSERT INTO  ${VOYAGE_FORECAST} (vesselid,response,route,journeycounter,username,res_timestamp,Flag)
    VALUES (${vesselId},'${response}','${Route}','${nJc}','${username}','${ct}',true)`;
    await DataAccessAdaptor.executeQueryAsync(updateQuery,null);
    const dbResponse = await DataAccessAdaptor.executeQueryAsync(insertQuery,null);
    if (dbResponse) {
        console.log("route into VOYAGE_FORECAST Table")
        return true;
    } else {
        console.error("Error Occurred While Updating journeycounter from VOYAGE_FORECAST Table");
        return false;
    }

};

exports.updateVoyageForecast = async function(nJc,Route,vesselId,response,username,ct) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const updateQuery=`UPDATE ${VOYAGE_FORECAST} SET Flag='false' where vesselid =${vesselId};`;
    const insertQuery = `INSERT INTO  ${VOYAGE_FORECAST} (vesselid,response,route,journeycounter,username,res_timestamp,Flag)
    VALUES (${vesselId},'${response}','${Route}','${nJc}','${username}','${ct}','true')`;
    await DataAccessAdaptor.executeQueryAsync(updateQuery,null);
    const dbResponse = await DataAccessAdaptor.executeQueryAsync(insertQuery,null);
    if (dbResponse) {
        console.log("Update into VOYAGE_FORECAST Table")
        return true;
    } else {
        console.error("Error Occurred While Updating journeycounter from VOYAGE_FORECAST Table");
        return false;
    }

};


// exports.updateVoyageForecast = async function(Route,vesselId) {
//     const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
//     const updateQueryAsInsert = `UPDATE ${VOYAGE_FORECAST} SET route = $1 where vesselid = $2 RETURNING id;`;
//
//     const values = [Route,
//         vesselId]
//
//     const dbResponse = await DataAccessAdaptor.executeQueryAsync(updateQueryAsInsert, values);
//     if (dbResponse) {
//         console.log("Updated journeycounter from VOYAGE_FORECAST Table")
//         return true;
//     } else {
//         console.error("Error Occurred While Updating journeycounter from VOYAGE_FORECAST Table");
//         return false;
//     }
//
// };

exports.updateJourneyConter = async function(nextJourneyCounter,Route,vesselId) {

    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const updateQuery1 = `UPDATE ${VESSEL_JOURNEY_COUNTER} SET journeycounter = $1 where vesselid = $2 RETURNING id;`;
    const values2 = [nextJourneyCounter, vesselId]

    const dbResponse1 = await DataAccessAdaptor.executeQueryAsync(updateQuery1, values2);
    if (dbResponse1) {
        console.log("Updated ShipById from Ship Table")
        return true;
    } else {
        console.error("Error Occurred While Updating ShipById from Ship Table");
        return false;
    }

}


exports.fetchForecastData=async function(vesselId){
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const fetchQuery=`SELECT id,route,res_timestamp,username,journeycounter from ${VOYAGE_FORECAST} where  vesselid = ${vesselId} AND response='insert' ORDER BY res_timestamp DESC`;
    const dbResponse = await DataAccessAdaptor.executeQueryAsync(fetchQuery, null);

    if (dbResponse) {
        return dbResponse.rows;
    } else {
        console.error("Did not fetch data from db");
    }
}

exports.fetchUpdatedForecastData=async function(vesselId){
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const fetchQuery=`SELECT id,route,res_timestamp,username,journeycounter from ${VOYAGE_FORECAST} where  vesselid = ${vesselId} AND response='update' ORDER BY res_timestamp DESC`;
    const dbResponse = await DataAccessAdaptor.executeQueryAsync(fetchQuery, null);

    if (dbResponse) {
        return dbResponse.rows;
    } else {
        console.error("Did not fetch data from db");
    }
}

exports.insertRedPointDataInTable=async function(vesselId,preDT,currDT,preJC,currJC){
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const updateQuery=`UPDATE ${STORM_GLASS_WEATHER} SET journeycounter=${currJC}
          WHERE vesselid=${vesselId} AND journeycounter=${preJC} AND packetts between
          '${preDT}' AND '${currDT}'`;

    const dbResponse1 = await DataAccessAdaptor.executeQueryAsync(updateQuery,null);

    if(dbResponse1){
        console.log("Updated Storm Glass Weather Data")
        return true;
    }else{
        console.log("Failed updation of storm glass weather data");
        return false;
    }
}
