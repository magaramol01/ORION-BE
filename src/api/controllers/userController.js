'use strict';

/*
* CRUD CONTROLLER
* */
const AudiTrailModel = require("../models/auditTrailModel");
const UserModel = require("../models/userModel");
const CompanyRegistrationModel = require("../models/companyRegistrationModel");
const ShipModel = require("../models/shipModel");
const md5 = require('md5');
const {sendMail} = require("../adaptors/mailer");
const dateFormat = require('dateformat');
let {Util} = require("../utils/util");
const _ = require('lodash');

const create = async function (request) {
    const user = request.body;
    let response = {};
    if (!user)
        throw new Error('Cannot proceed empty user details!');

    const userdata = await UserModel.userExists(user.Email);
    if (userdata) {
        response = {
            userExists: true,
            msg: "User with the same email already exists",
        };
    } else {
        if (user.Role === "Ship Manager" || user.Role === "Smart Ship Super User") {
            const ShipArr =  ShipModel.getAllShipJsonData();
            user["ShipName"] = JSON.stringify(Object.values(ShipArr));
        }
        if (user.Role === "Company Admin" || user.Role === "Fleet Manager" || user.Role === "Ship User" || user.Role === "Smart Ship User") {
            user["ShipName"] = JSON.stringify(user.ShipName);
        }

        const allUserJsonData = await UserModel.getAllUserData();
        if (user.Role === "Smart Ship Super User") {
            user["registerUser"] = 0;
        } else {
            if (user.Role === "Company Admin") {
                user["registerUser"] = request.session.user.id;
            } else {
                if (request.session.user.Role === "Ship User" || request.session.user.Role === "Fleet Manager" || request.session.user.Role === "Ship Manager") {
                    const LogInUserInfo = _.filter(allUserJsonData,function (o) {return o.uId == request.session.user.id});
                    user["registerUser"] = LogInUserInfo[0]["registerUser"];
                } else {
                    user["registerUser"] = request.session.user.id;
                }
            }
        }
        const result = await UserModel.saveUser(user);

        if (result.id) {
            // const userKey = result.generated_keys[0];
            // allUserJsonData[userKey] = user;
            if(!Util)
                Util = require("../utils/util").Util;

            const auditTrailInfo = Util.getAuditTrailInfo("create", "User", "UserId => "+ result.id + ", " + result.email);
            AudiTrailModel.saveAuditTrail({
                userId: request.session.user ? request.session.user.id : null,
                ipAddress: request.ip,
                action: auditTrailInfo.actionMsg,
                description: auditTrailInfo.descMsg
            });

            response = {
                userExists: false,
                msg: "Registration Success!",
            };
        } else {
            response = {
                userExists: false,
                msg: "Something is wrong!",
            };
        }
    }
    return response;
};

const readById = async function (request) {
    const userId = request.query.id;
    let dbResponse =  await UserModel.getUserById(userId);
    const shipData = await ShipModel.getAllShipNames();

    dbResponse.map((responseData, i) => {
        let arr = [];
        dbResponse[i].ShipName.map((item1)=>{
            shipData.map((item2)=>{
                if(item1 === item2.id){
                    arr.push(item2.name)
                }
            })
        })
        dbResponse[i].ShipName = arr;
    });

    return dbResponse;
};


const readIsAllowToCreateShipById = async function (userId) {
    let dbResponse =  await UserModel.getUserById(userId);
    delete(dbResponse[0].Password)
    let companyLogo = 'smartShipSuperUser.png';
    return {
        "isvalid": true,
        "msg": "User Login Success",
        "Email": dbResponse[0].Email,
        "FirstName": dbResponse[0].FirstName,
        "MobileNumber": dbResponse[0].MobileNumber,
        "Role": dbResponse[0].Role,
        "id": dbResponse[0].id,
        "CreateRules": dbResponse[0].CreateRules,
        "CreateShips": dbResponse[0].CreateShips,
        "CompanyName": dbResponse[0].CompanyName,
        "CompanyLogo": companyLogo,
        "editRules": dbResponse[0].EditRules
    };
};

const readAll = async function () {
    return await UserModel.getAllUser();
};

