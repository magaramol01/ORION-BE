'use strict';

const {getFailureAdvisoriesJsonData, getFailureAdvisoriesReferencesCausesJsonData} = require("../models/failureAdvisoriesModel");
const {getCausesJsonData, getCausesReferencesRuleConfigJsonData} = require("../models/causesModel");
const {getParametersJsonData} = require("../models/parametersModel");
const {getRuleConfigsJsonData} = require("../models/ruleConfigsModel");

const getAllData = () => {
    let data = {};

    const useCasesJsonData = getUseCasesJsonData();
    const useCasesReferenceFailureAdvisoriesJsonData = getUseCasesReferencesFailureAdvisoriesJsonData();

    const failureAdvisoriesJsonData = getFailureAdvisoriesJsonData();
    const failureAdvisoriesReferenceCausesJsonData = getFailureAdvisoriesReferencesCausesJsonData();

    const causesJsonData = getCausesJsonData();
    const causesReferenceParametersJsonData = getCausesReferencesRuleConfigJsonData();

    const parametersJsonData = getParametersJsonData();

    const ruleConfigJsonData = getRuleConfigsJsonData();

    for (const useCaseKey in useCasesJsonData) {                                                                                        // use cases
        if (useCasesJsonData.hasOwnProperty(useCaseKey)) {
            const useCasesJsonDatum = useCasesJsonData[useCaseKey];

            let failureAdvisoriesDataArray = [];

            for (const ucrfajKey in useCasesReferenceFailureAdvisoriesJsonData) {                                                       // use cases -> failure advisory
               if (useCasesReferenceFailureAdvisoriesJsonData.hasOwnProperty(ucrfajKey)) {
                   const useCasesReferenceFailureAdvisoriesArray = useCasesReferenceFailureAdvisoriesJsonData[ucrfajKey];
                   useCasesReferenceFailureAdvisoriesArray.forEach(faKey => {
                       const failureAdvisoriesJsonDatum = failureAdvisoriesJsonData[faKey];
                       let failureAdvisoriesData = {};

                       let causesDataArray = [];

                       for (const farcjKey in failureAdvisoriesReferenceCausesJsonData) {                                              // failure advisory -> causes
                            if (failureAdvisoriesReferenceCausesJsonData.hasOwnProperty(farcjKey)) {
                                const failureAdvisoriesReferenceCausesArray = failureAdvisoriesReferenceCausesJsonData[farcjKey];
                                failureAdvisoriesReferenceCausesArray.forEach(cKey => {
                                    let causesData = {};
                                    const causesJsonDatum = causesJsonData[cKey];

                                    let parametersDataArray = [];

                                    for (const crpjkey in causesReferenceParametersJsonData) {                                          // causes -> parameters
                                        if (causesReferenceParametersJsonData.hasOwnProperty(crpjkey)) {
                                            const causesReferenceParametersArray = causesReferenceParametersJsonData[crpjkey];
                                            let parametersData = {};

                                            causesReferenceParametersArray.forEach(pKey => {
                                                if (pKey) {
                                                    const parametersJsonDatum = parametersJsonData[pKey];
                                                    if (parametersJsonDatum) {
                                                        parametersData[pKey] = parametersJsonDatum;
                                                    }
                                                }
                                            });
                                            if (Object.keys(parametersData).length > 0) {
                                                parametersDataArray.push(parametersData);
                                            }
                                        }
                                    }

                                    causesData[cKey] = {
                                        "description": causesJsonDatum,
                                        "parameters": parametersDataArray
                                    };
                                    causesDataArray.push(causesData)
                                });
                            }
                       }

                       failureAdvisoriesData[faKey] = {
                           "description": failureAdvisoriesJsonDatum,
                           "causes": causesDataArray
                       };
                       failureAdvisoriesDataArray.push(failureAdvisoriesData);
                   });
               }
            }

            data[useCaseKey] = {
                "description": useCasesJsonDatum,
                "failureAdvisories": failureAdvisoriesDataArray
            }

        }
    }

    return data;
};

module.exports = {
    getAllData: getAllData
};
