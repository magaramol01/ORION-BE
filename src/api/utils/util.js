'use strict';

// This class represents all static functions

const appSettingsModel = require('../models/appSettingsModel');
const {getRTDASRegistrationJsonData} = require('../models/rtdasModel');
const fs = require('fs');
const _ = require('lodash');
require('log-timestamp');
const parameterScalingMapper = require("../mappers/parameterScalingMapper");
let Util = {};

const operators = ['=', '+', '-', '*', '/', '>', '<', '>=', '<=', '==', '!='];
const logicalOperators = ['||', '&&', '|', '&'];
const UserController = require('../controllers/userController');

Util.readTextFile = function (file, callback) {
    fs.readFile(file, 'utf8', function (err, data) {
        if (err) {
            console.log(err);
        }
        callback(data);
    });
};

Util.writeTextFile = function (file, newId) {
    // fs.readFile(file, 'utf8', function (err, data) {
    //     if (err) {
    //         return console.log(err);
    //     }
    //     let result = data.replace(newId, 'replacement');
    //
    //     fs.writeFile(file, result, 'utf8', function (err) {
    //         if (err) return console.log(err);
    //     });
    // });
};

Util.readJsonFile = function (json) {

};

Util.writeJsonFile = function (fileName, jsonData) {
    fs.writeFile(fileName, JSON.stringify(jsonData, null, 4), function writeJSON(err) {
        if (err) {
            return err;
        } else {
            return fileName + 'File written successfully!';
        }
    });
};

Util.appendJsonFile = function (filePath, jsonData) {
    // fs.appendFile(filePath, JSON.stringify(jsonData), err => {
    //     if (err) {
    //         return console.error(err);
    //     }
    //     console.log(filePath + "File updated successfully!")
    // });
};

Util._isNumber = function (value) {
    // return !isNaN(parseFloat(value)) && isFinite(value);
    return value.match(/^[^a-zA-Z0-9]+$/) === null;
};

Util._isOperator = function (value) {
    for (let i = 0; i < operators.length; i++) {
        if (operators[i] === value) return true
    }
    return false
};

Util._isLogicalOperator = function (value) {
    for (let i = 0; i < logicalOperators.length; i++) {
        if (logicalOperators[i] === value) return true
    }
    return false
};

Util.getCurrentDateTime = function(){
    // let date = new Date();
    // let timestamp = date.getTime();
    let date_ob = new Date();

// current date
// adjust 0 before single digit date
    let date = ("0" + date_ob.getDate()).slice(-2);

// current month
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);

// current year
    let year = date_ob.getFullYear();

// current hours
//     let hours = date_ob.getHours();
    let hours = ("0" + date_ob.getHours()).slice(-2)

// current minutes
//     let minutes = date_ob.getMinutes();
    let minutes = ("0" + date_ob.getMinutes()).slice(-2)

// current seconds
//     let seconds = date_ob.getSeconds();
    let seconds = ("0" + date_ob.getSeconds()).slice(-2)
// prints date & time in YYYY-MM-DD HH:MM:SS format
    console.log(" DATETIME" + year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds);
    return (year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds);
};

Util.getArrFromJsonForRTDAS = function(JSONObject){
    let arrOfObject = null;
    if(!JSONObject["AlertData"]){
        arrOfObject = JSONObject
    }else{
        arrOfObject = JSONObject["AlertData"];
    }
    let arrOfKeys = [];
    for(let item in arrOfObject){
        arrOfKeys = [...arrOfKeys,...Object.keys(arrOfObject[item])];
    }
    return [...new Set(arrOfKeys)];
};

Util.getArrOfLastTimeLog = function(JSONObject){
    let arrOfObject = JSONObject;
    let arrOfTimeLog = [];
    for(let item in arrOfObject){
        arrOfTimeLog.push(arrOfObject[item].Timestamp);
    }
    return arrOfTimeLog;
};

Util.combineRTDASWithRTDASName = function(rtdasName,RTDASMapping){
    let combinedRTDAS = [];
    for(let item in RTDASMapping){
        if(RTDASMapping[item] !=="TimeLogged" && RTDASMapping[item] !=="TimeLogged_Local" && RTDASMapping[item] !=="Full_Time_Local"){
            combinedRTDAS.push(rtdasName + ":" + RTDASMapping[item]);
        }
    }
    return combinedRTDAS;
};

