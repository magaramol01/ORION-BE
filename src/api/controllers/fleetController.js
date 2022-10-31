'use strict';
const AudiTrailModel = require("../models/auditTrailModel");
const fleetModel = require("../models/fleetModel");
const {Util} = require("../utils/util");
const userModel = require("../models/userModel");
const shipModel = require("../models/shipModel");
const _ = require('lodash');

const create = async function (request) {

    const fleetData = request.body;
    let response = {};

    if (!fleetData)
        throw new Error('Cannot store empty units!');

    let VesselJsonData = await fleetModel.getJsonData();

    for(let item of Object.values(VesselJsonData)){
        if(item.name === fleetData.fleetname){
            return {
                status: false,
                id: 0
            }
        }
    }
    //
    const result = await fleetModel.createFleet(fleetData);
    //
    if (result.id)
    {
        const unitKey = result.id;

        //unitsJsonData[unitKey] = unitsData;


        // const auditTrailInfo = Util.getAuditTrailInfo("create", "Vessel Group", vesselData.groupname);
        // AudiTrailModel.saveAuditTrail({
        //     userId: request.session.user.id,
        //     ipAddress: request.ip,
        //     action: auditTrailInfo.actionMsg,
        //     description: auditTrailInfo.descMsg
        // });
        response = {
            status: true,
            id: unitKey
        }
    } else {
        response = {
            status: false,
            id: -1
        }
    }
    return response;


};

const readAll = async function () {
    return await fleetModel.getAllFleetData();
};


// const removeById = async function (request) {
//     let Id = request.query.id;
//
//     if(Id){
//         const result= await fleetModel.removeUnitById(Id);
//         if(result > 0){
//             //const unitsJsonData = await vesselGroupModel.getJsonData();
//             const auditTrailInfo = Util.getAuditTrailInfo("delete", "Fleet", unitsJsonData[unitId].label);
//             AudiTrailModel.saveAuditTrail({
//                 userId: request.session.user.id,
//                 ipAddress: request.ip,
//                 action: auditTrailInfo.actionMsg,
//                 description: auditTrailInfo.descMsg
//             });
//             delete unitsJsonData[Id];
//         }
//     }
//};

const removeById = async function (request) {

    const Id = request.body.id;
    let response = {};
    if (!Id)
        throw new Error('Cannot proceed empty Ship ID!');
    console.log('---------------- sister vessel group -----------------');
    const result = await fleetModel.removefleetById(Id);
    console.log('---------------result--------------',result);
    if(result.name) {

        const auditTrailInfo = Util.getAuditTrailInfo("delete", "Fleet", result.name);
        AudiTrailModel.saveAuditTrail({
            userId: request.session.user.id,
            ipAddress: request.ip,
            action: auditTrailInfo.actionMsg,
            description: auditTrailInfo.descMsg
        });


        response = {
            isSuccess:true,
            msg:"The Fleet Data is Successfully Deleted By ID"
        };
        console.log('---------------success---------------------');

    } else {
        response = {
            isSuccess:false,
            msg:"The Data You Are Trying To Get, Does Not Exist"
        }
        console.log('---------------fail---------------------');
    }

    return response;
};

const readAllFleetWithUserFilter = async function (request) {
    const AllFleetData = await fleetModel.getAllFleetData();
    let AllFleetFilterdata = [];
    const userID = request.session.user.id;
    const userAssignShips = await userModel.getAllShips(userID);
    const AllShipData = await shipModel.getAllVesselsData();
    let filterShipData = _.filter(AllShipData,function (o){
        if(userAssignShips.includes(o.id)){
            return o;
        };
    });

    for(let j=0;j<AllFleetData.length;j++) {
        console.log(AllFleetData[j].id);
        const status = _.filter(filterShipData,function (o){
            return JSON.parse(o.Fleet).includes(AllFleetData[j].id);
        });
        if(status.length > 0) {
            AllFleetFilterdata.push(AllFleetData[j]);
        }
    }
    return AllFleetFilterdata;
};

module.exports = {
    create: create,
    readAll: readAll,
    removeById:removeById,
    readAllFleetWithUserFilter:readAllFleetWithUserFilter
};