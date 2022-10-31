'use strict';

/*
* CRUD CONTROLLER
* */

const AudiTrailModel = require("../models/auditTrailModel");
const ParametersModel = require("../models/parametersModel");
const ConstantParameterModel = require("../models/constantParameterModel");
const {Util} = require("../utils/util");
const _ = require('lodash');
const parameterScalingMapper = require("../mappers/parameterScalingMapper");
const ShipModel = require('../models/shipModel');

const create = async function (request) {
    const parameterData = request.body;

    if (!parameterData)
        throw new Error('Cannot store empty parameter!');

    const parametersJsonData = await ParametersModel.getParametersJsonData();
    let parameterId = await checkStatusOfParameterCreation(parameterData.name, ShipModel.getShipIdByMappingName(parameterData.vesselName));
    if (parameterId !== "") {
        return "Parameter name already exists!!!"
    }

    if(parameterData.unit === "") parameterData.unit = "NA";
    parameterData['userId']=request.session.user.id;
    parameterData['companyName']=request.session.user.CompanyName;
    parameterData['vesselId']=ShipModel.getShipIdByMappingName(parameterData["vesselName"]);
    const result = await ParametersModel.createParameter(parameterData);

    if (result.id) {
        const parameterKey = result.id;
        parameterData.id = result.id;
        parametersJsonData[parameterKey] = parameterData;
        parameterScalingMapper.setParameterDataByShipName(parameterData.vesselId,parameterData.name,parameterData.scale);

        const auditTrailInfo = Util.getAuditTrailInfo("create", "Parameter", parameterData.name);
        AudiTrailModel.saveAuditTrail({
            userId: request.session.user.id,
            ipAddress: request.ip,
            action: auditTrailInfo.actionMsg,
            description: auditTrailInfo.descMsg
        });

        console.log("Parameter created successfully!!!");
        return parameterKey;
    } else {
        return "Error occurred while creating a Parameter!!!";
    }

};

const readById = function (parameterId) {
    let parameter = {};
    parameter[parameterId] = ParametersModel.getParametersJsonData()[parameterId];
    return parameter;
};

const readAll = async function (request) {
   let parametersJsonData= await ParametersModel.getParametersJsonData();
    return parametersJsonData;
};

const readAllByShip = async function (request) {
    let parametersJsonData= await ParametersModel.getParametersJsonData();
    const vesselName = request.query.vesselName;
    let parametersJsonDataCopy = _.cloneDeep(parametersJsonData);
    let parametersFilterByVessel = Util.filterRecordsByVesselId(parametersJsonDataCopy, ShipModel.getShipIdByMappingName(vesselName));
    return parametersFilterByVessel;
};

const readAllByShipForPagination = async function (request) {
    const {
        vesselName,
        activePage,
        sortBy,
        searchArr,
        searchMachineArr
    } = request.query;
    let parametersJsonData = ParametersModel.getParametersJsonData();

    return Util.filterRecordsByVesselIdForPagination(
        _.orderBy(_.cloneDeep(parametersJsonData), ['description'], [sortBy]),
        ShipModel.getShipIdByMappingName(vesselName),
        activePage,
        JSON.parse(searchArr),
        JSON.parse(searchMachineArr)
    );
};

const readAllOnlyNames = async function (request) {
    let parametersJsonData = await ParametersModel.getParametersJsonData();
    // TODO : currentlly we are not using constantParameter in project once it is in use then  delete this comment
    //let constantParametersJsonData = await ConstantParameterModel.getAllConstantParameters();
    let processedData = [];

    for (let dataItem in parametersJsonData) {
        if (parametersJsonData.hasOwnProperty(dataItem)) {
            parametersJsonData[dataItem]["key"]=dataItem;
            processedData.push(parametersJsonData[dataItem]);
        }
    }
    // for (let dataItem in constantParametersJsonData) {
    //     if (constantParametersJsonData.hasOwnProperty(dataItem)) {
    //         constantParametersJsonData[dataItem]["key"]=dataItem;
    //         processedData.push(constantParametersJsonData[dataItem]);
    //     }
    // }

    return processedData;
};

