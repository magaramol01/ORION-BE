'use strict';

/*
* CRUD CONTROLLER
* */

const AudiTrailModel = require("../models/auditTrailModel");
const todayHistoryModel = require('../models/triggeredOutcomesTodayModel');
const FailureAdvisoriesModel = require("../models/failureAdvisoriesModel");
const RuleConfigsModel = require("../models/ruleConfigsModel");
const ShipModel = require("../models/shipModel");
const {Util} = require("../utils/util");
const dateFormat = require('dateformat');
const _ = require('lodash');
const appSettingsModel = require('../models/appSettingsModel');

let allDataAlert = null;
let allDataAlarm = null;

const create = async function (request) {
    const todayHistoryData = request.body;

    if (!todayHistoryData)
        throw new Error('Cannot store empty todayhistory!');

    todayHistoryData.Data = JSON.stringify(todayHistoryData.Data);

    const result = await todayHistoryModel.saveTodayHistoryOutcomes(todayHistoryData);

    if (result.inserted > 0) {
        const historyKey = result.generated_keys[0];

        console.log("todayHistory created successfully!!!");
        return historyKey;
    } else {
        return "Error occurred while creating a todayHistory!!!";
    }
};

const readAllData = async function (filterObject, request) {
    const vesselName = request.query.vesselName;
    const vesselId = ShipModel.getShipIdByMappingName(vesselName);

    const startDate = dateFormat(request.query.startDate,Util.getCommonDateFormat());
    const endDate = dateFormat(request.query.endDate,Util.getCommonDateFormat());
    const activePage = Number(request.query.activePage);

    let {
        itemsCountPerPage,
        totalItemsCount,
        pageRangeDisplayed,
        responseForAlertAlarmScreen
    } = await DateFilterForAlertAlarm(startDate,endDate,filterObject,vesselId,activePage);

    if(filterObject==="alarm"){
        allDataAlarm = _.reverse(_.sortBy(responseForAlertAlarmScreen,['endDate']));
        return {
            activePage,
            itemsCountPerPage,
            totalItemsCount,
            pageRangeDisplayed,
            tableData: allDataAlarm
        };
    }else{
        allDataAlert = _.reverse(_.sortBy(responseForAlertAlarmScreen,['endDate']));
        return {
            activePage,
            itemsCountPerPage,
            totalItemsCount,
            pageRangeDisplayed,
            tableData: allDataAlert
        };
    }
};

const DateFilterForAlertAlarm = async function (startDate,endDate,filterObject,vesselId,activePage=1) {
    //triggeredOutcomesTodayController.js
    const {itemsCountPerPage, pageRangeDisplayed} = appSettingsModel.getAppSettingsJsonData().pagination;

    let skipedRows = (activePage - 1) * itemsCountPerPage;
    let AllRules = await RuleConfigsModel.getRuleConfigsJsonData();

    const minDateJsonData = await todayHistoryModel.getHistoryMinDateData(filterObject, vesselId, startDate, endDate, skipedRows, itemsCountPerPage);
    let maxDateJsonDataTemp = await todayHistoryModel.getHistoryMaxDateData(filterObject, vesselId, startDate, endDate, skipedRows, itemsCountPerPage);

    let maxDateJsonData = [];
    for (let i = 0; i < minDateJsonData.length; i++) {
        let dataMatch = _.find(maxDateJsonDataTemp, function (o) {
            return o.advisorykey == minDateJsonData[i].advisorykey
        });
        maxDateJsonData[i] = dataMatch != undefined ? dataMatch : minDateJsonData[i];
    }
    let responseForAlertAlarm = [];
    try {
        for (let key in minDateJsonData) {
            let RuleMessage = "";
            let RuleId = maxDateJsonData[key].ruleKey;
            if (RuleId != undefined) {
                if (!!AllRules[RuleId]) {
                    if (AllRules[RuleId].condition.isRange) {
                        let tempId = AllRules[RuleId].condition.range;
                        RuleMessage = "Value is not between " + tempId.fromOperator + " " + tempId.from + " and " + tempId.toOperator + " " + tempId.to;
                    }
                    if (AllRules[RuleId].condition.isSingleValue) {
                        let tempId = AllRules[RuleId].condition.singleValue;
                        RuleMessage = "Value is " + tempId.valueOperator + " " + tempId.value;
                    }
                }

                let objectForAlertPage = {
                    "id": minDateJsonData[key].id,
                    "Advisorykey": minDateJsonData[key].advisorykey,
                    "startDate": minDateJsonData[key].timestamp,
                    "endDate": maxDateJsonData[key].timestamp,
                    "acknowledgeStatus": minDateJsonData[key].acknowledgeStatus,
                    "Comment": minDateJsonData[key].comment,
                    "Message": maxDateJsonData[key].observantMessage + " |  " + AllRules[RuleId].description + " | " + RuleMessage + " | Received value : " + maxDateJsonData[key].liveValue,
                    "MachineName": maxDateJsonData[key].machineType,
                    "vesselId": minDateJsonData[key].vesselId,
                    "rulekey": RuleId,
                    "liveValue": maxDateJsonData[key].liveValue
                }
                responseForAlertAlarm.push(objectForAlertPage);
            }
        }
    } catch (e) {
        console.log(e);
    }
    return {
        activePage,
        itemsCountPerPage,
        totalItemsCount: responseForAlertAlarm.length,//todo
        pageRangeDisplayed,
        responseForAlertAlarmScreen: responseForAlertAlarm
    };
}
const update = async function (request) {
    const updatedTodayHistoryData = request.body;

    if (!updatedTodayHistoryData)
        throw new Error('Cannot update History due to insufficient details!');

    let id = updatedTodayHistoryData.id;
    let advisoryKey = updatedTodayHistoryData.Advisorykey;
    let ruleKey = updatedTodayHistoryData.rulekey;
    let vesselId = updatedTodayHistoryData.vesselId;
    let acknowledgedStatus = updatedTodayHistoryData.acknowledgeStatus;
    let comment = updatedTodayHistoryData.Comment;

    const result = await todayHistoryModel.updateTodayHistoryById(advisoryKey, ruleKey, vesselId,acknowledgedStatus,comment);

    if(result){
        const auditTrailInfo = Util.getAuditTrailInfo("update", "Triggered Outcome", id);
        AudiTrailModel.saveAuditTrail({
            userId: request.session.user.id,
            ipAddress: request.ip,
            action: auditTrailInfo.actionMsg,
            description: auditTrailInfo.descMsg
        });
    }

    return result;
};

