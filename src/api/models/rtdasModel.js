'use strict';

require('log-timestamp');
const appSettings = require('../../config/appSettings');

const rtdasRegistrationJsonFilePath = appSettings.jsonFilesPath + 'RTDAS_Registration.json';
const DataAccessAdaptorSingleton = require("../adaptors/dataAccessAdaptorSingleton");
const {RTDAS_REGISTRATION, USER, SHIP}  = require("../utils/tables");

let rtdasRegistrationJsonData = null;

exports.loadRTDASRegistrationJsonDataInMemory = async function () {
    if (rtdasRegistrationJsonData === null){
        rtdasRegistrationJsonData = await exports.getAllrtdas();
    }
};

exports.getRTDASRegistrationJsonData = function () {
    return rtdasRegistrationJsonData;
};

exports.syncRTDASRegistrationJsonData = async function () {
    rtdasRegistrationJsonData = null;
    rtdasRegistrationJsonData = await exports.getAllrtdas();
};

exports.getAllrtdas = async function () {
    let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    let RTDASRegistrationJson = {};
    let RTDASRegistrations = [];
    try {
        RTDASRegistrations = await new Promise((resolve, reject) => {
            DataAccessAdaptor.reThinkDb.table('rtdasRegistration').run(DataAccessAdaptor.connection, function (err, cursor) {
                const causesArr = cursor.toArray(function (err, result) {
                    if (err) throw err;
                    // console.log(JSON.stringify(result, null, 2));
                });
                resolve(causesArr);
            });
        });
        RTDASRegistrations.forEach(RTDASRegistration => {
            const id = RTDASRegistration.id;
            const type = RTDASRegistration.type;
            const obj = JSON.parse(RTDASRegistration.objectvalue);
            let temp = {};
            if(type === "DB"){
                temp ={
                    type : type,
                    dbObject : obj
                }
            }
            if(type === "FILE"){
                temp = {
                    type : "JSON",
                    jsonObject : {
                        type : type,
                        fileObject : obj
                    }
                };
            }
            if(type === "STREAM"){
                temp = {
                    type : "JSON",
                    jsonObject : {
                        type : type,
                        streamObject : obj
                    }
                };
            }
            temp['userId']=RTDASRegistration.userId;
            temp['ShipName']=RTDASRegistration.ShipName;
            RTDASRegistrationJson[id] = temp;
        });

        return RTDASRegistrationJson;
    } catch (e) {
        console.log(e)
    }
};

exports.getRTDASRegistrationJsonDataFilePath = function () {
    return rtdasRegistrationJsonFilePath;
};

exports.getRTDASRegistrationDescriptionByKey = (RTDASRegId) => {
    return rtdasRegistrationJsonData[RTDASRegId];
};

exports.createTable = async function () {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `create table ${RTDAS_REGISTRATION}
    (
        id varchar
        constraint ${RTDAS_REGISTRATION}_pk
            primary key,
        objectValue jsonb,
        type varchar,
        userId integer
        constraint ${RTDAS_REGISTRATION}_${USER}_id_fk
            references "${USER}",
        vesselId integer
        constraint ${RTDAS_REGISTRATION}_${SHIP}_id_fk
            references ${SHIP}
    );`;

    await DataAccessAdaptor.executeQueryAsync(query, null)
        .then(resp => {
            if (resp)
                console.log("RTDASRegistration Table Created")
            else
                console.error("Could Not Create RTDASRegistration Table");
        })
};

exports.insertRtdasData = async (id,type,objectvalue,userId,ShipName)=>{
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const reThinkDb = DataAccessAdaptor.getDBReference();
    const dbResponse = await new Promise((resolve, reject) => {
        reThinkDb.table("rtdasRegistration")
            .insert({id,type,objectvalue,userId,ShipName})
            .run(DataAccessAdaptor.connection, function (err, response) {
                console.log('Data Inserted Successfully', response);
                resolve(response);
            });
    });

    return dbResponse;
};

exports.updateRtdasData = async (id,type,objectvalue,userId,ShipName)=>{
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const reThinkDb = DataAccessAdaptor.getDBReference();

    const dbResponse = await new Promise((resolve, reject) => {
        reThinkDb.table("rtdasRegistration").filter({id: id}).update({type:type,objectvalue:objectvalue,userId:userId,ShipName:ShipName})
            .run(DataAccessAdaptor.connection, function (err, response) {
                console.log('Data Updated Successfully', response);
                resolve(response);
            });
    });

    return dbResponse;
};