const readAllOnlyNamesByShip = async function (request) {
    const vesselName = request.query.vesselName;
    let parametersJsonData = await ParametersModel.getParametersJsonData();
    let parametersJsonDataCopy = _.cloneDeep(parametersJsonData);
    let parametersFilterByVessel = Util.filterRecordsByVesselId(parametersJsonDataCopy,ShipModel.getShipIdByMappingName(vesselName));
    // TODO : currentlly we are not using constantParameter in project once it is in use then delete this comment
    //let constantParametersJsonData = await ConstantParameterModel.getAllConstantParameters();
    //let constantParametersJsonDataCopy = _.cloneDeep(constantParametersJsonData);
    //let constantparametersFilterByVessel = Util.filterRecordsByVesselId(constantParametersJsonDataCopy,ShipModel.getShipIdByMappingName(vesselName));
    let processedData = [];

    for (let dataItem in parametersFilterByVessel) {
        if (parametersJsonData.hasOwnProperty(dataItem)) {
            parametersJsonData[dataItem]["key"]=dataItem;
            processedData.push(parametersJsonData[dataItem]);
        }
    }
    // for (let dataItem in constantparametersFilterByVessel) {
    //     if (constantParametersJsonData.hasOwnProperty(dataItem)) {
    //         constantParametersJsonData[dataItem]["key"]=dataItem;
    //         processedData.push(constantParametersJsonData[dataItem]);
    //     }
    // }

    return processedData;
};

const update = async function (request) {
    const updatedParameterData = request.body;

    if (!updatedParameterData)
        throw new Error('Cannot update parameter due to insufficient details!');

    updatedParameterData[Object.keys(updatedParameterData)[0]]['userId']=request.session.user.id;
    updatedParameterData[Object.keys(updatedParameterData)[0]]['companyName']=request.session.user.CompanyName;
    let vesselName = updatedParameterData[Object.keys(updatedParameterData)[0]]['vesselName'];
    updatedParameterData[Object.keys(updatedParameterData)[0]]["vesselId"] = ShipModel.getShipIdByMappingName(vesselName);
    const result = await ParametersModel.updateParameterById(updatedParameterData);

    if (result) {
        const parametersJsonData = await ParametersModel.getParametersJsonData();
        let updatedData = Object.values(updatedParameterData)[0];
        updatedData["id"] = parseInt(Object.keys(updatedParameterData)[0]);
        parametersJsonData[Object.keys(updatedParameterData)[0]] = updatedData;
        let vesselId = updatedData.vesselId;
        let parameterName = updatedData.name;
        let scalingValue = updatedData.scale;
        parameterScalingMapper.setParameterDataByShipName(vesselId,parameterName,scalingValue);


        const auditTrailInfo = Util.getAuditTrailInfo("update", "Parameter", Object.values(updatedParameterData)[0].name);
        AudiTrailModel.saveAuditTrail({
            userId: request.session.user.id,
            ipAddress: request.ip,
            action: auditTrailInfo.actionMsg,
            description: auditTrailInfo.descMsg
        });
        return "Parameter updated successfully!!!";
    } else {
        return "Error occurred while updating a Parameter!!!";
    }

};

const removeById = async function (parameterId) {
    const parameterJsonData = await ParametersModel.getParametersJsonData();
    const parameterReferenceData = await ParametersModel.getParametersReferencesRuleConfigJsonData();

    if (parameterReferenceData.hasOwnProperty(parameterId)) {
        return "already in used.";
    } else
        if (parameterJsonData.hasOwnProperty(parameterId)) {
        const result = await ParametersModel.deleteParameterById(parameterId);
        let data;
        if(result){
            console.log("parameter Deleted Successfully!!!");
            let parameterName = parameterJsonData[parameterId].name;
            let vesselId = parameterJsonData[parameterId].vesselId;
            data = delete parameterJsonData[parameterId];
            parameterScalingMapper.setParameterDataByShipName(vesselId,parameterName,"1");
        }

        return data;
    } else {
        return "Id not available";
    }

};

const removeAll = function () {

};

