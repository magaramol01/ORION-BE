'use strict';

/*
* CRUD CONTROLLER
* */

const _ = require('lodash');
const ShipModel = require("../models/shipModel");
const UserModel = require("../models/userModel");
const dateFormat = require('dateformat');
const parameterCsvModal = require("../models/parameterCsvModal");
const {Util} = require("../utils/util");
const { Parser } = require('json2csv');

const lastParameterFile = async function(request){
    const vesselName = request.query.vesselName;
    const vesselId = ShipModel.getShipIdByMappingName(vesselName);
    let Result ;
    let response = {};
    if(!!vesselId){
        Result = await parameterCsvModal.lastParameterFile(vesselId);
        if(!!Result){
            const createdtime = dateFormat(Result['uploadeddate'], Util.getCommonDateFormat());
            const allUser =  await UserModel.getAllUser();
            const UserData =  _.filter(allUser,function (o){return o.uId == Result['userid']});
            const UserName = UserData[0].FirstName;
            response['userName'] = UserName;
            response['fileName'] = Result['parametercsvname'];
            response['createdTime'] = createdtime;
            response['id'] = Result['id'];
            response['vesselid'] = Result['vesselid'];
        }
    }
    return response;
};

const downloadParameterCsvData = async function(request){
    const vesselId = parseInt(request.query.vesselId);
    const fileName = request.query.fileName;
    const id = parseInt(request.query.id);
    let originalData = await parameterCsvModal.downloadParameterCsv(id,vesselId);
    originalData = JSON.parse(originalData.parametercsvdata);
    const fields = ["TagName", "ParameterName", "Description", "Unit","ScalingValue","VesselName","MachineName","NormalRange","SpecifiedRange"];
    const json2csv = new Parser({ fields });
    const csv = json2csv.parse(originalData);
    return {cavData:csv,fileName:fileName};
}

module.exports = {
    lastParameterFile: lastParameterFile,
    downloadParameterCsvData: downloadParameterCsvData
};
