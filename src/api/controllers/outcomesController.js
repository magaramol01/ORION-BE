"use strict";

const appSettingsModel = require('../models/appSettingsModel');
const AudiTrailModel = require("../models/auditTrailModel");
const FailureAdvisoriesModel = require("../models/failureAdvisoriesModel");
const CausesModel = require("../models/causesModel");
const RuleBlocksModel = require("../models/ruleBlocksModel");
const FailureAdvisoriesController = require("./failureAdvisoriesController");
const {Util} = require("../utils/util");
const _ = require('lodash');
const ShipModel = require('../models/shipModel');

exports.readAll = async function (request) {
    let failureAdvisoriesData = await FailureAdvisoriesModel.getFailureAdvisoriesJsonData();
    let failureAdvisoriesDataReferenceCauses = await FailureAdvisoriesModel.getFailureAdvisoriesReferencesCausesJsonData();
    let causeDataRuleConfig = await CausesModel.getCausesReferencesRuleConfigJsonData();

    let outcomesArr = [];

    for (let config in failureAdvisoriesDataReferenceCauses) {
        if (!failureAdvisoriesDataReferenceCauses.hasOwnProperty(config)) {
            continue;
        }

        let failureAdvisory = Object.keys(failureAdvisoriesDataReferenceCauses[config])[0];
        let causesExpression = failureAdvisoriesDataReferenceCauses[config][failureAdvisory];
        let causesArray = causesExpression[0].replace(/[()]/g, "").split(/ *(?:[&|]{2}) */g);
        let causeRuleChain = [];
        let vesselName = failureAdvisoriesDataReferenceCauses[config]["vesselName"];

        for (let index in causesArray) {
            let cause = {
                cause: causesArray[index],
                ruleChains: causeDataRuleConfig[causesArray[index]][config][failureAdvisory]
            };
            causeRuleChain.push(cause);
        }

        let outcome = {
            CONFIG_ID: config,
            FA: failureAdvisory,
            isFailureAdvisory: failureAdvisoriesData[failureAdvisory]["isFailureAdvisory"],
            isAlarm: failureAdvisoriesData[failureAdvisory]["isAlarm"],
            Causes: causesExpression[0],
            causeRuleChain: causeRuleChain,
            vesselName:vesselName
        };
        outcomesArr.push(outcome)
    }

    return outcomesArr;
};

exports.readAllByShip = async function (request) {
    let {
        vesselName,
        activePage,
        sortBy,
        searchArr
    } = request.query;
    activePage = Number(activePage)
    searchArr = JSON.parse(searchArr);
    const {itemsCountPerPage,pageRangeDisplayed} = appSettingsModel.getAppSettingsJsonData().pagination;
    let totalItemsCount = 0;
    const fromIndex = (activePage - 1) * itemsCountPerPage;
    const toIndex = fromIndex + itemsCountPerPage;

    let failureAdvisoriesData = FailureAdvisoriesModel.getFailureAdvisoriesJsonData();
    let failureAdvisoriesDataReferenceCauses = FailureAdvisoriesModel.getFailureAdvisoriesReferencesCausesJsonData();

    let failureAdvisoriesDataReferenceCausesCopy = _.cloneDeep(failureAdvisoriesDataReferenceCauses);
    let fADataReferenceCausesCopyFilterByVessel = Util.filterRecordsByVesselId(failureAdvisoriesDataReferenceCausesCopy,ShipModel.getShipIdByMappingName(vesselName));
    
    let causeDataRuleConfig = await CausesModel.getCausesReferencesRuleConfigJsonData();

    let failureAdvisoriesDataCopy = _.cloneDeep(failureAdvisoriesData);
    let failureAdvisoriesFilterByVessel = Util.filterRecordsByVesselId(failureAdvisoriesDataCopy,ShipModel.getShipIdByMappingName(vesselName));
    let failureAdvisoriesFilterByVesselIdName = Util.getObjectAsKeyValueByIdName(failureAdvisoriesFilterByVessel);

    let outcomesArr = [];

    for (let config in fADataReferenceCausesCopyFilterByVessel) {
        let failureAdvisory = Object.keys(fADataReferenceCausesCopyFilterByVessel[config])[0];
        let isSearchMatched = true;

        for(let sIndex = 0; sIndex < searchArr.length; sIndex++) {
            const {searchKey, searchValue} = searchArr[sIndex];
            isSearchMatched = searchValue ? failureAdvisoriesFilterByVesselIdName[failureAdvisory.toString()].toLocaleLowerCase().indexOf(searchValue.toLocaleLowerCase()) >= 0 : true;
            if(!isSearchMatched) {
                isSearchMatched = false;
                break;
            }
        }

        if (!fADataReferenceCausesCopyFilterByVessel.hasOwnProperty(config) || !isSearchMatched) {
            continue;
        }
        let causesExpression = fADataReferenceCausesCopyFilterByVessel[config][failureAdvisory];
        let causesArray = causesExpression[0].replace(/[()]/g, "").split(/ *(?:[&|]{2}) */g);
        let causeRuleChain = [];
        let vesselName = fADataReferenceCausesCopyFilterByVessel[config]["vesselId"];

        for (let index in causesArray) {
            let cause = {
                cause: causesArray[index],
                ruleChains: causeDataRuleConfig[causesArray[index]][config][failureAdvisory]
            };
            causeRuleChain.push(cause);
        }

        let outcome = {
            CONFIG_ID: config,
            FA: failureAdvisory,
            isFailureAdvisory: failureAdvisoriesData[failureAdvisory]["isFailureAdvisory"],
            isAlarm: failureAdvisoriesData[failureAdvisory]["isAlarm"],
            Causes: causesExpression[0],
            causeRuleChain: causeRuleChain,
            vesselId:vesselName,
            sendEmail:fADataReferenceCausesCopyFilterByVessel[config]['sendEmail'],
        };
        outcomesArr.push(outcome);
        totalItemsCount++;
    }

    outcomesArr
        .sort(function (x, y) {
        let a = failureAdvisoriesFilterByVesselIdName[x.FA.toString()].toUpperCase(),
            b = failureAdvisoriesFilterByVesselIdName[y.FA.toString()].toUpperCase();

        if(sortBy === 'asc') {
            return a == b ? 0 : a > b ? 1 : -1;
        } else {
            return a == b ? 0 : a < b ? 1 : -1;
        }
    });

    const paginatedOutcomesArr = outcomesArr.splice(fromIndex, toIndex < itemsCountPerPage ? toIndex : itemsCountPerPage)

    return {
        activePage,
        itemsCountPerPage,
        totalItemsCount,
        pageRangeDisplayed,
        data: paginatedOutcomesArr
    };
};

