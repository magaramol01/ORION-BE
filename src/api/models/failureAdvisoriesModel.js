'use strict';

require('log-timestamp');

const DataAccessAdaptorSingleton = require("../adaptors/dataAccessAdaptorSingleton");
const {FAILURE_ADVISORIES, FAILURE_ADVISORIES_REFERENCES_CAUSES, USER, SHIP}  = require("../utils/tables");

let failureAdvisoriesJsonData = null;
let failureAdvisoriesReferencesCausesJsonData = null;

exports.loadFailureAdvisoriesJsonDataInMemory = async function () {
    if (failureAdvisoriesJsonData == null) {
        failureAdvisoriesJsonData = await exports.getAllFailureAdvisories();
    }
};

exports.getFailureAdvisoriesJsonData = function () {
    return failureAdvisoriesJsonData;
};

exports.syncFailureAdvisoriesJsonData = async function () {
    failureAdvisoriesJsonData = null;
    await exports.loadFailureAdvisoriesJsonDataInMemory();
};

exports.loadFailureAdvisoriesReferencesCausesJsonDataInMemory = async function () {
    if (failureAdvisoriesReferencesCausesJsonData === null) {
        failureAdvisoriesReferencesCausesJsonData = await exports.getAllFailureAdvisoriesReferencesCauses();
    }
};

exports.getFailureAdvisoriesReferencesCausesJsonData = function () {
    return failureAdvisoriesReferencesCausesJsonData;
};

exports.getFailureAdvisoryReferenceCauseByKey = function (failureAdvisoryKey) {
    return failureAdvisoriesReferencesCausesJsonData[failureAdvisoryKey];
};

exports.syncFailureAdvisoriesReferencesCausesJsonData = function () {
    failureAdvisoriesReferencesCausesJsonData = null;
    failureAdvisoriesReferencesCausesJsonData = exports.getAllFailureAdvisoriesReferencesCauses();
};

exports.getFailureAdvisoriesDescriptionsByKey = (failureAdvisoriesArray) => {
    let failureAdvisoriesDescriptionArray = [];

    failureAdvisoriesArray.forEach(function (failureAdvisoryKey) {
        failureAdvisoriesDescriptionArray.push(failureAdvisoriesJsonData[failureAdvisoryKey]);
    });

    return failureAdvisoriesDescriptionArray;
};

exports.getAllFailureAdvisories = async function () {
    let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const selectQuery = `SELECT id, name as "name", companyname as "companyName", description as "description", isalarm as "isAlarm",
    isfailureadvisory as "isFailureAdvisory", userid as "userId", vesselid as "vesselId"  from ${FAILURE_ADVISORIES};`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(selectQuery, null);

    if (dbResponse) {
        console.log("Fetched All FailureAdvisory Data from FailureAdvisory Table");
        let failureAdvisoriesJson = {};
        for (let i =0 ; i< dbResponse.rows.length ; i++) {
            let records = dbResponse.rows[i];
            let key = records["id"];
            // delete records["id"];
            failureAdvisoriesJson[key] = records;
        }
        return failureAdvisoriesJson;
    } else {
        console.error("Error Occurred While fetching data from FailureAdvisory Table");
        return {};
    }
};

exports.createFailureAdvisory = async function (failureAdvisoriesData) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const insertQuery = `INSERT INTO ${FAILURE_ADVISORIES}
    (companyname, description, isalarm, isfailureadvisory, name, userid, vesselid)
      VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id;`;

    const values = [
        failureAdvisoriesData.companyName, failureAdvisoriesData.description, failureAdvisoriesData.isAlarm , failureAdvisoriesData.isFailureAdvisory,failureAdvisoriesData.name , failureAdvisoriesData.userId ,failureAdvisoriesData.vesselId
    ];

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(insertQuery, values);

    if (dbResponse) {
        console.log("Failure Advisory Inserted In failureAdvisory Table");
        return dbResponse.rows[0];
    } else {
        console.error("Error Occurred While Inserting failureAdvisory Record In failureAdvisory Table");
    }
};