Util.combineRTDASWithCSVName = function(RTDASMapping){
    let combinedRTDAS = [];
    for(let item in RTDASMapping){
            combinedRTDAS.push(RTDASMapping[item].TagName);
    }
    return combinedRTDAS;
};
Util.combineScalingWithCSVName = function(RTDASMapping){
    let combinedRTDAS = [];
    for(let item in RTDASMapping){
        let demoObj = {};
        demoObj[RTDASMapping[item].TagName] = RTDASMapping[item].ScalingValue;
        combinedRTDAS.push(demoObj);
    }
    return combinedRTDAS;
};
Util.compareDateTimeDifference = function(dateTime1,dateTime2,differenceMin){
    let date1 = new Date(dateTime1);
    let date2 = new Date(dateTime2);
    let difference = date1 - date2;
    return difference > differenceMin;
};

Util.getAuditTrailInfo = function(actionType, actionOn, actionElement) {
    let auditTrailInfo = {};

    switch (actionType) {
        case "create":
            auditTrailInfo["actionMsg"] = actionOn + " Created";
            auditTrailInfo["descMsg"] = "New " + actionOn + " created - [" + actionElement + "]";
            break;

        case "update":
            auditTrailInfo["actionMsg"] = actionOn + " Updated";
            auditTrailInfo["descMsg"] = "Existing " + actionOn + " updated - [" + actionElement + "]";
            break;

        case "delete":
            auditTrailInfo["actionMsg"] = actionOn + " Deleted";
            auditTrailInfo["descMsg"] = "Existing " + actionOn + " deleted - [" + actionElement + "]";
            break;

        case "read":
            auditTrailInfo["actionMsg"] = actionOn + " Fetched";
            auditTrailInfo["descMsg"] = actionOn + " fetched - [" + actionElement + "]";
            break;

        case "sync":
            auditTrailInfo["actionMsg"] = actionOn + " Sync";
            auditTrailInfo["descMsg"] = actionOn + " sync - [" + actionElement + "]";
            break;

        case "upload":
            auditTrailInfo["actionMsg"] = actionOn + " Uploaded";
            auditTrailInfo["descMsg"] = actionOn + " Uploaded - [File Name " + actionElement + "]";
            break;

        case "csvReplaced":
            auditTrailInfo["actionMsg"] = actionOn + " Replaced";
            auditTrailInfo["descMsg"] = actionOn + " Replaced - [File Name " + actionElement + "]";
            break;

    }

    return auditTrailInfo;
};

Util.checkExecutionStartTimeWithCurrentTime = function (startTime,timeToExecute,unit){
    let differenceInDateTime = new Date(Util.getCurrentDateTime()) - startTime;
    let differenceToExecute;
    switch (unit) {
        case "sec":
            differenceToExecute = timeToExecute * 1000;
            break;
        case "min":
            differenceToExecute = timeToExecute * 60 * 1000;
            break;
        case "hrs":
            differenceToExecute = timeToExecute * 60 * 60 * 1000;
            break;
        case "days":
            differenceToExecute = timeToExecute * 24 * 60 * 60 * 1000;
    }
    return differenceInDateTime >= differenceToExecute;
};

Util.isEmptyJsonObject = function (jsonObj) {
    return !Object.keys(jsonObj).length;
};

Util.printRequestServeTime = function (reply) {
    console.log("Request serve in :: " + reply.getResponseTime() + " time.");
};

Util.logRequestServeTime = function (request, reply, requestURL) {
    console.log(requestURL + " Request serve in :: " + reply.getResponseTime() + " time.");
};

Util.printLog = function(msg) {
    console.log(msg)
};

Util.processAllData = function(request,Originaldata){
    if(!request){
        return Originaldata;
    }else{
        let searchValue = request.query.search;
        let activePage = request.query.activepage;
        if(!searchValue && !activePage){
            return Originaldata;
        }else{
            let filterdata = Util.sortAllData(searchValue,Originaldata);
            let result = {
                activePage: activePage,
                itemsCountPerPage: 10,
                totalItemsCount: Object.keys(filterdata).length,
                pageRangeDisplayed: 10,
                data: filterdata
            }
            return result;
        }
    }
};

Util.sortAllData = function(searchValue,OriginalData){
    let myOrderedArray =_.sortBy(OriginalData, o => o.name);
    let ResultData = {};
        if(searchValue===""){
            Object.keys(myOrderedArray).map(function(key, index){
                if(Object.keys(ResultData).length<10){
                    ResultData[key] = myOrderedArray[key];
                }else{}
            });
            return ResultData;
        }else{
            Object.keys(myOrderedArray).map(function(key, index) {
                if(myOrderedArray[key].name.toLowerCase().includes(searchValue.toString())){
                    if(Object.keys(ResultData).length<10){
                        ResultData[key] = myOrderedArray[key];
                    }
                }else{}
            });
            return ResultData;
        }
};

