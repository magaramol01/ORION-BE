'use strict';
const AudiTrailModel = require("../models/auditTrailModel");
const vesselGroupModel = require("../models/sisterVesselGroupModel");
const {Util} = require("../utils/util");
const userModel = require("../models/userModel");
const shipModel = require("../models/shipModel");
const _ = require('lodash');

const create = async function (request) {

        const vesselData = request.body;
        let response = {};

        if (!vesselData)
            throw new Error('Cannot store empty units!');

         let VesselJsonData = await vesselGroupModel.getJsonData();

        for(let item of Object.values(VesselJsonData))
        {
            if(item.vesselgroupname === vesselData.groupname) {
                return {
                    status: false,
                    id: 0
                }
            }
        }
        const result = await vesselGroupModel.createVesselGroup(vesselData);
        if (result.id) {
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


const removeById = async function (request) {

    const Id = request.body.id;
    let response = {};
    if (!Id)
        throw new Error('Cannot proceed empty Ship ID!');
    console.log('---------------- sister vessel group -----------------');
    const result = await vesselGroupModel.removeSisterVesselById(Id);
    if(result.name) {

        const auditTrailInfo = Util.getAuditTrailInfo("delete", "Sister Vessel", result.name);
        AudiTrailModel.saveAuditTrail({
            userId: request.session.user.id,
            ipAddress: request.ip,
            action: auditTrailInfo.actionMsg,
            description: auditTrailInfo.descMsg
        });
        response = {
            isSuccess:true,
            msg:"The Data Ship Data is Successfully Deleted By ID"
        }

    } else {
        response = {
            isSuccess:false,
            msg:"The Data You Are Trying To Get, Does Not Exist"
        }
    }
    return response;
};

const readAll = async function () {
    return await vesselGroupModel.getAllSisterGroups();
};

const readAllSisterVesselWithUserFilter = async function (request) {
    const AllSisterGroup =  await vesselGroupModel.getAllSisterGroups();
    let AllSisterGroupFilterdata = [];
    let userID = request.session.user.id;
    let userAssignShips = await userModel.getAllShips(userID);
    const AllShipData = await shipModel.getAllVesselsData();
    let filterShipData = _.filter(AllShipData,function (o){
        if(userAssignShips.includes(o.id)){
            return o;
        };
    });

    for(let j=0;j<AllSisterGroup.length;j++) {
        console.log(AllSisterGroup[j].vesselgroupname);
        const status = _.filter(filterShipData,function (o){
            return o.SisterGroup == AllSisterGroup[j].vesselgroupname
        });
        if(status.length > 0) {
            AllSisterGroupFilterdata.push(AllSisterGroup[j]);
        }
    }
    return AllSisterGroupFilterdata;
};

module.exports = {
    create: create,
    readAll: readAll,
    removeById:removeById,
    readAllSisterVesselWithUserFilter:readAllSisterVesselWithUserFilter
};