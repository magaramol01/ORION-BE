'use strict';
const {Util} = require('../utils/util');
const DataAccessAdapterSingleton = require("../adaptors/dataAccessAdaptorSingleton");
const DataAccessAdaptorSingleton = require("../adaptors/dataAccessAdaptorSingleton");
const {COMPANY_REGISTRATION, USER} = require("../utils/tables");

exports.createTable = async function () {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `create table ${COMPANY_REGISTRATION}
    (
        id serial
            constraint ${COMPANY_REGISTRATION}_pk
                primary key,
        companyAddress varchar,
        companyEmail varchar(320),
        companyHQCountry varchar(150),
        companyLogo varchar,
        companyOfficialAbbreviation varchar,
        companyRegisteredName varchar,
        companyTelephone varchar(100),
        companyType varchar,
        companyWebsite varchar,
        userId integer
            constraint ${COMPANY_REGISTRATION}_${USER}_id_fk
                references "${USER}"
    );`;

    await DataAccessAdaptor.executeQueryAsync(query, null)
        .then(resp => {
            if (resp)
                console.log("CompanyRegistration Table Created")
            else
                console.error("Could Not Create CompanyRegistration Table");
        })
};

exports.insert = async function (companyData) {
    const DataAccessAdaptor = DataAccessAdapterSingleton.getInstance();
    let rowCount;
    const insertQuery = `INSERT INTO "${COMPANY_REGISTRATION}" 
    (companyaddress,companyemail,companyhqcountry,companylogo,companyofficialabbreviation,companyregisteredname,companytelephone,companytype,companywebsite,userid)
    values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(insertQuery,
        [
            companyData.companyAddress,
            companyData.companyEmail,
            companyData.companyHQCountry,
            companyData.companyLogo,
            companyData.companyOfficialAbbreviation,
            companyData.companyRegisteredName,
            companyData.companyTelephone,
            companyData.companyType,
            companyData.companyWebsite,
            companyData.userId
        ]);

    if (dbResponse) {
        rowCount = dbResponse.rowCount >= 1;
    } else {
        console.error("Error while saving company data::");
    }
    return rowCount;
};

exports.deleteCompanyEntry = async (companyEmail) => {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const deleteQuery = `DELETE from ${COMPANY_REGISTRATION} where companyemail = '${companyEmail.companyEmail}';`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(deleteQuery, null);

    if (dbResponse) {
        console.log("Deleting company Data By Email from Company Table")
        return dbResponse.rowCount === 1 ? true : false;
    } else {
        console.error("Error Occurred While Deleting company Data By email from Company Table");
        return false;
    }
};

exports.getDataByID = async function (companyID) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const selectQuery = `SELECT id,
    companyregisteredname as "companyRegisteredName", 
    companyofficialabbreviation as "companyOfficialAbbreviation",
    companyhqcountry as "companyHQCountry",
    companywebsite as "companyWebsite",
    companytype as "companyType",
    companyaddress as "companyAddress",
    companytelephone as "companyTelephone",
    companyemail as "companyEmail",
    companylogo as "companyLogo" FROM ${COMPANY_REGISTRATION}
     where id  = ${companyID};`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(selectQuery, null);

    if (dbResponse) {
        return dbResponse.rows;
    } else {
        console.error("Error Occurred While fetching Company Email from Company Table");
        return null;
    }
};

exports.getAllData = async function () {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    let responseData = [];
    const query = `SELECT id,companyregisteredname as "companyRegisteredName", 
    companyofficialabbreviation as "companyOfficialAbbreviation",
    companyhqcountry as "companyHQCountry",
    companywebsite as "companyWebsite",
    companytype as "companyType",
    companyaddress as "companyAddress",
    companytelephone as "companyTelephone",
    companyemail as "companyEmail",
    companylogo as "companyLogo" FROM ${COMPANY_REGISTRATION}`;
    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);
    if (dbResponse) {
        responseData = dbResponse.rows;
        responseData = dbResponse.rows;
    } else {
        console.error("Error while fetching data from company registration table :: ");
    }
    return responseData;
};

exports.updateCompanyDataById = async (Company) => {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const companyId = Company.id;

    delete Company['id'];
    delete Company['uId'];

    let queryBuilder = "";

    Object.entries(Company).map((k, v) => {
        queryBuilder += k[0].toLowerCase() + " = '" + k[1] + "' , ";
    });

    queryBuilder = queryBuilder.substring(0, queryBuilder.length - 2);

    const updateQuery = `UPDATE ${COMPANY_REGISTRATION} SET ${queryBuilder} where id = ${companyId};`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(updateQuery, null);

    if (dbResponse) {
        console.log("Updated CompanyById from company Table")
        return dbResponse.rowCount === 1 ? true : false;
    } else {
        console.error("Error Occurred While Updating CompanyById from Company Table");
        return false;
    }
};