const readAllUser = async function (request) {
    const user = request.session.user;
    const userId = user.id;
    const userRole = user.Role;

    let allUserData = await UserModel.getAllUserData();
    const shipData = await ShipModel.getAllShipNames();

    allUserData.map((responseData, i) => {
        let arr = [];
        allUserData[i].ShipName.map((item1)=>{
            shipData.map((item2)=>{
                if(item1 === item2.id){
                    arr.push(item2.name)
                }
            })
        })
        allUserData[i].ShipName = arr;
    });

    if (userRole === "Smart Ship Super User") {
        return allUserData;
    } else if (userRole === "Smart Ship User") {
        return _.filter(allUserData, function (o) {return o.CompanyName == "smartshiphub"});
    } else if (userRole === "Company Admin") {
        let filterUserData = {};
        const userCompanyName = user.CompanyName;
        const allUserDataKeys = Object.keys(allUserData);

        for (let i = 0; i < allUserDataKeys.length; i++) {
            let key = Number(allUserDataKeys[i]);
            const userInfo = allUserData[key];
            if (userCompanyName === userInfo["CompanyName"]) {
                const userid =  Number(userInfo.uId);
                filterUserData[userid] = Object.values(allUserData)[i];
            }
        }
        filterUserData[userId] =  _.find(allUserData,function (o){
            return o.uId == userId;
        });

        return filterUserData;
    } else {
        let user = [];
        allUserData.map((item) => {
            if (item.uId === userId) {
                user.push(item);
            }
        })
        return user;
    }
};

const removeById = async function (request) {
    let response = {};
    const userId = request.query.id;
    let result = await UserModel.deleteUserById(userId);
    if (result.id) {

        if(!Util)
            Util = require("../utils/util").Util;

        const auditTrailInfo = Util.getAuditTrailInfo("delete", "User", "UserId => "+ result.id + ", " + result.email + ", " + result.role);
        AudiTrailModel.saveAuditTrail({
            userId: request.session.user.id,
            ipAddress: request.ip,
            action: auditTrailInfo.actionMsg,
            description: auditTrailInfo.descMsg
        });

        response = {
            isSuccess: true,
            msg: "User Delete Successfully!!!"
        }
    } else {
        response = {
            isSuccess: false,
            msg: "Failed To Delete User"
        }
    }
    return response;
};

const removeAll = function (request) {
};

const validateUser = async function (request) {
    const user = request.body;

    if(!user)
        return {};

    let udata = {};
    if (!user.Email || !user.Password)
        throw new Error('Cannot proceed empty user details!');

    const checkEmail = await UserModel.userExists(user.Email);

    if (checkEmail) {
        console.log(user.Email, "===> Registered Email Id");
        const userdata = await UserModel.validateUser(user);

        if (userdata.length === 0) {
            console.log("Wrong password for ===>", user.Email);
            console.log("Wrong password ===>", user.Password);

            return  {"isvalid": false, "msg": "The username or password you entered is incorrect."};
        }

        const CompanyData = await CompanyRegistrationModel.getAllData();
        let companyLogo = 'smartShipSuperUser.png';

        if (userdata[0].role !== "Smart Ship Super User") {
            CompanyData.map(item => {
                if(item.companyRegisteredName === userdata[0].companyname)
                    companyLogo = item.companyLogo;
            });
        }

        udata = {
            "isvalid": true,
            "msg": "User Login Success",
            "Email": userdata[0].email,
            "FirstName": userdata[0].firstname,
            "MobileNumber": userdata[0].mobilenumber,
            "Role": userdata[0].role,
            "id": userdata[0].id,
            "CreateRules": userdata[0].createrules,
            "CreateShips": userdata[0].createships,
            "CompanyName": userdata[0].companyname,
            "CompanyLogo": companyLogo,
            "editRules": userdata[0].editrules
        };
    } else {
        console.log(user.Email, "===> Not a Registered Email Id");
        udata = {
            "login": false,
            "msg": "The username is not registered yet."
        };
    }

    return udata;
};

const getEmail = async function (request) {
    let emailDetails = request.body;
    const response = await UserModel.getEmail(emailDetails.Email);
    let reply = {};
    if(response){
        const toMail = emailDetails.Email;
        const subjectInfo = 'Password Reset Request';
        const messageText = 'Dear Subscriber,<br><br>' +
            'Please click on the below link to set your new password for [  <b>'+ emailDetails.Email +' </b>] : <br>' +
            '<a href ="' +emailDetails.linkLocation + '"> Reset Link </a>'+
            '<br><br>Thankyou,<br>Smart Ship Hub Support';

        sendMail(toMail, "bjadhav543@gmail.com", subjectInfo, messageText, "djh");

           reply = {
               status: true,
               msg: "Please check your email inbox and click on the link to reset your password"
           };
    }
    else{
        reply = {
            status : false,
            msg : "Not a registered user"
        };
    }
    return reply;
};