exports.getAllRuleEngineData = async function (request) {
    let failureAdvisoriesData = await FailureAdvisoriesModel.getFailureAdvisoriesJsonData();
    let causesData = await CausesModel.getCausesJsonData();
    let ruleBlocksData = await RuleBlocksModel.getRuleBlocksJsonData();

    let allData = {};
    let ruleBlockProcessedData = {};

    for (let dataItem in ruleBlocksData) {
        if (!ruleBlocksData.hasOwnProperty(dataItem)) {
            continue;
        }
        ruleBlockProcessedData[dataItem] = {
            name: ruleBlocksData[dataItem]["name"],
            description: ruleBlocksData[dataItem]["description"]
        };
    }

    allData["failureAdvisories"] = failureAdvisoriesData;
    allData["causes"] = causesData;
    allData["ruleBlockData"] = ruleBlockProcessedData;

    return allData;
};

exports.getAllRuleEngineDataByShip = async function (request) {
    const vesselName = request.query.vesselName;
    let failureAdvisoriesData = await FailureAdvisoriesModel.getFailureAdvisoriesJsonData();
    let failureAdvisoriesDataCopy = _.cloneDeep(failureAdvisoriesData);
    let failureAdvisoriesFilterByVessel = Util.filterRecordsByVesselId(failureAdvisoriesDataCopy,ShipModel.getShipIdByMappingName(vesselName));
    let causesData = await CausesModel.getCausesJsonData();
    let causesDataCopy = _.cloneDeep(causesData);
    let causesFilterByVessel = Util.filterRecordsByVesselId(causesDataCopy,ShipModel.getShipIdByMappingName(vesselName));
    let ruleBlocksData = await RuleBlocksModel.getRuleBlocksJsonData();
    let ruleBlocksDataCopy = _.cloneDeep(ruleBlocksData);
    let ruleBlocksFilterByVessel = Util.filterRecordsByVesselId(ruleBlocksDataCopy,ShipModel.getShipIdByMappingName(vesselName));

    let allData = {};
    let ruleBlockProcessedData = {};

    for (let dataItem in ruleBlocksFilterByVessel) {
        if (!ruleBlocksData.hasOwnProperty(dataItem)) {
            continue;
        }
        ruleBlockProcessedData[dataItem] = {
            name: ruleBlocksData[dataItem]["name"],
            description: ruleBlocksData[dataItem]["description"]
        };
    }

    allData["failureAdvisories"] = failureAdvisoriesFilterByVessel;
    allData["causes"] = causesFilterByVessel;
    allData["ruleBlockData"] = ruleBlockProcessedData;

    return allData;
};