exports.updateFailureAdvisoryById = async function (updatedFailureAdvisoryData) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const shipId = Object.keys(updatedFailureAdvisoryData)[0];

    delete updatedFailureAdvisoryData[shipId]["vesselName"];

    let queryBuilder = "";

    Object.entries(updatedFailureAdvisoryData[shipId]).map((k, v) => {
        queryBuilder += k[0].toLowerCase() + " = '" + k[1] + "' , ";
    });

    queryBuilder = queryBuilder.substring(0, queryBuilder.length - 2);

    const updateQuery = `UPDATE "${FAILURE_ADVISORIES}" SET ${queryBuilder} where id = ${shipId};`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(updateQuery, null);

    if (dbResponse) {
        return dbResponse.rowCount === 1 ? true : false;
    } else {
        console.error("Error Occurred While Updating FailureAdvisory ById from FailureAdvisory Table");
        return false;
    }
};

exports.removeAdvisoriesReferencesCausesById = async function (outcomeId) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const deleteQuery = `DELETE from ${FAILURE_ADVISORIES_REFERENCES_CAUSES} where id = ${outcomeId};`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(deleteQuery, null);

    if (dbResponse) {
        console.log("Deleting AdvisoriesReferencesCauses Data By ID from removeAdvisoriesReferencesCauses Table")
        return dbResponse.rowCount === 1 ? true : false;
    } else {
        console.error("Error Occurred While Deleting AdvisoriesReferencesCauses Data By ID from removeAdvisoriesReferencesCauses Table");
        return false;
    }
};

exports.deleteFailureAdvisoryById = async function (advisoryId) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const deleteQuery = `DELETE from ${FAILURE_ADVISORIES} where id = ${advisoryId};`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(deleteQuery, null);

    if (dbResponse) {
        console.log("Deleting FailureAdvisory Data By ID from FailureAdvisory Table")
        return dbResponse.rowCount === 1 ? true : false;
    } else {
        console.error("Error Occurred While Deleting FailureAdvisory Data By ID from FailureAdvisory Table");
        return false;
    }
};

exports.createTable = async function () {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `create table ${FAILURE_ADVISORIES}
    (
        id serial
        constraint ${FAILURE_ADVISORIES}_pk
            primary key,
        companyName varchar,
        description varchar,
        isAlarm boolean,
        isFailureAdvisory boolean,
        name varchar,
        userId integer
        constraint ${FAILURE_ADVISORIES}_${USER}_id_fk
            references "${USER}",
        vesselId integer
        constraint ${FAILURE_ADVISORIES}_${SHIP}_id_fk
            references ${SHIP}
    );`;

    await DataAccessAdaptor.executeQueryAsync(query, null)
        .then(resp => {
            if (resp)
                console.log("FailureAdvisories Table Created")
            else
                console.error("Could Not Create FailureAdvisories Table");
        })
};

exports.insertData = async function (dataAccessAdaptor) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    // const DataAccessAdaptor = dataAccessAdaptor;
    const reThinkDb = DataAccessAdaptor.getDBReference();

    await new Promise((resolve, reject) => {
        const failureAdvisoriesData = {
            "name": "Bearing wear and failure",
            "description": "Bearing wear and failure could be monitored/predicted using lube oil analysis along with the temperature sensor and vibration sensor readings if fitted.",
            "isFailureAdvisory": true,
            "isAlarm": false
        };
        reThinkDb.table("failureAdvisories")
            .insert(failureAdvisoriesData)
            .run(DataAccessAdaptor.connection, function (err, response) {
                console.log('Data Inserted Successfully', response);
            });
    });
};