const removeTodaysData = () => {
    todayHistoryModel.deleteTodaysData();
};

const filterData = async function (request) {
    const mainData = request.body;
    const vesselName = mainData.alarmVesselValue;
    let observantType = mainData.key.toLowerCase();
    let machineType = mainData.machineName;
    let acknowledgeStatus = mainData.status;

    const vesselId = ShipModel.getShipIdByMappingName(vesselName);

    let FromDate = mainData.fromDate;
    let startDate = dateFormat(FromDate,Util.getCommonDateFormat());
    let toDate = mainData.toDate;
    let EndDate = dateFormat(toDate,Util.getCommonDateFormat());
    let removeCommentData = await DateFilterForAlertAlarm(startDate,EndDate,observantType,vesselId);
    let HistoryData = [];
    HistoryData = removeCommentData.responseForAlertAlarmScreen;
    let HistoryDataWithMachine = [];
    if(machineType){
        if(machineType.length==0){
            HistoryDataWithMachine = HistoryData;
        }else{
            for(let i=0;i<machineType.length;i++){
                for(let j=0;j<HistoryData.length;j++){
                    if(HistoryData[j].MachineName==machineType[i]){
                        HistoryDataWithMachine.push(HistoryData[j]);
                    }
                }
            }
        }
    }else{
        HistoryDataWithMachine = HistoryData;
    }
    let HistoryDataWithMachineAndAck = [];
    if(acknowledgeStatus!="null" && acknowledgeStatus!=null){
        if(true){
            let acknowledgevalue ;
            if(acknowledgeStatus=="Acknowledge"){
                acknowledgevalue = false;
            }else{
                acknowledgevalue = true;
            }
            for(let i=0;i<HistoryDataWithMachine.length;i++){
                if(HistoryDataWithMachine[i].acknowledgeStatus!=acknowledgevalue){
                    HistoryDataWithMachineAndAck.push(HistoryDataWithMachine[i]);
                }
            }
        }
    }else{
        HistoryDataWithMachineAndAck = HistoryDataWithMachine;
    }
    if(observantType=="alarm"){
        allDataAlarm = _.reverse(_.sortBy(HistoryDataWithMachineAndAck,['endDate']));
        removeCommentData.responseForAlertAlarmScreen = allDataAlarm
        return removeCommentData;
    }else{
        allDataAlert = _.reverse(_.sortBy(HistoryDataWithMachineAndAck,['endDate']));
        removeCommentData.responseForAlertAlarmScreen = allDataAlert
        return removeCommentData;
    }
};

const getAlertHistory = async function (request) {
    const observantType = request.query.alertType;
    const vesselId = parseInt(request.query.vesselId);

    let result = [];
    result =  await todayHistoryModel.getAlertTodayHistoryJsonData(observantType, vesselId);
    //if (result.length < 15) {
     //   result = await todayHistoryModel.getAlertTodayFromHistoryJsonData(observantType, vesselId);
   // }
    return result;
};

const getAllVesselsLatestAlarms = async function (observantType) {
    return await todayHistoryModel.getAllVesselsLatestAlarms(observantType);
};

module.exports = {
    create: create,
    readAllData: readAllData,
    update: update,
    removeTodaysData: removeTodaysData,
    filterData: filterData,
    getAlertHistory: getAlertHistory,
    getAllVesselsLatestAlarms: getAllVesselsLatestAlarms
};
