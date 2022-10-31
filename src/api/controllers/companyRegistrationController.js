'use strict';

/*
* CRUD CONTROLLER
* */
const CompanyRegistrationModel = require("../models/companyRegistrationModel");
const UserModel = require("../models/userModel");
const {Util} = require("../utils/util");
const AudiTrailModel = require("../models/auditTrailModel");
const _ = require('lodash');


const insert = async function (request) {
    let companyEntry = {};
    companyEntry = request.body;
    companyEntry['userId'] = request.session.user.id;
    const dbResponse =  await CompanyRegistrationModel.insert(companyEntry);
    if(dbResponse){
        const auditTrailInfo = Util.getAuditTrailInfo("create", "Company", companyEntry.companyRegisteredName);
        AudiTrailModel.saveAuditTrail({
            userId: request.session.user.id,
            ipAddress: request.ip,
            action: auditTrailInfo.actionMsg,
            description: auditTrailInfo.descMsg
        });
    }
    return dbResponse;
};

const readAll = async function (request) {
    const CompanyJsonData = await CompanyRegistrationModel.getAllCompanyEntry();
    let CompanyJsonDataCopy = _.cloneDeep(CompanyJsonData);
    return Util.processAllData(request, CompanyJsonDataCopy);
};

const removeByEmail = async function (request) {
    const CompanyID = request.body;
    let response = {};
    if (!CompanyID)
        throw new Error('Cannot proceed empty Company ID!');

    const CompanyData = await CompanyRegistrationModel.deleteCompanyEntry(CompanyID);

    if (CompanyData) {
        response = {
            isSuccess: true,
            msg: "The Data Company Data is Successfully Deleted"
        }
        const auditTrailInfo = Util.getAuditTrailInfo("delete", "Company", CompanyID.companyEmail);
        AudiTrailModel.saveAuditTrail({
            userId: request.session.user.id,
            ipAddress: request.ip,
            action: auditTrailInfo.actionMsg,
            description: auditTrailInfo.descMsg
        });

        console.log("Deleting Company Data");
    } else {
        response = {
            isSuccess: false,
            msg: "The Data You Are Trying To Get, Does Not Exist"
        }
        console.log("Can not Delete Company Data");
    }
    return response;
};

const updateById = async function (request) {
    const Company = request.body;
    let response = {};
    let oldCompanyRegisteredName;
    if (!Company)
        throw new Error('Cannot proceed empty Company ID!');

    Company['userId'] = request.session.user.id;

    if (Company.oldCompanyRegisteredName)
        oldCompanyRegisteredName = Company.oldCompanyRegisteredName;

    delete Company["oldCompanyRegisteredName"];
    const CompanyData = await CompanyRegistrationModel.updateCompanyDataById(Company);

    if (CompanyData) {
        response = response = {
            isSuccess: true,
            msg: "The Company Data is Successfully Updated"
        }
        const auditTrailInfo = Util.getAuditTrailInfo("update", "Company", "Company with id "+companyId+" Updated");
        AudiTrailModel.saveAuditTrail({
            userId: request.session.user.id,
            ipAddress: request.ip,
            action: auditTrailInfo.actionMsg,
            description: auditTrailInfo.descMsg
        });

        await UserModel.updateCompanyOfUsers(oldCompanyRegisteredName, Company.companyRegisteredName);
    } else {
        response = {
            isSuccess: false,
            msg: "Unable to Delete Company Data By ID"
        }
        console.log("Unable to Delete Company Data By ID");
    }
    return response;
};

const getAllData = async function (request) {
    let response = {};
    const CompanyData = await CompanyRegistrationModel.getAllData();
    let CompanyDataCopy = _.cloneDeep(CompanyData);
    //CompanyDataCopy = Util.sortedShipBasedOnUser(CompanyData,request.session.user.id);
    if (CompanyData.length > 0) {
        response = CompanyDataCopy;
        console.log("Fetching All Company Data");
    } else {
        response = {
            isSuccess: false,
            msg: "There are no Company Records available"
        }
        console.log("Could not Fetch Company Data");
    }

    return response;
};

const getDataByID = async function (request) {
    let response = {};
    const CompanyData = await CompanyRegistrationModel.getDataByID(request.body.id);
    if (CompanyData.length > 0) {
        response = CompanyData;
        console.log("Fetching All Company Data");
    } else {
        response = {
            isSuccess: false,
            msg: "There are no Company Records available"
        }
        console.log("Could not Fetch Company Data");
    }

    return response;
};


module.exports = {
    insert: insert,
    readAll: readAll,
    removeByEmail: removeByEmail,
    updateById: updateById,
    getAllData: getAllData,
    getDataByID: getDataByID,
};