'use strict';

const DataAccessAdaptorSingleton = require("../adaptors/dataAccessAdaptorSingleton");
const {USER_MAPPING} = require("../utils/tables");

let allUserMappingJsonData = null;

exports.getAllUserMapping = async () => {
    if (allUserMappingJsonData == null) {
        allUserMappingJsonData = await exports.getAllUserMappingData();
    }
    return allUserMappingJsonData;
};

exports.getAllUserMappingData = async () => {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const query = `SELECT 
    defaultscreenmapping as "DefaultScreenMapping",
    screenMapping as "ScreenMapping",
    userid as "userId",
    id as "uId"
    
    FROM "${USER_MAPPING}"`;
    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);
    if (dbResponse) {

    } else {
        console.error("Error while fetching data from User table :: ");
    }
    return dbResponse.rows;

};

exports.getUserMappingById = async (userMappingId) => {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const selectQuery = `SELECT id,
    defaultscreenmapping as "DefaultScreenMapping",
    screenMapping as "ScreenMapping",
    userid as "userId",
    FROM "${USER_MAPPING}"
     where id  = ${userMappingId};`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(selectQuery, null);

    if (dbResponse) {
        console.log("Fetched UserMappings from UserMapping Table");
        return dbResponse.rows;
    } else {
        console.error("Error Occurred While fetching User from User Table");
        return null;
    }
};

exports.getUserMappingByUserId = async (userId) => {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const selectQuery = `SELECT
    defaultscreenmapping as "DefaultScreenMapping",
    screenMapping as "ScreenMapping"
    
    FROM "${USER_MAPPING}"
     where userid  = ${userId};`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(selectQuery, null);

    if (dbResponse) {
        dbResponse.rows[0].ScreenMapping = JSON.parse(dbResponse.rows[0].ScreenMapping);
        dbResponse.rows[0].DefaultScreenMapping = JSON.parse(dbResponse.rows[0].DefaultScreenMapping);
        console.log("Fetched UserMappings from UserMapping Table");
        return dbResponse.rows;
    } else {
        console.error("Error Occurred While fetching User from User Table");
        return null;
    }
};

exports.saveUserMapping = async function (userData) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const insertQuery = `INSERT INTO "${USER_MAPPING}" 
    (DefaultScreenMapping,ScreenMapping,userid)
    values($1,$2,$3) RETURNING id;`;


    const dbResponse = await DataAccessAdaptor.executeQueryAsync(insertQuery,
        [
            userData.DefaultScreenMapping,
            userData.ScreenMapping,
            userData.userId
        ]);

    if (dbResponse) {
        // console.log(dbResponse.rows[0]);
        console.log("user mapping data saved successfully...!!!");
        return dbResponse.rows[0];
    } else {
        console.error("Error while saving user mapping::");
        return null;
    }

};

exports.updateUserMappingById = async (UserMapping) => {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const userMappingId = UserMapping.id;

    delete UserMapping['id'];
    let queryBuilder = "";

    Object.entries(UserMapping).map((k, v) => {
        queryBuilder += k[0].toLowerCase() + " = '" + k[1] + "' , ";
    });

    queryBuilder = queryBuilder.substring(0, queryBuilder.length - 2);

    const updateQuery = `UPDATE "${USER_MAPPING}" SET ${queryBuilder} where id = ${userMappingId} RETURNING id;`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(updateQuery, null);

    if (dbResponse) {
        return dbResponse.rows[0];
    } else {
        console.error("Error Occurred While Updating UserMappingById from UserMapping Table");
        return {};
    }
};

exports.updateUserMappingByUserId = async (UserMapping, DefaultScreenMapping, userId) => {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const updateQuery = `UPDATE "${USER_MAPPING}" SET screenmapping = '${UserMapping}', defaultscreenmapping = '${DefaultScreenMapping}' where userid = ${userId} RETURNING id;`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(updateQuery, null);

    if (dbResponse) {
        return dbResponse.rows[0];
    } else {
        console.error("Error Occurred While Updating UserMappingById from UserMapping Table");
        return {};
    }
    };

exports.deleteUserMappingById = async function (userMappingId) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const deleteQuery = `DELETE from "${USER_MAPPING}" where id = ${userMappingId} RETURNING id;`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(deleteQuery, null);

    if (dbResponse) {
        console.log("Deleting User Mapping Data By ID from USER_MAPPING Table")
        return dbResponse.rows[0];
    } else {
        console.error("Error Occurred While Deleting User Mapping Data By ID from USER_MAPPING Table");
    }
};

exports.deleteUserMappingByUserId = async function (userId) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const deleteQuery = `DELETE from "${USER_MAPPING}" where userid = ${userId} RETURNING id;`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(deleteQuery, null);

    if (dbResponse) {
        console.log("Deleting User Mapping Data By ID from USER_MAPPING Table")
        return dbResponse.rows[0];
    } else {
        console.error("Error Occurred While Deleting User Mapping Data By ID from USER_MAPPING Table");
    }
};

exports.createTable = async function () {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `create table "${USER_MAPPING}"
    (
        id serial
        constraint ${USER_MAPPING}_pk
            primary key,
        ScreenMapping varchar,
        DefaultScreenMapping varchar,
        userid integer
    );`;

    await DataAccessAdaptor.executeQueryAsync(query, null)
        .then(resp => {
            if (resp)
                console.log("User Mapping Table Created")
            else
                console.error("Could Not Create User Mapping Table");
        })
};
