'use strict';

/*
* CRUD CONTROLLER
* */

const _ = require('lodash');
const ShipModel = require("../models/shipModel");
const UserModel = require("../models/userModel");
const dateFormat = require('dateformat');
const ruleCsvModal = require("../models/ruleCsvModal");
const {Util} = require("../utils/util");
const { Parser } = require('json2csv');

const lastRuleFile = async function(request){
    const vesselName = request.query.vesselName;
    const vesselId = ShipModel.getShipIdByMappingName(vesselName);
    let Result ;
    let response = {};
    if(!!vesselId){
        Result = await ruleCsvModal.lastRuleFile(vesselId);
        if(!!Result){
            const createdtime = dateFormat(Result['uploadeddate'], Util.getCommonDateFormat());
            const allUser =  await UserModel.getAllUser();
            const UserData =  _.filter(allUser,function (o){return o.uId == Result['userid']});
            const UserName = UserData[0].FirstName;
            response['userName'] = UserName;
            response['fileName'] = Result['rulecsvname'];
            response['createdTime'] = createdtime;
            response['id'] = Result['id'];
            response['vesselid'] = Result['vesselid'];
        }
    }
    return response;
};

const downloadRuleCsvData = async function(request){
    const vesselId = parseInt(request.query.vesselId);
    const fileName = request.query.fileName;
    const id = parseInt(request.query.id);
    let originalData = await ruleCsvModal.downloadRuleCsv(id,vesselId);
    originalData = JSON.parse(originalData.rulecsvdata);
    const fields = ["ParameterName", "Condition", "Threshold", "RuleName","RuleDescription","Message","MachineName","Periodicity","Periodunit","VesselName","NoOfOccurrencesIsChecked","NoOfOccurrencesValue","isEvaluationFactorChecked","isEvaluationFactorType","isEvaluationFactorValue","isAlarm"];
    const json2csv = new Parser({ fields });
    const csv = json2csv.parse(originalData);
    return {cavData:csv,fileName:fileName};
}

module.exports = {
    lastRuleFile: lastRuleFile,
    downloadRuleCsvData: downloadRuleCsvData
};
