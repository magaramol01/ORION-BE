'use strict';

/*
* CRUD CONTROLLER
* */
const AudiTrailModel = require("../models/auditTrailModel");
const ShipModel = require("../models/shipModel");
const fleetModel = require("../models/fleetModel");
const userController = require("../controllers/userController");
const UserModel = require("../models/userModel");
const VesselJourneyCounterModel = require("../models/vesselJourneyCounterModel");
const EmailScheduler = require("../mappers/scheduleEmail");
const {Util} = require("../utils/util");
const _ = require('lodash');

const create = async function (request) {
    const Ship = request.body;
    let response = {};
    if (!Ship)
        throw new Error('Cannot proceed empty Ship details!');

    Ship['userId']=request.session.user.id;
    const result = await ShipModel.saveShip(Ship);

    if(result.id){
        await ShipModel.syncAllVesselsData();
        const shipJsonData = ShipModel.getAllShipJsonData();
        shipJsonData[Ship.MappingName] = result.id;

        const auditTrailInfo = Util.getAuditTrailInfo("create", "Ship", Ship.Name);
        AudiTrailModel.saveAuditTrail({
            userId: request.session.user.id,
            ipAddress: request.ip,
            action: auditTrailInfo.actionMsg,
            description: auditTrailInfo.descMsg
        });

        const emailSchedulerInstance = EmailScheduler.getInstance();
        emailSchedulerInstance.setEmailSchedulerData(result.id, Util.getNewDate());

        const ShipArr = await ShipModel.getAllShipJsonData();
        const allUsers = await UserModel.getAllUserData();

        allUsers.map((item)=>{
            if(item.Role === "Smart Ship Super User" || item.Role === "Ship Manager") {
                let ids = [];
                if(ShipArr!==null) {
                    ids = Object.values(ShipArr);
                }
                userController.updateUserShips(item.uId, JSON.stringify(ids));
            }
        });

        VesselJourneyCounterModel.insertData({
            journeyCounter: 1,
            vesselId: result.id
        });
        let vesselJourneyCounterInMemoryData = VesselJourneyCounterModel.getVesselJourneyCounterJsonData();
        if (vesselJourneyCounterInMemoryData === null) {
            vesselJourneyCounterInMemoryData = {};
        }
        vesselJourneyCounterInMemoryData[result.id] = 1;

        response = {
            isSuccess:true,
            msg:"Ship Registered successfully",
        };
    } else {
        response = {
            isSuccess:false,
            msg:"Error Occurred while registering Ship",
        };
    }
    return response;
};

const getById = async function(request){
    const ShipID = request.body.id;
    let response = {};
    if (!ShipID)
        throw new Error('Cannot proceed empty Ship ID!');

    let ShipData = await ShipModel.getShipDataById(ShipID);
    const fleetData = await fleetModel.getAllFleetData();

    ShipData.map((responseData, i) => {
        let arr = [];
         ShipData[i].Fleet.map((item1)=>{
            fleetData.map((item2)=>{
                if(item1 === item2.id){
                    arr.push(item2.name)
                }
            })
         })
         ShipData[i].Fleet = arr;
    });
    if(ShipData.length>0) {
        ShipData[0].isSuccess = true;
        response = ShipData;
    } else {
        response = {
            isSuccess:false,
            msg:"The Data You Are Trying To Get, Does Not Exist"
        }
    }

    return response;
};

const getAllData = async function(request){
    let response = {};

    const ShipData = await ShipModel.getAllVesselsData();
    let ShipDataCopy=_.cloneDeep(ShipData);
    //ShipDataCopy = Util.sortedShipBasedOnUser(ShipDataCopy,request.session.user.id);
    if(ShipData.length>0) {
        response = ShipDataCopy;
    } else {
        response = {
            isSuccess:false,
            msg:"There are no Ship Records available"
        }
    }
    response =  _.sortBy(response,[function(o) { return o.id; }]);
    return response;
};

