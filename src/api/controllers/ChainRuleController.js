'use strict';

const constants = require('../utils/constants');
const {detectAndExecuteParameterCondition} = require("../validations/ComparatorChecker");
const {detectAndExecuteRuleCondition} = require("../validations/RuleChecker");
const {getRuleConfigsJsonData} = require("../models/ruleConfigsModel");
const {getParametersJsonData, getParametersReferencesRuleConfigJsonData} = require("../models/parametersModel");
const {getFailureAdvisoryReferenceCauseByKey, getFailureAdvisoriesDescriptionsByKey, getFailureAdvisoriesReferencesCausesJsonData, syncFailureAdvisoriesReferencesCausesJsonData} = require("../models/failureAdvisoriesModel");
const {getCauseReferencesRuleConfigByKey, getCausesReferencesRuleConfigJsonData, syncCausesJsonData} = require("../models/causesModel");

const checkLiveValue = (requestObj) => {
    let response = {};
    const causesResponseData = [];
    const failureAdvisoriesResponseData = [];
    const useCasesResponseData = [];

    const liveDataObj = requestObj.body;
    const parameterId = liveDataObj.parameterId;

    if (parameterId) {
        const parametersJsonData = getParametersJsonData();
        const parameterData = parametersJsonData[parameterId];

        if (parameterData) {
            const liveValue = liveDataObj.liveValue;
            if (liveValue) {
                const ruleConfigsFromParameterIdArray = getRuleConfigsFromParameterId(parameterId); // get rule from parameter id
                for (let ruleId of ruleConfigsFromParameterIdArray) {
                    const ruleConfigJsonData = getRuleConfigsJsonData();
                    const ruleData = ruleConfigJsonData[ruleId];

                    const isConditionTriggered = checkConditionsOfRule(liveDataObj, ruleData); // check rule
                    if (isConditionTriggered) {
                        const causesFromRuleIdArray = getAllCausesWhichIncludesGivenRule(ruleId); // get all causes for given rule
                        causesFromRuleIdArray.forEach(function (causeId) {
                            // retrieve cause information if signal rule is primary
                            if (ruleData.isPrimary) {
                                let isShowCause = false;

                                const causeReferencesRuleConfigJsonData = getCauseReferencesRuleConfigByKey(causeId); // get rules by cause id
                                let rulesArray = causeReferencesRuleConfigJsonData[0].split(/ *(?:[&|]{2}) */g);
                                rulesArray.forEach(function (rId) { // iterating rules one by one
                                    if (rId !== ruleId && !isShowCause) {
                                        const rData = ruleConfigJsonData[rId];
                                        // retrieve data for this rule and pass it to below function
                                        // for this need to write one layer



                                        isShowCause = checkConditionsOfRule(liveDataObj, rData);
                                    }
                                });
                                // if (isShowCause) {
                                if (true) {
                                    causesResponseData.push(causeId);       // add cause as all primary conditions are met

                                    const failureAdvisoriesFromCausesArray = getFailureAdvisoriesFromCauses([causeId]); // get failure advisories for given cause id
                                    failureAdvisoriesFromCausesArray.forEach(function (failureAdvisoryKey) {
                                        const failureAdvisoriesReferenceCausesArray = getFailureAdvisoryReferenceCauseByKey(failureAdvisoryKey); // get causes list in array for given failure advisory

                                        failureAdvisoriesReferenceCausesArray.forEach(cKey => { // iterating causes one by one
                                            let isRuleTriggered = false;
                                            const causeReferencesRuleConfigJsonData = getCauseReferencesRuleConfigByKey(cKey); // get rules by cause id
                                            let rulesArray = causeReferencesRuleConfigJsonData[0].split(/ *(?:[&|]{2}) */g);
                                            rulesArray.forEach(function (rId) { // iterating rules one by one
                                                if (rId !== ruleId && !isRuleTriggered) {
                                                    const rData = ruleConfigJsonData[rId];
                                                    isRuleTriggered = checkConditionsOfRule(liveDataObj, rData);
                                                }
                                            });
                                            if (isRuleTriggered) {
                                                causesResponseData.push(cKey);
                                            }
                                        });
                                        failureAdvisoriesResponseData.push(failureAdvisoryKey);
                                    });
                                }
                            }
                        });
                    }
                }
            }
        }
    }

    // response["useCases"] = useCasesResponseData;
    response["failureAdvisories"] = failureAdvisoriesResponseData;
    response["causes"] = causesResponseData;

    return response;
};