Util.getObservantType = function(failureAdvisoryData) {
    if (failureAdvisoryData.isAlarm) {
        return "alarm";
    } else if (failureAdvisoryData.isFailureAdvisory) {
        // return "advisory";
        return "alert";
    } else {
        return "alert";
    }
};

Util.sortedDataBasedOnUser = function(incomingData,Userid) {
    let userData = {};
    for(let i=0;i<Object.keys(incomingData).length;i++){
        if(Object.values(incomingData)[i].userId===Userid){
            userData[Object.keys(incomingData)[i]]=Object.values(incomingData)[i];
        }
    }
    return userData;
}
Util.sortedShipBasedOnUser = function(incomingData,Userid) {
    let userData = [];
    for(let i=0;i<incomingData.length;i++){
        if(incomingData[i].userId===Userid){
            userData.push(incomingData[i]);
        }
    }
    return userData;
}
Util.getShipName = async function(userId){
    const allUserName = await UserController.readAll();
    return allUserName[userId].ShipName;
};

Util.getNewDate = function() {
    return new Date(new Date().toLocaleString('en-US', { timeZone: appSettingsModel.getAppSettingsJsonData().timeZone}));
};

Util.getCommonDateFormat = function () {
    return "yyyy-mm-dd HH:MM:ss";
};

// 2021-02-13 12:00:00
Util.getCommonDateFormat1 = function () {
    return "yyyy-mm-dd hh:MM:ss";
};

Util.getCommonDateFormatDD_MM_YYYY_HH_MM = function () {
    return "dd-mm-yyyy HH:MM";
};

Util.getDBCommonDateOnlyFormat = function (){
    return 'DD-MM-YYYY';
};

Util.getDBCommonDateTimeFormat = function () {
    return 'YYYY-MM-DD HH24:MI:SS';
};

Util.getDDMMMYYYY = function () {
    return 'dd mmm yyyy';
};

// input : 2020-11-12T14:52:40.990, 2020-11-12T22:15:53.990+0800
// output : 2020-11-12 14:52:40, 2020-11-12 22:15:53
Util.getDateInCommonFormat = function (dateStr) {
    if (dateStr) {
        return dateStr.replace(/T/, ' ').replace(/\..+/, '');
    }
    return dateStr;
};

Util.scalingDataFromCsvFile = function () {
    const rtdasRegsJSONData = getRTDASRegistrationJsonData();

    let liveValueData = [];
    let fileId;

    let rtdasRegsJSONDataKeys = Object.keys(rtdasRegsJSONData);
    for (let i = rtdasRegsJSONDataKeys.length - 1; i >= 0; i--) {
        let key = "RTDAS"+rtdasRegsJSONDataKeys.length;
        if (!rtdasRegsJSONData.hasOwnProperty(key)) {
            continue;
        }
        if (rtdasRegsJSONData[key].type !== "DB") {
            if (rtdasRegsJSONData[key]["jsonObject"].type === "FILE") {
                fileId = key;
                break;
            }
        }
    }

    if (!!fileId) {
        liveValueData = rtdasRegsJSONData[fileId]['jsonObject']['fileObject']['jsonFile']['data'];
    }

    return liveValueData;
};

Util.getVesselIdentifier = function (vesselName) {
    const vesselNameCopy = _.cloneDeep(vesselName).toLowerCase();

    if (vesselNameCopy) {
        if (vesselNameCopy === "MV CHINA EXPRESS".toLowerCase() || vesselNameCopy === "CHINA EXPRESS".toLowerCase()) {
            return "nova-china-express";
        } else if (vesselNameCopy === "MV INDONESIA EXPRESS".toLowerCase() || vesselNameCopy === "INDONESIA EXPRESS".toLowerCase()) {
            return "nova-indonesia-express";
        } else if (vesselNameCopy === "MV BRAZIL EXPRESS".toLowerCase() || vesselNameCopy === "BRAZIL EXPRESS".toLowerCase()) {
            return "nova-brazil-express";
        }
        return vesselName;
    }
    return vesselName;
};