const createRuleConfigReferenceInParameter = async function (ruleId, ruleConfigData) {
    const parameterId = ruleConfigData.parameterId;
    const parametersReferencesRuleConfigJsonData = await ParametersModel.getParametersReferencesRuleConfigJsonData();

    if (parameterId) {
        await handleRuleConfigReferenceInParameter(ruleId, parameterId, parametersReferencesRuleConfigJsonData);
    }
};

const updateRuleConfigReferenceInParameter = async function (oldRuleConfigData, updatedRuleConfigData) {
    const ruleId = updatedRuleConfigData.id;
    const ruleConfigData = updatedRuleConfigData;

    const parametersReferencesRuleConfigJsonData = await ParametersModel.getParametersReferencesRuleConfigJsonData();

    const newParameterId = ruleConfigData.parameterId;
    const oldParameterId = oldRuleConfigData.parameterId;
    const isParameterIdChanged = oldParameterId !== newParameterId;

    if (isParameterIdChanged) {
        let oldReferenceArray = parametersReferencesRuleConfigJsonData[oldParameterId];
        if (oldReferenceArray.includes(ruleId)) {
            oldReferenceArray.pop(ruleId);
            const result = await ParametersModel.updateParameterReferencesRuleConfigById(oldParameterId, oldReferenceArray);

            if (result) {
                console.log("updateRuleConfigReferenceInParameter :: Parameter Reference Rule updated successfully!!!");
            } else {
                console.log("updateRuleConfigReferenceInParameter :: Error occurred while updating a Parameter References Rule!!!");
            }
        }
    }

    if (isParameterIdChanged && newParameterId) {
        handleRuleConfigReferenceInParameter(ruleId, newParameterId, parametersReferencesRuleConfigJsonData);
    }
};

const handleRuleConfigReferenceInParameter = async function (ruleId, parameterId, parametersReferencesRuleConfigJsonData) {
    if (!parametersReferencesRuleConfigJsonData.hasOwnProperty(parameterId)) {
        parametersReferencesRuleConfigJsonData[parameterId] = [];

        let ruleConfigsArray = parametersReferencesRuleConfigJsonData[parameterId];
        if (!ruleConfigsArray.includes(ruleId)) {
            ruleConfigsArray.push(ruleId);

            const parameterReferencesRuleConfigData = {
                parameterId: parameterId,
                refArr: ruleConfigsArray
            };
            const result = await ParametersModel.createParameterReferencesRuleConfig(parameterReferencesRuleConfigData);

            if (result) {
                return "Parameter Reference Rule created successfully!!!";
            } else {
                return "Error occurred while creating a Parameter References Rule!!!";
            }
        }
    } else {
        let ruleConfigsArray = parametersReferencesRuleConfigJsonData[parameterId];
        if (!ruleConfigsArray.includes(ruleId)) {
            ruleConfigsArray.push(ruleId);

            const result = await ParametersModel.updateParameterReferencesRuleConfigById(parameterId, ruleConfigsArray);

            if (result) {
                return "Parameter Reference Rule updated successfully!!!";
            } else {
                return "Error occurred while updating a Parameter References Rule!!!";
            }

        }
    }
};

const checkStatusOfParameterCreation = async function(parameterName, vesselId) {
    let allShipParameters = await readAll();
    let result = "";
    // console.log(allShipParameters);
    for(let id in allShipParameters) {
        if(allShipParameters[id].name === parameterName && allShipParameters[id].vesselId === vesselId) {
            result = id;
            break;
        }
    }
    return result;
}

module.exports = {
    create: create,
    readById: readById,
    readAll: readAll,
    readAllByShip: readAllByShip,
    readAllByShipForPagination: readAllByShipForPagination,
    readAllOnlyNamesByShip: readAllOnlyNamesByShip,
    update: update,
    removeById: removeById,
    removeAll: removeAll,

    createRuleConfigReferenceInParameter: createRuleConfigReferenceInParameter,
    updateRuleConfigReferenceInParameter: updateRuleConfigReferenceInParameter,
    readAllOnlyNames: readAllOnlyNames,
    handleRuleConfigReferenceInParameter: handleRuleConfigReferenceInParameter,
    checkStatusOfParameterCreation: checkStatusOfParameterCreation
};