const getCausesFromParameter = (parameterId) => {
    const causesReferenceParametersJsonData = getCausesReferencesRuleConfigJsonData();
    let causesArray = [];

    if (parameterId) {
        for (const key in causesReferenceParametersJsonData) {
            if (causesReferenceParametersJsonData.hasOwnProperty(key)) {
                const causesReferenceParametersJsonDatum = causesReferenceParametersJsonData[key];
                if (causesReferenceParametersJsonDatum.includes(parameterId)) {
                    causesArray.push(key);
                }
            }
        }
    }

    return Array.from(new Set(causesArray));
};

const getAllCausesWhichIncludesGivenRule = (ruleId) => {
    const causesReferencesRuleConfigJsonData = getCausesReferencesRuleConfigJsonData();
    let causesArray = [];

    if (ruleId) {
        for (const key in causesReferencesRuleConfigJsonData) {
            if (causesReferencesRuleConfigJsonData.hasOwnProperty(key)) {
                const causesReferenceParametersJsonDatum = causesReferencesRuleConfigJsonData[key];
                if (causesReferenceParametersJsonDatum[0].includes(ruleId)) {
                    causesArray.push(key);
                }
            }
        }
    }

    return Array.from(new Set(causesArray));
};

const getParametersFromCause = (causeId) => {
    const causesReferenceParametersJsonData = getCausesReferencesRuleConfigJsonData();
    let parametersArray = [];

    if (causeId) {
        if (causesReferenceParametersJsonData.hasOwnProperty(causeId)) {
            parametersArray = causesReferenceParametersJsonData[causeId];
        }
    }

    return parametersArray;
};

const getFailureAdvisoriesFromCauses = (causesArray) => {
    const failureAdvisoriesReferenceCausesJsonData = getFailureAdvisoriesReferencesCausesJsonData();
    let failureAdvisoriesArray = [];

    for (const key in failureAdvisoriesReferenceCausesJsonData) {
        if (failureAdvisoriesReferenceCausesJsonData.hasOwnProperty(key)) {
            const failureAdvisoriesReferenceCausesJsonDatum = failureAdvisoriesReferenceCausesJsonData[key];
            causesArray.forEach(function (cause) {
                if (failureAdvisoriesReferenceCausesJsonDatum.includes(cause)) {
                    failureAdvisoriesArray.push(key);
                }
            });
        }
    }

    return Array.from(new Set(failureAdvisoriesArray));
};

const getUseCasesFromFailureAdvisories = (failureAdvisoriesArray) => {
    const useCasesReferenceFailureAdvisoriesJsonData = getUseCasesReferencesFailureAdvisoriesJsonData();
    let useCasesArray = [];

    for (const key in useCasesReferenceFailureAdvisoriesJsonData) {
        if (useCasesReferenceFailureAdvisoriesJsonData.hasOwnProperty(key)) {
            const failureAdvisoriesReferenceCausesJsonDatum = useCasesReferenceFailureAdvisoriesJsonData[key];
            failureAdvisoriesArray.forEach(function (failureAdvisory) {
                if (failureAdvisoriesReferenceCausesJsonDatum.includes(failureAdvisory)) {
                    useCasesArray.push(key);
                }
            });
        }
    }

    return Array.from(new Set(useCasesArray));
};

const getRuleConfigForFailureAdvisory = (failureAdvisoryId) => {
    const ruleConfigJsonData = getRuleConfigsJsonData();

    if (ruleConfigJsonData.hasOwnProperty(failureAdvisoryId)) {
        return ruleConfigJsonData[failureAdvisoryId];
    }
};

const checkConditionsOfParameter = (liveParameterObj, configuredParameterObj) => {
    return detectAndExecuteParameterCondition(liveParameterObj, configuredParameterObj);
};

const checkConditionsOfRule = (liveParameterObj, parameterRuleObj) => {
    return detectAndExecuteRuleCondition(liveParameterObj, parameterRuleObj);
};

const getRuleConfigsFromParameterId = (parameterId) => {
    const parametersReferencesRuleConfigJsonData = getParametersReferencesRuleConfigJsonData();
    let ruleConfigArray = [];

    if (parameterId) {
        if (parametersReferencesRuleConfigJsonData.hasOwnProperty(parameterId)) {
            ruleConfigArray = parametersReferencesRuleConfigJsonData[parameterId];
        }
    }

    return ruleConfigArray;
};

module.exports = {
    checkLiveValue: checkLiveValue,
    getCausesFromParameter: getCausesFromParameter,
    getParametersFromCause: getParametersFromCause,
    getFailureAdvisoryFromCause: getFailureAdvisoriesFromCauses,
    getUseCaseFromFailureAdvisory: getUseCasesFromFailureAdvisories
};
