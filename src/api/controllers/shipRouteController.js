'use strict';
const shipRouteModel = require("../models/shipRouteModel");
const shipModel = require("../models/shipModel");
const VesselJourneyCounterModel = require("../models/vesselJourneyCounterModel");
const VoyageForecastModel = require("../models/voyageForecastModel");
const dateFormat = require('dateformat');
const {Util} = require("../utils/util");

const saveShipRoute = async function(request) {

    let data = request.body
    const vesselName = data.vesselLabel;
    const Route = data.route;
    const vesselId = shipModel.getShipIdByMappingName(vesselName);
    const journeyID = await shipRouteModel.getJourneyCounter(vesselId);
    let nextJourneyCounter = journeyID[0].journeycounter + 1;
     const username=request.session.user.FirstName;
    const response = data.response;
    const currentTimestamp = dateFormat(Util.getNewDate(), Util.getCommonDateFormat());

     //let result = await shipRouteModel.updateJourneyConterVoyageForcast(nextJourneyCounter,Route,vesselId);
   let result = await shipRouteModel.insertJourneyConterVoyageForecast(nextJourneyCounter,Route,vesselId,response,username,currentTimestamp);

    if(result) {
        await VoyageForecastModel.syncVoyageForecastJsonData();
    }

    let  result1 = await shipRouteModel.updateJourneyConter(nextJourneyCounter,Route,vesselId);
    if(result1) {
        await VesselJourneyCounterModel.syncVesselJourneyCounterJsonData();
    }

};


const updateShipRoute = async function(request) {

    let data = request.body
    const vesselName = data.vesselLabel;
    const Route = data.route;
    const vesselId = shipModel.getShipIdByMappingName(vesselName);
    const journeyID = await shipRouteModel.getJourneyCounter(vesselId);
    let nextJourneyCounter = journeyID[0].journeycounter;
    const username=request.session.user.FirstName;
    const response = data.response;
    const currentTimestamp = dateFormat(Util.getNewDate(), Util.getCommonDateFormat());

    //let result = await shipRouteModel.updateJourneyConterVoyageForcast(nextJourneyCounter,Route,vesselId);
    let result = await shipRouteModel.updateVoyageForecast(nextJourneyCounter,Route,vesselId,response,username,currentTimestamp);

    // let result = await shipRouteModel.updateVoyageForecast(Route,vesselId);
    if(result) {
        await VoyageForecastModel.syncVoyageForecastJsonData();
    }

    let  result1 = await shipRouteModel.updateJourneyConter(nextJourneyCounter,Route,vesselId);
    if(result1) {
        await VesselJourneyCounterModel.syncVesselJourneyCounterJsonData();
    }

};

const getShipRoute = async function(request) {

    let data = request.body
    const vesselName = data.vesselLabel;
    const vesselId = shipModel.getShipIdByMappingName(vesselName);

    let result = await shipRouteModel.fetchForecastData(vesselId);
    // if(result) {
    //     await VoyageForecastModel.syncVoyageForecastJsonData();
    // }
    return result;

};


const updateShipRouteData = async function(request) {

    let data = request.body
    const vesselName = data.vesselLabel;
    const vesselId = shipModel.getShipIdByMappingName(vesselName);

    let result = await shipRouteModel.fetchUpdatedForecastData(vesselId);
    return result;
};

const insertRedPointData = async function(request) {

    let data = request.body
    const vesselName = data.vesselLabel;
    console.log(vesselName);
    const vesselId = shipModel.getShipIdByMappingName(vesselName);
    const preDT=dateFormat(data.preDT , Util.getCommonDateFormat());
    const currDT=dateFormat(data.currDT , Util.getCommonDateFormat());
    const preJC=data.preJC;
    const currJC=data.currJC;
    let result = await shipRouteModel.insertRedPointDataInTable(vesselId,preDT,currDT,preJC,currJC);

    return result;

};




module.exports = {
    saveShipRoute: saveShipRoute,
    updateShipRoute :updateShipRoute,
    getShipRoute:getShipRoute,
    updateShipRouteData:updateShipRouteData,
    insertRedPointData:insertRedPointData
};