exports.createFailureAdvisoryReferencesCauses = async function (failureAdvisoryReferencesCausesData) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const insertQuery = `INSERT INTO ${FAILURE_ADVISORIES_REFERENCES_CAUSES}(companyname, ref, userid, vesselid)
    VALUES($1, $2, $3, $4) RETURNING id;`;

    const values = [failureAdvisoryReferencesCausesData.companyName,
        failureAdvisoryReferencesCausesData.ref,
        failureAdvisoryReferencesCausesData.userId,
        failureAdvisoryReferencesCausesData.vesselId]

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(insertQuery, values);

    if (dbResponse) {
        console.log("Inserted Records in FailureAdvisoriesReferencesCauses Table")
        return dbResponse.rows[0];
    } else {
        console.error("Error Occurred While inserting Records in FailureAdvisoriesReferencesCauses Table");
        return false;
    }
};

exports.updateFailureAdvisoryReferencesCauses = async function (id,failureAdvisoryReferencesCausesData) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const updateQuery = `UPDATE ${FAILURE_ADVISORIES_REFERENCES_CAUSES} SET ref = $1 where id = $2;`;

    const values = [failureAdvisoryReferencesCausesData.ref, id]

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(updateQuery, values);

    if (dbResponse) {
        console.log("Updated FailureAdvisoriesReferenceCause from FailureAdvisoriesReferenceCause Table")
        return dbResponse.rowCount === 1 ? true : false;
    } else {
        console.error("Error Occurred While Updating FailureAdvisoriesReferenceCauseId from FailureAdvisoriesReferenceCause Table");
        return false;
    }
};
async function getAttchedUsersToNotify(DataAccessAdaptor,records){
    const userIds="("+(records["sendEmail"].users).toString()+")";
    const selectQueryUser = `SELECT id, concat(firstname,' ',lastname) as userName, email  from "${USER}" where id IN ${userIds};`;
    const dbResponseUser = await DataAccessAdaptor.executeQueryAsync(selectQueryUser, null);
    if (dbResponseUser) {
        if(dbResponseUser.rows.length){
            return dbResponseUser.rows;
        }else{
            //no users attached
            return [];
        }
    }else{
        //no users attached
        return [];
    }
}
exports.getAllFailureAdvisoriesReferencesCauses = async function () {
    let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const selectQuery = `SELECT id, companyname as "companyName", userid as "userId", ref as "ref",vesselid as "vesselId",sendemail as "sendEmail"  from ${FAILURE_ADVISORIES_REFERENCES_CAUSES};`;
    const dbResponse = await DataAccessAdaptor.executeQueryAsync(selectQuery, null);

    if (dbResponse) {
        console.log("Fetched All FailureAdvisoryReferenceCauses Data from FailureAdvisoryReferenceCauses Table");
        let failureAdvisoriesReferenceCausesJson = {};
        for (let i =0 ; i< dbResponse.rows.length ; i++) {
            let records = dbResponse.rows[i];
            let key = records["id"];
            let failureAdvisoryReferenCauses = JSON.parse(records["ref"]);
            failureAdvisoryReferenCauses["companyName"] = records["companyName"];
            failureAdvisoryReferenCauses["userId"] = records["userId"];
            failureAdvisoryReferenCauses["vesselId"] = records["vesselId"];
            failureAdvisoryReferenCauses["sendEmail"] = records["sendEmail"];
            if(records["sendEmail"].send){
                if(records["sendEmail"].users.length)
                {
                    let userList=await getAttchedUsersToNotify(DataAccessAdaptor,records);
                    records["sendEmail"]['userList']=userList;
                }else{
                    //no users attached
                    records["sendEmail"]['userList']=[];
                }
            }else{
                //no users attached
                records["sendEmail"]['userList']=[];
            }
            failureAdvisoriesReferenceCausesJson[key] = failureAdvisoryReferenCauses;
        }
        return failureAdvisoriesReferenceCausesJson;
    } else {
        console.error("Error Occurred While fetching data from FailureAdvisory Table");
        return {};
    }
};
// exports.getAllFailureAdvisoriesReferencesCauses = async function () {
//     let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
//     const selectQuery = `SELECT id, companyname as "companyName", userid as "userId", ref as "ref",vesselid as "vesselId",sendemail as "sendEmail"  from ${FAILURE_ADVISORIES_REFERENCES_CAUSES};`;
//     const dbResponse = await DataAccessAdaptor.executeQueryAsync(selectQuery, null);
    
