'use strict';

/*
* CRUD CONTROLLER
* */

const UserModel = require("../models/userModel");
const fetch = require('node-fetch');
const appSettingModal = require("../models/appSettingsModel");
const dateFormat = require('dateformat');
const {v4 : uuidv4} = require('uuid');
const path = require('path');
const fs = require('fs');
const WebexModel = require("../models/webexModel");
const _ = require('lodash');
const {sendMail} = require("../adaptors/mailer");
const {Util} = require("../../api/utils/util");

const saveWebexMeeting = async function (request) {
    const webexObject = request;
    let response = {};

    const result = await WebexModel.saveWebexMeeting(webexObject);

    if(result.id){
        response = {
            isSuccess:true,
                msg:"Meeting Scheduled",
        };
        const messageText = 'Hi there,<br><br>' +
            webexObject.hostDisplayName + ' is inviting you to a scheduled Smartship Hub - Remote support meeting<br><br>' +
            'Topic: '+ webexObject.title +' <br>'+
            'Time: ' + webexObject.start + ' (Singapore)<br><br>' +
            'Join Meeting Link <br>' +
            webexObject.webLink + '<br><br>' +
            'Thank you.<br><br>' +
            'Regards,<br>' +
            'Smart Ship Hub Support'
        sendMail(webexObject.emails,"",webexObject.subject, messageText, 'jdkk');

    } else {
        response = {
            isSuccess:false,
            msg:"Error Occurred while Scheduling meeting",
        };
    }
    return response;
};

const getMeetings = async function(request){
    return await WebexModel.getMeetings();
}

const updateMeetingStatus = async function(meetingid,statusValue){
    return WebexModel.updateMeetingStatus(meetingid,statusValue);
}

const webexUserAuthentication = async function(request){
    let userData = request.body;
    if (!userData.Email || !userData.Password || !userData.deviceid) {
        return "Invalid parameters passed.";
    }
    const checkEmail = await UserModel.getEmail(userData.Email);
    const userDetails = await UserModel.validateUser(userData);

    if (checkEmail && userDetails.length !== 0) {
        console.log("user is authorised in db");
        const todaysDate = Util.getNewDate();
        const formatedDate = dateFormat(todaysDate,'yyyy-mm-dd');
        const userId = userDetails[0].id
        const checkMeetingTokenStatus = await WebexModel.checkTokenStatus(userId,formatedDate);
        const previousOtherData = await UserModel.getPreviousOtherData(userId);
        let temp = JSON.parse(previousOtherData);
        temp.deviceid = userData.deviceid;
        const defaultTimezone = temp.defaulttimezone;
        const updatedOtherData = JSON.stringify(temp);
        if(checkMeetingTokenStatus.length > 0) {
            await UserModel.updateOtherData(updatedOtherData,userId);
            return {
                token : checkMeetingTokenStatus[0].tokenid,
                defaulttimezone : defaultTimezone
            };
        } else {
            let tokenData = {};
            tokenData.tokenid = uuidv4();
            tokenData.username = userDetails[0].email;
            tokenData.userid = userDetails[0].id;
            tokenData.shiplist = userDetails[0].shipname;
            tokenData.issuedate = formatedDate;

            const inserResult = await WebexModel.insertMeetingToken(tokenData);
            if(inserResult){
                await UserModel.updateOtherData(updatedOtherData,userId);
                return  {
                    token : tokenData.tokenid,
                    defaulttimezone : defaultTimezone
                };
            } else {
                return "server error.";
            }
        }
    } else {
        return "invalid user name or password unable to authenticate.";
    }
}

const webxVesselsAndUsers = async function(request){

    const token = request.body.token;
    const deviceId = request.body.deviceid;
    const todaysDate = Util.getNewDate();
    const formatedDate = dateFormat(todaysDate,'yyyy-mm-dd');
    const tokenValue = await WebexModel.getTokenData(token,formatedDate);

    if (tokenValue.length > 0) {
        const userId = tokenValue[0].userid;
        const otherData = await UserModel.getPreviousOtherData(userId);
        const convertedData = JSON.parse(otherData);
        if(deviceId !== convertedData.deviceid){
            return "invalid device id";
        }
        const shipList = tokenValue[0].shiplist;
        const userShipsData = JSON.parse(shipList);

        let final = [];
        const remoteInspectionUserList = await UserModel.getAllRemoteInspectionUsers();

        const filteredInspectionUserList = _.filter(remoteInspectionUserList,function (o){
            for (let x of o.shipname){
                if(userShipsData.includes(x)){
                    return x;
                }
            }
        });
        if (filteredInspectionUserList.length > 0) {
            let i;
            let userLength = filteredInspectionUserList.length;
            for (i = 0; i < userLength; i++) {
                let eachData = {};
                eachData.firstName = filteredInspectionUserList[i].firstname;
                eachData.lastName = filteredInspectionUserList[i].lastname;
                eachData.userName = filteredInspectionUserList[i].email;
                final.push(eachData);
            }
        }
        return final;
    } else {
        return "Invalid Token";
    }
}