exports.configureOutcome = async function (request) {
    const outcomeData = request.body;

    const failureAdvisoryReferenceCausesJsonData = await FailureAdvisoriesModel.getFailureAdvisoriesReferencesCausesJsonData();
    const causesReferencesRuleConfigJsonData = await CausesModel.getCausesReferencesRuleConfigJsonData();

    let failureAdvisory = outcomeData.failureAdvisory;
    let causes = outcomeData.causes;
    let causeRuleChain = outcomeData.causeRuleChain;
    let failureAdvisoryReferenceCausesKey;

    if (failureAdvisory) {
        const failureAdvisoryReferencesCausesData = {
            ref: JSON.stringify({[failureAdvisory]: Array(causes)})
        };

        failureAdvisoryReferencesCausesData['userId']=request.session.user.id;
        failureAdvisoryReferencesCausesData['companyName']=request.session.user.CompanyName;
        failureAdvisoryReferencesCausesData['vesselId']=ShipModel.getShipIdByMappingName(outcomeData.vesselName);
        const result = await FailureAdvisoriesModel.createFailureAdvisoryReferencesCauses(failureAdvisoryReferencesCausesData);

        if (result.id) {
            failureAdvisoryReferenceCausesKey = result.id;
            failureAdvisoryReferenceCausesJsonData[failureAdvisoryReferenceCausesKey] = {[failureAdvisory]: Array(causes),'userId':request.session.user.id,'vesselId':ShipModel.getShipIdByMappingName(outcomeData.vesselName),'companyName':request.session.user.CompanyName};
            console.log("Failure Advisory Reference Causes created successfully!!!");
        } else {
            console.log("Error occurred while creating a Failure Advisory Reference Causes!!!");
        }
    }

    for (let index in causeRuleChain) {
        let causeId = causeRuleChain[index]["cause"];
        if (causeId) {
            if (causesReferencesRuleConfigJsonData.hasOwnProperty(causeId)) {
                const causeReferencesRuleConfig = causesReferencesRuleConfigJsonData[causeId];
                if (causeReferencesRuleConfig.hasOwnProperty(failureAdvisoryReferenceCausesKey)) {
                    // Note : this is not possible case but if any scenario occurs then we will handle it
                    // if (causeReferencesRuleConfig[failureAdvisoryReferenceCausesKey].hasOwnProperty(failureAdvisory)) {
                    //     causeReferencesRuleConfig[failureAdvisoryReferenceCausesKey][failureAdvisory] = causeRuleChain[index]["ruleChains"];
                    // } else {
                    //     causeReferencesRuleConfig[failureAdvisoryReferenceCausesKey] = {[failureAdvisory]: causeRuleChain[index]["ruleChains"]};
                    // }
                } else {
                    causeReferencesRuleConfig[failureAdvisoryReferenceCausesKey] = {[failureAdvisory]: causeRuleChain[index]["ruleChains"]};
                    delete causeReferencesRuleConfig["userId"];
                    delete causeReferencesRuleConfig["vesselId"];
                    delete causeReferencesRuleConfig["companyName"];
                    const dbConvertedFormatData = {
                        ref: JSON.stringify(causeReferencesRuleConfig)
                    };
                    const result = await CausesModel.updateCausesReferencesRuleConfigByCauseId(causeId, dbConvertedFormatData);

                    if (result) {
                        console.log("Cause References Rule Config updated successfully!!!");
                    } else {
                        console.log("Error occurred while updated a Cause References Rule Config!!!");
                    }
                }
            } else {
                let causesReferencesRuleConfigData = {};
                causesReferencesRuleConfigData[failureAdvisoryReferenceCausesKey] = {
                    [failureAdvisory]: causeRuleChain[index]["ruleChains"]
                };

                const dbConvertedFormatData = {
                    causeId: causeId,
                    ref: JSON.stringify(causesReferencesRuleConfigData),
                    userId:request.session.user.id,
                    vesselId:ShipModel.getShipIdByMappingName(outcomeData.vesselName),
                    companyName:request.session.user.CompanyName
                };

                const result = await CausesModel.createCausesReferencesRuleConfig(dbConvertedFormatData);

                if (result.id) {
                    causesReferencesRuleConfigData['userId']=request.session.user.id;
                    causesReferencesRuleConfigData['vesselId']=ShipModel.getShipIdByMappingName(outcomeData.vesselName);
                    causesReferencesRuleConfigData['companyName']=request.session.user.CompanyName;
                    causesReferencesRuleConfigJsonData[causeId] = causesReferencesRuleConfigData;
                    console.log("Cause References Rule Config created successfully!!!");
                } else {
                    console.log("Error occurred while creating a Cause References Rule Config!!!");
                }
            }
        }
    }

    const auditTrailInfo = Util.getAuditTrailInfo("create", "Configure Outcome", failureAdvisoryReferenceCausesKey + failureAdvisory);
    AudiTrailModel.saveAuditTrail({
        userId: request.session.user.id,
        ipAddress: request.ip,
        action: auditTrailInfo.actionMsg,
        description: auditTrailInfo.descMsg
    });

    return outcomeData.CONFIG_ID;
};