const deleteById = async function(request){
    const ShipID = request.body.id;
    let response = {};
    if (!ShipID)
        throw new Error('Cannot proceed empty Ship ID!');

    const result = await ShipModel.deleteShipDataById(ShipID);
    if(result.MappingName) {
        const shipJsonData = ShipModel.getAllShipJsonData();
        await ShipModel.syncAllVesselsData();
        delete shipJsonData[result.MappingName];

        const auditTrailInfo = Util.getAuditTrailInfo("delete", "Ship", result.name);
        AudiTrailModel.saveAuditTrail({
            userId: request.session.user.id,
            ipAddress: request.ip,
            action: auditTrailInfo.actionMsg,
            description: auditTrailInfo.descMsg
        });

        const emailSchedulerInstance = EmailScheduler.getInstance();
        emailSchedulerInstance.removeEmailSchedulerForVesselId(result.id);

        const ShipArr = await ShipModel.getAllShipJsonData();
        const allUsers = await UserModel.getAllUserData();

        allUsers.map((item)=>{
                let ids = [];
                if(ShipArr!==null) {
                    ids = Object.values(ShipArr);
                }
                userController.updateUserShips(item.uId, JSON.stringify(ids));

        })

        response = response = {
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

const updateById = async function (request) {
    const Ship = request.body;
    let oldShipName = "";
    let response;
    if (!Ship)
        throw new Error('Cannot proceed empty Ship ID!');

    if(Ship.Name){
        if(Ship.oldShipName){
            oldShipName = Ship.oldShipName;
        }
    }
    Ship['userId']=request.session.user.id;
    const shipUpdateObj =  _.cloneDeep(Ship);
    if(Ship.fleet) {
        Ship['fleet'] = JSON.stringify(Ship['fleet']);
    }
    const result = await ShipModel.updateShipDataById(Ship);

    if(result.id) {
        await ShipModel.syncAllVesselsData();
        if(Ship.MappingName){
            const shipJsonData = ShipModel.getAllShipJsonData();
            const oldMappingName = ShipModel.getShipMappingNameById(parseInt(Ship.id));
            delete shipJsonData[oldMappingName];
            shipJsonData[Ship.MappingName] = parseInt(Ship.id);
        }

        const auditTrailInfo = Util.getAuditTrailInfo(
            "update",
            "Ship" ,
            Ship.oldShipName && Ship.oldShipName !== result.name ?
            Ship.oldShipName + " => " + Ship.Name
                : result.name
        );
        AudiTrailModel.saveAuditTrail({
            userId: request.session.user.id,
            ipAddress: request.ip,
            action: auditTrailInfo.actionMsg,
            description: auditTrailInfo.descMsg
        });

        response = response = {
            isSuccess:true,
            msg:"The Ship Details are Successfully Updated"
        }
    } else {
        response = {
            isSuccess:false,
            msg:"Ship Details Could Not Be Updated"
        }
    }
    return response;
};

const createMultiple = async function(request){
    const MultipleShip = request.body;
    const userId = request.session.user.id
    let response;

    if (!MultipleShip || MultipleShip.length === 0)
        throw new Error('Cannot proceed empty Ship Data!');

    const emailSchedulerInstance = EmailScheduler.getInstance();

    let shipsSavedCount = 0;

    for(let i in MultipleShip){
        const Ship = MultipleShip[i];
        Ship['userId'] = userId;
        const result = await ShipModel.saveShip(Ship);

        if(result.id){
            shipsSavedCount++;

            const auditTrailInfo = Util.getAuditTrailInfo("create", "Ship (CSV)", Ship.Name);
            AudiTrailModel.saveAuditTrail({
                userId: request.session.user.id,
                ipAddress: request.ip,
                action: auditTrailInfo.actionMsg,
                description: auditTrailInfo.descMsg
            });

            emailSchedulerInstance.setEmailSchedulerData(result.id, Util.getNewDate());

            VesselJourneyCounterModel.insertData({
                journeyCounter: 1,
                vesselId: result.id
            });
            let vesselJourneyCounterInMemoryData = VesselJourneyCounterModel.getVesselJourneyCounterJsonData();
            if (vesselJourneyCounterInMemoryData === null) {
                vesselJourneyCounterInMemoryData = {};
            }
            vesselJourneyCounterInMemoryData[result.id] = 1;
        }
    }


    if(shipsSavedCount > 0){
        const ShipArr = await ShipModel.getAllShipNames();
        const allUsers = await UserModel.getAllUserData();
        await ShipModel.syncShipJsonData();
        await ShipModel.syncAllVesselsData();

        allUsers.map((item)=>{
            if(item.Role === "Smart Ship Super User" || item.Role === "Ship Manager") {
                let arr = [];
                ShipArr.map((item=>{
                    arr.push(item.id);
                }))
                userController.updateUserShips(item.uId,JSON.stringify(arr));
            }
        })

        if(MultipleShip.length === shipsSavedCount){
            response = {
                isSuccess:true,
                msg:"Ships Inserted successfully",
            };
        }else {
            response = {
                isSuccess:true,
                msg: shipsSavedCount + "/" + MultipleShip.length + " Ships Inserted successfully",
            };
        }
    } else {
        response = {
            isSuccess:false,
            msg:"Error Occurred while Inserting Ships",
        };
    }
    return response;
}
const getAllShip = async function(request){
    const shipData = await ShipModel.getAllShipNames();
    return shipData;
}


const getAllShipBySister = async function(request) {
    const data = request.body.id;
    let shipData = await ShipModel.getAllShipNamesBySister(data);
    let response;
    let userID = request.session.user.id;
    let userAssignShips = await UserModel.getAllShips(userID);
    userAssignShips.sort();
    let arr = [];
    userAssignShips.map((responseData, i) => {
        shipData.map((responseShipData, j) => {
            if(userAssignShips[i] == shipData[j].id) {
                let obj = {};
                obj['id'] = shipData[j].id;
                obj['name'] = shipData[j].name;
                obj['mappingname'] = shipData[j].mappingname;
                arr.push(obj);
            }
        });
    });
    if(arr.length>0) {
        arr[0].isSuccess = true;
        response = arr;
    } else {
        response = {
            isSuccess:false,
            msg:"The Data You Are Trying To Get, Does Not Exist"
        }
    }
    return arr;
}

const getAllShipByFleet = async function(request) {
    let data = request.body.id;
    let AllFleetData = await ShipModel.getAllShipNamesByFleet(data);
    AllFleetData = _.sortBy(AllFleetData,function (o){return o.id});
    let userID = request.session.user.id;
    let userAssignShips = await UserModel.getAllShips(userID);
    userAssignShips = userAssignShips.sort();
    let arr = [];
    let arr1 = [];
    if(data == 'Select All') {
        AllFleetData.map((responseData, i) => {
            let obj = {};
            obj['name'] = AllFleetData[i].name;
            obj['id'] = AllFleetData[i].id;
            obj['mappingname'] = AllFleetData[i].mappingname;
            arr.push(obj);
        });
    }
    else {
         AllFleetData.map((responseData, i) => {
                    let temp = JSON.parse(AllFleetData[i].fleet);
                    for (let j in temp) {
                        if (temp[j] == data) {
                            let obj = {};
                            obj['name'] = AllFleetData[i].name;
                            obj['id'] = AllFleetData[i].id;
                            obj['mappingname'] = AllFleetData[i].mappingname;
                            arr.push(obj);
                        }
                    }
                });

    }
    userAssignShips.map((responseData, i) => {

        arr.map((responseShipData, j) => {
            if(userAssignShips[i] == arr[j].id) {
                let obj = {};
                obj['id'] = arr[j].id;
                obj['name'] = arr[j].name;
                obj['mappingname'] = arr[j].mappingname;
                arr1.push(obj);
            }
        });

    });
    let response;
    if(arr1.length>0) {
        response = arr1;
    } else {
        response = {
            isSuccess:false,
            msg:"The Data You Are Trying To Get, Does Not Exist"
        }
    }
    return response;
}
module.exports = {
    create: create,
    getById:getById,
    getAllData:getAllData,
    deleteById:deleteById,
    updateById:updateById,
    createMultiple:createMultiple,
    getAllShip:getAllShip,
    getAllShipBySister:getAllShipBySister,
    getAllShipByFleet:getAllShipByFleet,
};