const scheduleMeeting = async function(request){

    let userData = request.body;
    const userToken = userData.token;
    const deviceId = userData.deviceid;
    const todaysDate = Util.getNewDate();
    const formatedDate = dateFormat(todaysDate,'yyyy-mm-dd');
    const tokenValue = await WebexModel.getTokenData(userToken,formatedDate);

    let updatedEmailsList = [];
    let emailsList = userData.invitees;
    let emaillength = emailsList.length;
    for (let i = 0; i < emaillength; i++) {
        updatedEmailsList.push({
            "email" : emailsList[i]['username']
        })
    }
    userData.invitees = updatedEmailsList;

    if(tokenValue.length > 0) {
        const userId = tokenValue[0].userid;
        const otherData = await UserModel.getPreviousOtherData(userId);
        const convertedData = JSON.parse(otherData);
        if(deviceId !== convertedData.deviceid){
            return "invalid device id";
        }
        delete userData.token;
        const token = appSettingModal.getAppSettingsJsonData().token;
        const hostEmail = appSettingModal.getAppSettingsJsonData().hostEmail;
        userData.hostEmail = hostEmail;

        const data = await fetch("https://webexapis.com/v1/meetings",
            {
                method: "POST",
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData),
            })
            .then(res => res.json())
            .then(async (result) => {
                if( !!result.errors ){
                    let msg = "";
                    if(result.errors[0].description == "The request requires a valid access token set in the Authorization request header.") {
                        msg = "account meet token expired.";
                        return msg;
                    }
                    if(result.errors[0].description=="Parameter 'start' or 'end' is before current time.") {
                        msg = "start and end date is invalid.";
                        return msg;
                    }
                    if(msg == "") {
                        return "meeting not schedule"
                    }
                } else {
                    let emails = "";
                    userData.invitees.map((item)=>{
                        emails += item.email + ",";
                    });
                    emails = emails.slice(0, -1);
                    result.emails = emails;
                    result.subject = "Smartship Hub - Remote support  <" + result.title + ">";
                    result.toUser = emails;
                    result.fromUser = tokenValue[0].username;
                    result.mediainfo = "[]";
                    const res = await WebexModel.saveWebexMeeting(result);
                    if(res.id > 0){
                        const messageText = 'Hi there,<br><br>' +
                            result.hostDisplayName + ' is inviting you to a scheduled Smartship Hub - Remote support meeting<br><br>' +
                            'Topic: '+ result.title +' <br>'+
                            'Time: ' + result.start + ' (Singapore)<br><br>' +
                            'Join Meeting Link <br>' +
                            result.webLink + '<br><br>' +
                            'Thank you.<br><br>' +
                            'Regards,<br>' +
                            'Smart Ship Hub Support'
                        sendMail(result.emails,"",result.subject, messageText, 'jdkk');
                        return result.id;
                    } else {
                        return "meeting scheduled but error occured while inserting data in db";
                    }
                }
            });
        return data;
    } else {
        return "invalid token.";
    }
}