exports.updateOutcome = async function (request) {
    const outcomeData = request.body;

    const failureAdvisoryReferenceCausesJsonData = await FailureAdvisoriesModel.getFailureAdvisoriesReferencesCausesJsonData();
    const causesReferencesRuleConfigJsonData = await CausesModel.getCausesReferencesRuleConfigJsonData();
    let failureAdvisory = outcomeData.failureAdvisory;
    let causes = outcomeData.causes;
    let causeRuleChain = outcomeData.causeRuleChain;
    let failureAdvisoryReferenceCausesKey;
    if (failureAdvisory) {
        const failureAdvisoryReferencesCausesData = {
            ref: JSON.stringify({[failureAdvisory]: Array(causes)})
        };

        const result = await FailureAdvisoriesModel.updateFailureAdvisoryReferencesCauses(outcomeData.CONFIG_ID,failureAdvisoryReferencesCausesData);
        if (result) {
            failureAdvisoryReferenceCausesJsonData[outcomeData.CONFIG_ID] = {[failureAdvisory]: Array(causes),'userId':request.session.user.id,'vesselId':ShipModel.getShipIdByMappingName(outcomeData.vesselName),'companyName':request.session.user.CompanyName};
            console.log("Failure Advisory Reference update successfully!!!");
        } else {
            console.log("Error occurred while updating a Failure Advisory Reference Causes!!!");
        }
    }
    for (let index in causeRuleChain) {
        let causeId = causeRuleChain[index]["cause"];
        if (causeId) {
            if (causesReferencesRuleConfigJsonData.hasOwnProperty(causeId)) {
                const causeReferencesRuleConfig = causesReferencesRuleConfigJsonData[causeId];
                    causeReferencesRuleConfig[outcomeData.CONFIG_ID] = {[failureAdvisory]: causeRuleChain[index]["ruleChains"]};
                    delete causeReferencesRuleConfig["userId"];
                    delete causeReferencesRuleConfig["vesselId"];
                    delete causeReferencesRuleConfig["companyName"];
                    const dbConvertedFormatData = {
                        ref: JSON.stringify(causeReferencesRuleConfig)
                    };
                    const result = await CausesModel.updateCausesReferencesRuleConfigByCauseId(causeId, dbConvertedFormatData);

                    if (result) {
                        console.log("Cause References Rule Config updated successfully!!!");
                    } else {
                        console.log("Error occurred while updated a Cause References Rule Config!!!");
                    }
            } else {
                let causesReferencesRuleConfigData = {};
                causesReferencesRuleConfigData[outcomeData.CONFIG_ID] = {
                    [failureAdvisory]: causeRuleChain[index]["ruleChains"]
                };
                const dbConvertedFormatData = {
                    causeId: causeId,
                    ref: JSON.stringify(causesReferencesRuleConfigData),
                    userId:request.session.user.id,
                    vesselId:ShipModel.getShipIdByMappingName(outcomeData.vesselName),
                    companyName:request.session.user.CompanyName
                };
                const result = await CausesModel.createCausesReferencesRuleConfig(dbConvertedFormatData);
                if (result.inserted > 0) {
                    causesReferencesRuleConfigData['userId']=request.session.user.id;
                    causesReferencesRuleConfigData['vesselId']=ShipModel.getShipIdByMappingName(outcomeData.vesselName);
                    causesReferencesRuleConfigData['companyName']=request.session.user.CompanyName;
                    causesReferencesRuleConfigJsonData[causeId] = causesReferencesRuleConfigData;
                    console.log("Cause References Rule Config created successfully!!!");
                } else {
                    console.log("Error occurred while creating a Cause References Rule Config!!!");
                }
            }
        }
    }
    const auditTrailInfo = Util.getAuditTrailInfo("create", "update Outcome", failureAdvisoryReferenceCausesKey + failureAdvisory);
    AudiTrailModel.saveAuditTrail({
        userId: request.session.user.id,
        ipAddress: request.ip,
        action: auditTrailInfo.actionMsg,
        description: auditTrailInfo.descMsg
    });

    return "update outcomes";
};

exports.removeOutcomeById = function (request) {
    return FailureAdvisoriesController.removeOutcomeById(request.query.id);
};

exports.setResetEmailForFailureAdvisoriesRefCause = function (request) {
    return FailureAdvisoriesController.setResetEmailForFailureAdvisoriesRefCause(request);
};