Util.getFleetFilterData = function (ignorShipId,shipsData) {
    let responsedata = [];
    for(let i =0;i<shipsData.length;i++){
        if(!ignorShipId.includes(shipsData[i].id)){
            responsedata.push(shipsData[i]);
        }
    }
    return responsedata;
}

Util.filterRecordsByVesselIdForPagination = function (records, vesselId, activePage, searchArr=[], searchMachineArr=[]) {
    if (activePage) {
        activePage = Number(activePage);
        let filterRecordByVessel = {};
        const {itemsCountPerPage, pageRangeDisplayed} = appSettingsModel.getAppSettingsJsonData().pagination;
        let totalItemsCount = 0;
        const fromIndex = (activePage - 1) * itemsCountPerPage;
        const toIndex = fromIndex + itemsCountPerPage;
        if (!records)
            return;

        const recordKeys = Object.keys(records);

        for (let i = 0; i < recordKeys.length; i++) {
            const rKey = recordKeys[i];
            const recordData = records[rKey];
            let isSearchMatched = true;
            let isMachineMatched = Array.isArray(searchMachineArr) && searchMachineArr.length !== 0 ? searchMachineArr.indexOf(recordData.machine) > -1 : true;

            for(let sIndex = 0; sIndex < searchArr.length; sIndex++) {
                const {searchKey, searchValue} = searchArr[sIndex];
                isSearchMatched = searchValue ? recordData[searchKey].toLocaleLowerCase().indexOf(searchValue.toLocaleLowerCase()) >= 0 : true;
                if(!isSearchMatched) {
                    isSearchMatched = false;
                    break;
                }
            }

            if (recordData.vesselId === vesselId && isSearchMatched && isMachineMatched) {
                if (totalItemsCount >= fromIndex && totalItemsCount < toIndex) {
                    filterRecordByVessel[recordData["id"]] = recordData;
                }
                totalItemsCount++;
            }
        }

        return {
            activePage,
            itemsCountPerPage,
            totalItemsCount,
            pageRangeDisplayed,
            data: filterRecordByVessel
        };
    }
};

Util.filterRecordsByVesselId = function (records,vesselId) {
    let filterRecordByVessel = {};
    if(!records)
        return;

    for(let i=0;i<Object.keys(records).length;i++) {
        if(records[Object.keys(records)[i]].vesselId === vesselId) {
            filterRecordByVessel[Object.keys(records)[i]] = Object.values(records)[i];
        }
    }
    return filterRecordByVessel;
};

Util.getScaledValue = function (val, vesselId, liveParameterMappingKey,precision) {
    let valWithScaling = "";
    let precisionValue = 2;
    if(precision!=="" && !!precision){
        precisionValue = parseInt(precision);
    }
    if(val === true || val === false) {
        valWithScaling = val;
    } else {
        let scalingVal = parameterScalingMapper.getAllParametersDataByShipName(vesselId, liveParameterMappingKey);
        valWithScaling = val * scalingVal;
        if (!isNaN(parseFloat(valWithScaling))) {
            valWithScaling = parseFloat(valWithScaling).toFixed(precisionValue);
        }else {
            valWithScaling = val;
        }
    }
    return valWithScaling;
};

Util.convertMapToJsonObj = function (map) {
    return Array.from(map).reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
    }, {});
};

Util.getObjectAsKeyValueByIdName = function (tempObj) {
    let objectAsKeyValueByIdName = {};
    for (let key in tempObj) {
        objectAsKeyValueByIdName[tempObj[key].id] = tempObj[key].name;
    };
    return objectAsKeyValueByIdName;
}

Util.filterKafkaData = function (tags,data) {
    let responseArray = [];
    for (let i =0;i<data.length;i++){
        if(data[i].hasOwnProperty("Timestamp")){
            responseArray[i] = {"Timestamp" :  data[i]["Timestamp"]}
        }else{
            responseArray[i] = {"Timestamp" :  ""};
        }
        for(let j=0;j<tags.length;j++){
            const tagName = tags[j];
            if(data[i].hasOwnProperty(tagName)){
                responseArray[i][tagName] = data[i][tagName];
            }
        }
    }
    return responseArray;
}


Util.getDefaultVesselId = function (shipsData) {
    let defaultVesselId = "";
    // for(let i=0 ; i<shipsData.length ; i++){
    //     if(shipsData[i].value == "nova-china-express"){
    //         defaultVesselId = shipsData[i].vesselId;
    //         break;
    //     }
    // }
    defaultVesselId = shipsData[0].vesselId;
    return defaultVesselId;
}

module.exports = {
    Util: Util
};