const uploadMeetingFile = async function(request){
    const mediaDescription = request.body.mediadescription;
    const token = request.body.token;
    const meetingId = request.body.meetingId;
    const deviceId = request.body.deviceid;

    if(!mediaDescription){
        return "media description not present.";
    }
    if(!token){
        return "token not present."
    }
    if(!deviceId){
        return "deviceid not present."
    }
    if(!request.file || !request.file.path) {
        return "File not uploaded.";
    }
    const todaysDate = Util.getNewDate();
    const formatedDate = dateFormat(todaysDate,'yyyy-mm-dd');
    const tokenValue = await WebexModel.getTokenData(token,formatedDate);
    let userName = "";
    if(tokenValue.length > 0) {
        const userId = tokenValue[0].userid;
        const otherData = await UserModel.getPreviousOtherData(userId);
        const convertedData = JSON.parse(otherData);
        if(deviceId !== convertedData.deviceid){
            return "invalid device id";
        }
        userName = tokenValue[0].username;
        const allMeetingData = await WebexModel.getAllSchedulesMeetings(userName);
        const currentMeetingData = _.filter(allMeetingData,function (item) {
            if(item.meetingid == meetingId){
                return item;
            }
        });
        // if(currentMeetingData[0].status == "cancelled") {
        //     await updateMeetingStatus(currentMeetingData[0].meetingid,"completed");
        // }
    } else {
        return "token not valid."
    }
    const savedFileName = request.file.path.replace("../../../upload/images/","");
    const fileName = request.file.originalname;
    const localpath = "http://localhost:10113/logo/"+savedFileName;
    const serverpath = "https://www.smartshipweb.com/be__orion/logo/"+savedFileName;
    let fileType = request.file.mimetype;
    if(fileType == "multipart/form-data") {
        fileType = "audio/mp3";
    }

    let dbObject = {
        userName : userName,
        mediaDescription : mediaDescription,
        mediaName : fileName,
        mediaPath : serverpath,
        mediatype : fileType
    }
    if(!meetingId || meetingId == "") {
        const result = await WebexModel.insertMediaInformationTable(dbObject);
        if (result > 0) {
            return result
        } else {
            return "server error."
        }
    } else {
        //meeting id present
        const result = await WebexModel.insertMediaInformationTable(dbObject);
        if(result > 0) {
            const getPreviousIdentifiersValue = await WebexModel.getPreviousIdentifierArray(meetingId);
            if(getPreviousIdentifiersValue.length > 0) {
                let previousArray = JSON.parse(getPreviousIdentifiersValue[0].mediainfo);

                const mediaData = {
                    mediaId : result.toString(),
                    mediaPath : serverpath,
                    mediaName : fileName,
                    mediatype : fileType,
                    mediaDescription : mediaDescription
                }

                previousArray.push(mediaData);
                const updatedIdentifierArray = JSON.stringify(previousArray);
                const updateStatus = await WebexModel.updateMediaIdentifier(meetingId,updatedIdentifierArray);
                if(updateStatus){
                    return result;
                } else {
                    return "server error."
                }
            } else {
                return "invalid meeting id."
            }
        } else {
            return "server error."
        }
    }
}

const getFirstLastName = async function(userName) {
    const allUserData = await UserModel.getAllUser();
    const filterObject = _.find(allUserData,function (item) {
        return userName == item.Email;
    });

    if(!filterObject) {
        let response = {
            firstName : "",
            lastName : "",
            userName : userName
        }
        return response;
    } else {
        let response = {
            firstName : filterObject.FirstName,
            lastName : filterObject.LastName,
            userName : userName
        }
        return response;
    }
}

const getAllMyMeetings = async function(request) {
    const token = request.body.token;
    const deviceId = request.body.deviceid;
    const status = request.body.status;
    let startDate = "";
    let endDate = "";

    if(!!request.body.startdate && !!request.body.enddate) {
        startDate = request.body.startdate;
        endDate = request.body.enddate;
    }
    if(!token || !deviceId || !status) {
        return "token ,deviceid ,status required."
    }

    const todaysDate = Util.getNewDate();
    const formatedDate = dateFormat(todaysDate,'yyyy-mm-dd');
    const tokenValue = await WebexModel.getTokenData(token,formatedDate);
    let userName = "";
    if(tokenValue.length > 0) {
        const userId = tokenValue[0].userid;
        const otherData = await UserModel.getPreviousOtherData(userId);
        const convertedData = JSON.parse(otherData);
        if(deviceId !== convertedData.deviceid){
            return "invalid device id";
        }
        userName = tokenValue[0].username;
    } else {
        return "token not valid."
    }

    let allMeetings = await WebexModel.getAllSchedulesMeetings(userName);
    if(!!startDate && !!endDate) {
        allMeetings = _.filter(allMeetings,function (item) {
            if(item.startdatetime >= startDate && item.startdatetime <= endDate) {
                return item;
            }
        });
    }
    if(status !== "all") {
        if(status.includes("|")){
            const statusArray = status.split("|");
            let formatedArray = [];
            for(let i = 0;i<statusArray.length;i++) {
                formatedArray.push(statusArray[i].trim());
            }
            allMeetings = _.filter(allMeetings, function (item) {
                if(formatedArray.indexOf(item.status) >= 0) {
                    return item;
                }
            });
        } else {
            allMeetings = _.filter(allMeetings, function (item) {
                if(item.status == status) {
                    return item;
                }
            });
        }
    }
    for(let i = 0; i < allMeetings.length; i++) {
        allMeetings[i].mediainfo = JSON.parse(allMeetings[i].mediainfo);

        const fromUser = allMeetings[i].fromuser;
        const toUser = allMeetings[i].touser.split(",");
        allMeetings[i].fromuser = await getFirstLastName(fromUser);
        let allToUser = [];
        for(let i = 0; i < toUser.length; i++) {
            const responseData = await getFirstLastName(toUser[i])
            allToUser.push(responseData);
        }
        allMeetings[i].touser = allToUser;
    }
    return allMeetings
}