//     if (dbResponse) {
//         console.log("Fetched All FailureAdvisoryReferenceCauses Data from FailureAdvisoryReferenceCauses Table");
//         let failureAdvisoriesReferenceCausesJson = {};
//         for (let i =0 ; i< dbResponse.rows.length ; i++) {
//             let records = dbResponse.rows[i];
//             let key = records["id"];
//             let failureAdvisoryReferenCauses = JSON.parse(records["ref"]);
//             failureAdvisoryReferenCauses["companyName"] = records["companyName"];
//             failureAdvisoryReferenCauses["userId"] = records["userId"];
//             failureAdvisoryReferenCauses["vesselId"] = records["vesselId"];
//             failureAdvisoryReferenCauses["sendEmail"] = records["sendEmail"];
//             failureAdvisoriesReferenceCausesJson[key] = failureAdvisoryReferenCauses;
//         }
//         return failureAdvisoriesReferenceCausesJson;
//     } else {
//         console.error("Error Occurred While fetching data from FailureAdvisory Table");
//         return {};
//     }
// };

exports.createFailureAdvisoriesReferencesCausesTable = async function (dataAccessAdaptor) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `create table ${FAILURE_ADVISORIES_REFERENCES_CAUSES}
    (
        id serial
        constraint ${FAILURE_ADVISORIES_REFERENCES_CAUSES}_pk
            primary key,
        companyName varchar,
        ref varchar,
        userId integer
        constraint ${FAILURE_ADVISORIES_REFERENCES_CAUSES}_user_id_fk
            references "${USER}",
        vesselId integer
        constraint ${FAILURE_ADVISORIES_REFERENCES_CAUSES}_ship_id_fk
            references ${SHIP}
    );`;

    await DataAccessAdaptor.executeQueryAsync(query, null)
        .then(resp => {
            if (resp)
                console.log("FailureAdvisoriesReferencesCauses Table Created")
            else
                console.error("Could Not Create FailureAdvisoriesReferencesCauses Table");
        })
};

exports.setResetEmailForFailureAdvisoriesRefCause = async function (inputData) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    let queryString = `update ${FAILURE_ADVISORIES_REFERENCES_CAUSES} as t set sendEmail = c.sendEmail from (values`;
    let reduceQuery = inputData.forEach((item, index) => {
        if (index == (inputData.length - 1)) //if last
        {
            queryString += `('${JSON.stringify(item.sendEmail)}'::json, ${item.configId})`;
        } else {
            queryString += `('${JSON.stringify(item.sendEmail)}'::json, ${item.configId}),`;
        }
    });
    queryString += `) as c(sendEmail, id) where c.id = t.id;`
    const dbResponse = await DataAccessAdaptor.executeQueryAsync(queryString, null);
    if (dbResponse) {
        console.log("Update set auto email for advisory and cause success")
        failureAdvisoriesReferencesCausesJsonData = null;//reset values in memory
        if (failureAdvisoriesReferencesCausesJsonData === null) {//set updated values in memory
            failureAdvisoriesReferencesCausesJsonData = await exports.getAllFailureAdvisoriesReferencesCauses();
        }
        return dbResponse.rowCount >1 ? true : false;
    } else {
        console.error("Update set auto email for advisory and cause failed")
        return false;
    }
};

exports.fetchUsersEmailIdForAdvisoryNotification = async function (uids) {
    let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const selectQuery = `select email from "${USER}" where id in(${uids});`;
    const dbResponse = await DataAccessAdaptor.executeQueryAsync(selectQuery, null);
    
    if (dbResponse) {
        console.log("Fetched Users EmailId For Advisory Notification ");
        return {status:'success',message:"Fetched Users EmailId For Advisory Notification",data:dbResponse.rows};
    } else {
        console.error("Error Occurred While fetching Users EmailId For Advisory Notification");
        return {status:'failed',message:"Error Occurred While fetching Users EmailId For Advisory Notification"};
    }
};