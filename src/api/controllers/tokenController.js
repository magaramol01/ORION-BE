'use strict';

const dateFormat = require('dateformat');
const _ = require('lodash');
const tokenModal = require("../models/tokenModel");
const UserModel = require("../models/userModel");
const realTimeParameterDataHolder = require("../mappers/realTimeParameterDataHolder");
const shipController = require("../controllers/shipController");
const appSettingsModel = require('../models/appSettingsModel');
const md5 = require('md5');
const {Util} = require("../utils/util");

const checkTokenStatus = async function (userDetails) {
    const allTokens = await tokenModal.getAllTokensData();
    let tokenFlag = "";
    for (let i = 0; i < Object.keys(allTokens).length; i++) {
        let tokenKey = Object.keys(allTokens)[i];
        if (userDetails.Email === allTokens[tokenKey].email && userDetails.Password === allTokens[tokenKey].password) {
            let currentTime = new Date();
            let issueTime = allTokens[tokenKey].issueTime;
            let formatedIssueTime = new Date(issueTime);
            let expireTime = allTokens[tokenKey].expireTime;
            let formatedExpireTime = new Date(expireTime);
            if (currentTime.getTime() > formatedIssueTime.getTime() && currentTime.getTime() < formatedExpireTime.getTime()) {
                tokenFlag = tokenKey;
                break;
            }
        }
    }
    return tokenFlag;
};

const userAuthenticate = async function (request) {
    request.body.Password = md5(request.body.Password);
    const userData = request.body;
    if (!userData.Email || !userData.Password) {
        return "Invalid parameters passed";
    }
    const checkEmail = await UserModel.getEmail(userData.Email);
    const userDetails = await UserModel.validateUser(userData);
    if (checkEmail === 1 && userDetails.length !== 0) {
        console.log("user is authorised in db");
        const checkTokenStatus = await module.exports.checkTokenStatus(userDetails[0]);
        if (checkTokenStatus === "") {
            let applyHourSession = false;
            let issueTime = new Date();
            let expireTime = _.cloneDeep(issueTime);
            if (applyHourSession) {
                expireTime.setHours(issueTime.getHours() + appSettingsModel.getAppSettingsJsonData().sessionHour);
            } else {
                expireTime.setHours(23, 59, 59, 999);
            }
            let tokenDetails = {
                "email": userDetails[0].Email,
                "password": userDetails[0].Password,
                "issueTime": dateFormat(issueTime, "yyyy-mm-dd HH:MM:ss"),
                "expireTime": dateFormat(expireTime, "yyyy-mm-dd HH:MM:ss")
            };
            const result = await tokenModal.insertToken(tokenDetails);
            return result.generated_keys[0];
        } else {
            return checkTokenStatus;
        }
    } else {
        return "invalid user name or password unable to authenticate";
    }
};

const getUserAuthenticationData = async function (request) {
    const userData = request.body;
    if (!userData.token || !userData.type || !userData.imo) {
        return "Invalid parameters passed";
    }
    const result = await module.exports.getTokenStatus(userData.token);
    if (result.tokenStatus === "session are valid") {
        let allShip = await shipController.getAllData();
        let shipName = null;
        let shipOriginalName = "";
        let shipOriginalMmsi = "";
        let shipOriginalCallSign = "";
        for (let i = 0; i < allShip.length; i++) {
            if (userData.imo === allShip[i].Imo) {
                shipName = allShip[i].MappingName;
                shipOriginalName = allShip[i].Name;
                shipOriginalMmsi = allShip[i].Mmsi;
                shipOriginalCallSign = allShip[i].CallSign;
            }
        }
        if (!shipName) {
            return "Imo are not registered";
        } else {
            const allMappingData = realTimeParameterDataHolder.getAllData();
            let gpsLatitude = "";
            let gpsLongitude = "";
            let shipSpeed = "";
            let gpsLatitudeNS = "";
            let gpsLongitudeEW = "";
            let timestamp = "";
            if (!allMappingData[shipName]) {
            } else {
                gpsLatitude = allMappingData[shipName]["AIVDO_Latitude"];
                gpsLongitude = allMappingData[shipName]["AIVDO_Longitude"];
                shipSpeed = allMappingData[shipName]["GPVTG_5"];
                gpsLatitudeNS = allMappingData[shipName]["AIVDO_Latitude_Direction"];
                gpsLongitudeEW = allMappingData[shipName]["AIVDO_Longitude_Direction"];
                timestamp = allMappingData[shipName]["timestamp"];
            }
            let responseData = {
                "imo": userData.imo,
                "latitude": gpsLatitude+""+gpsLatitudeNS,
                "longitude": gpsLongitude+""+gpsLongitudeEW,
                "speed_over_ground": shipSpeed,
                "mmsi": shipOriginalMmsi,
                "shipname": shipOriginalName,
                "callsign": shipOriginalCallSign,
                "time_in_vessel": timestamp
            }
            await module.exports.userCounter(result.userName);
            return responseData;
        }
    } else {
        return result.tokenStatus
    }
};

const getTokenStatus = async function (token) {
    const allTokens = await tokenModal.getAllTokensData();
    let status = allTokens.hasOwnProperty(token);
    if (status) {
        let currentTime = new Date();
        let issueTime = allTokens[token].issueTime;
        let formatedIssueTime = new Date(issueTime);
        let expireTime = allTokens[token].expireTime;
        let formatedExpireTime = new Date(expireTime);
        if (currentTime.getTime() > formatedIssueTime.getTime() && currentTime.getTime() < formatedExpireTime.getTime()) {
            return {
                "tokenStatus" : "session are valid",
                "userName" : allTokens[token].email
            };
        } else {
            return {
                "tokenStatus" : "The associated token with this API call has expired"
            };
        }
    } else {
        return {
            "tokenStatus" : "Token is invalid"
        };
    }
}

const userCounter = async function (userName) {
    let allUserCounterJsonData = await tokenModal.getAllUserCounterData();
    let today = new Date();
    let dateMask = Util.getDBCommonDateOnlyFormat().toLowerCase();
    let processDate = dateFormat(today, dateMask);
    let counter = 0;
    let id = "";
    for(let key in allUserCounterJsonData){
        if(
            allUserCounterJsonData[key].userName === userName &&
            dateFormat(allUserCounterJsonData[key].date, dateMask) === processDate
        ){
            counter = allUserCounterJsonData[key].counter;
            id = key;
            break;
        }
    }
    if(id === ""){
        let createUserCounter = {
            userName : userName,
            date : processDate,
            counter : 1
        }
        const result = await tokenModal.insertUserCounter(createUserCounter);
        if(result) {
            console.log("counter inserted for user ::"+userName);
            return "counter Inserted";
        } else {
            console.log("counter not inserted for user ::"+userName);
            return "error occured at the time of counter create";
        }
    }else{
        counter = ++counter;
        const result = await tokenModal.updateUserCounter(id,counter);
        if(result) {
         console.log("counter update for user :: "+userName);
         return "counter Updated";
        } else {
            console.log("counter not updated for user ::"+userName);
            return "error occured at the time of counter update";
        }
    }
}

module.exports = {
    userAuthenticate: userAuthenticate,
    getUserAuthenticationData: getUserAuthenticationData,
    checkTokenStatus: checkTokenStatus,
    getTokenStatus: getTokenStatus,
    userCounter: userCounter
};