const downloadMedia = async function(request, reply){
    // const mediaId = request.body.mediaId;
    // if(!mediaId) {
    //     return "invalid input."
    // }
    // const mediaData = await WebexModel.getMediaDataById(mediaId);
    // if(mediaData.length > 0) {
    //     console.log(mediaData);
    //     const mediaType = mediaData[0].mediatype;
    //     const mediaName = mediaData[0].medianame;
    //     const mediaPath = mediaData[0].mediapath.replace("../","");
    //     const file = directoryPath+mediaPath;
    //     let readStream = fs.createReadStream(file);
    //     let response = {
    //         streamData : readStream,
    //         mediaType : mediaType
    //     }
    //     return response;
    // } else {
    //     return "mediaid information not present.";
    // }
}

const updateMeeting = async function(request){
    let userData = request.body;
    const userToken = userData.token;
    const meetingId = request.body.meetingId;
    const deviceId = request.body.deviceid;
    const meetingStatus = request.body.status;
    if(!userToken || !meetingId || !deviceId || !meetingStatus) {
        return "meetingid, token, deviceid and status required."
    }
    const todaysdate = Util.getNewDate();
    const formatedDate = dateFormat(todaysdate,'yyyy-mm-dd');
    const tokenValue = await WebexModel.getTokenData(userToken,formatedDate);
    let updatedEmailsList = [];
    let emailsList = userData.invitees;
    let emaillength = emailsList.length;
    for (let i = 0; i < emaillength; i++) {
        updatedEmailsList.push({
            "email" : emailsList[i]['username']
        })
    }
    userData.invitees = updatedEmailsList;

    if(tokenValue.length > 0) {
        const userId = tokenValue[0].userid;
        const otherData = await UserModel.getPreviousOtherData(userId);
        const convertedData = JSON.parse(otherData);
        if(deviceId !== convertedData.deviceid){
            return "invalid device id";
        }
        delete userData.token;
        const token = appSettingModal.getAppSettingsJsonData().token;
        const hostEmail = appSettingModal.getAppSettingsJsonData().hostEmail;
        const hostPassword = appSettingModal.getAppSettingsJsonData().password;
        userData.hostEmail = hostEmail;
        userData.password = hostPassword;

        const data = await fetch("https://webexapis.com/v1/meetings/"+meetingId,
            {
                method: "PUT",
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData),
            })
            .then(res => res.json())
            .then(async (result) => {
                if( !!result.errors ){
                    let msg = "";
                    if(result.errors[0].description == "The request requires a valid access token set in the Authorization request header.") {
                        msg = "account meet token expired.";
                        return msg;
                    }
                    if(result.errors[0].description=="Parameter 'start' or 'end' is before current time.") {
                        msg = "start and end date is invalid.";
                        return msg;
                    }
                    if(msg == "") {
                        return "meeting not schedule"
                    }
                } else {
                    let emails = "";
                    userData.invitees.map((item)=>{
                        emails += item.email + ",";
                    });
                    emails = emails.slice(0, -1);
                    result.emails = emails;
                    result.subject = "Smartship Hub - Remote support  <" + result.title + ">";
                    result.toUser = emails;
                    result.fromUser = tokenValue[0].username;
                    result.meetingStatus = meetingStatus;
                    const res = await WebexModel.updateWebexMeeting(result);
                    if(res){
                        return result.id;
                    } else {
                        return "Server Error.";
                    }
                }
            });
        return data;
    } else {
        return "Invalid Token.";
    }
}

const getMediaArray = async function(request, reply){
    const meetinglink = request.query.meetinglink;
    const responseArray = [];
    if(!!meetinglink) {
        const response = await WebexModel.getMediaInfo(meetinglink);
        const dataArray = JSON.parse(response[0].mediainfo);
        for (let i = 0; i<dataArray.length; i++) {
            responseArray.push(dataArray[i].mediaPath);
        }
        return responseArray;
    }
}

module.exports = {
    saveWebexMeeting: saveWebexMeeting,
    getMeetings:getMeetings,
    updateMeetingStatus: updateMeetingStatus,
    webexUserAuthentication: webexUserAuthentication,
    webxVesselsAndUsers: webxVesselsAndUsers,
    scheduleMeeting: scheduleMeeting,
    updateMeeting: updateMeeting,
    uploadMeetingFile: uploadMeetingFile,
    getAllMyMeetings: getAllMyMeetings,
    downloadMedia: downloadMedia,
    getMediaArray: getMediaArray
};