const updateUserPasswordByEmail  = async function (user) {
    if(!Util)
        Util = require("../utils/util").Util;

    const result = await UserModel.updateUserPasswordByEmail(user);
    const currentTimestamp = Util.getNewDate();
    const currentTimestampForMail = dateFormat(currentTimestamp, Util.getCommonDateFormatDD_MM_YYYY_HH_MM());
    if (result) {
        const toMail = user.email;
        const subjectInfo = 'Your Password has been changed';
        const messageText = 'Dear Subscriber,<br><br>' +
            'Your new Password [ <b>Email</b> : '+ user.email +'&nbsp;&nbsp; <b>Password</b> : ' + user.plainText + '] <br>has been successfully set at ' + currentTimestampForMail +' SGT<br><br>' +
            'Have a nice day.<br><br>' +
            'Thankyou,<br>Smart Ship Hub Support';

        sendMail(toMail, "bjadhav543@gmail.com", subjectInfo, messageText, "djh");
        return "User Password Updated Successfully";
    }
}

const addShipToSession = async function (request) {
    request.session.user['selectedShipName'] = request.body.shipName;
};

const addVesselDetailsToSession = function (request) {
    request.session.user['selectedShipName'] = request.body.shipName;
    request.session.user['selectedVesselId'] = request.body.vesselId;
};

const updateUserById = async function (request) {
    let updateUserData = request.body;
    if (updateUserData.ShipName) {
        updateUserData['ShipName'] = JSON.stringify(updateUserData['ShipName']);
    }

    const result = await UserModel.updateUserById(updateUserData);
    if (result.id) {
        const allUserJsonData = await UserModel.getAllUser();
        const userId = updateUserData.id;
        delete updateUserData.id;
        allUserJsonData[userId] = updateUserData;

        if(!Util)
            Util = require("../utils/util").Util;

        const auditTrailInfo = Util.getAuditTrailInfo("update", "User", "UserId => "+ result.id + ", " + result.email);
        AudiTrailModel.saveAuditTrail({
            userId: request.session.user.id,
            ipAddress: request.ip,
            action: auditTrailInfo.actionMsg,
            description: auditTrailInfo.descMsg
        });

        return "User Update Successfully";
    } else {
        return "User Not Update!!!";
    }
};

const updateUserShips = async function (userId, shipArr) {
    const result = await UserModel.updateUserShips(userId, shipArr);
    if (result) {
        return "User Ship Updated Successfully";
    } else {
        return "User Ship Not Updated!!!";
    }
};

const getAllShips = async function (request) {
    const userShipsData = await UserModel.getAllShips(request.session.user.id);
    let finaldata = [];
    if (userShipsData.length > 0) {
        const allShipsData = await ShipModel.getAllVesselsData();

        for (let i = 0; i < userShipsData.length; i++) {
            allShipsData.map((item) => {
                if (item.id === userShipsData[i]) {
                    let shipRecords = {
                        label: item.Name,
                        value: item.MappingName,
                        vesselId: item.id
                    };
                    finaldata.push(shipRecords);
                }
            })
        }
    }
    finaldata = _.sortBy(finaldata, [function (o) { return o.vesselId; }]);
    return finaldata;
};

const createDefaultUser = async function (request) {
    const DefaultData = {
        "FirstName": "Admin",
        "ShipName": ["no ship"],
        "LastName": "Admin",
        "MobileNumber": "8806435960",
        "Email": "admin@gmail.com",
        "Password": md5("Smart@321"),
        "Role": "Smart Ship Super User",
        "CreateShips": true,
        "CreateRules": true,
        "EditRules": true,
        "CompanyName": "smartshiphub",
        "ScreenMapping": '["All"]',
        "DefaultScreenMapping": '["Dashboard"]'
    }
    request.body = DefaultData;
    const Response = await create(request);
    return Response;
};

const getUserByShipId = async function (request) {
    const shipId = request.query.shipId;
    let dbResponse =  await UserModel.getUserByShipId(shipId);
    return dbResponse;
};

module.exports = {
    create: create,
    readById: readById,
    readAll: readAll,
    readAllUser: readAllUser,
    removeById: removeById,
    removeAll: removeAll,
    getEmail: getEmail,
    validateUser: validateUser,
    addShipToSession: addShipToSession,
    addVesselDetailsToSession: addVesselDetailsToSession,
    updateUserById: updateUserById,
    updateUserShips: updateUserShips,
    getAllShips: getAllShips,
    updateUserPasswordByEmail: updateUserPasswordByEmail,
    readIsAllowToCreateShipById: readIsAllowToCreateShipById,
    createDefaultUser: createDefaultUser,
    getUserByShipId:getUserByShipId
};