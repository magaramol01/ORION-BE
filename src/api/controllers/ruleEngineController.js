'use strict';

const FailureAdvisoriesModel = require("../models/failureAdvisoriesModel");
const CausesModel = require("../models/causesModel");
const ParametersModel = require("../models/parametersModel");
const RuleConfigsModel = require("../models/ruleConfigsModel");
const RuleBlocksModel = require("../models/ruleBlocksModel");

const RuleChecker = require("../validations/RuleChecker");
const ComparatorChecker = require("../validations/ComparatorChecker");

const RuleEngineConstants = require('../utils/constants');
const Tokenizer = require("../validations/Tokenizer");

class RuleEngineController {

    constructor() {
        // received signal data
        this.parameter = {};

        this.useCasesResponseData = [];
        this.failureAdvisoriesResponseData = [];
        this.causesResponseData = [];

        // trackers for looping
        this.executedRuleBlocks = {};

        this.failureAdvisoriesJsonData = FailureAdvisoriesModel.getFailureAdvisoriesJsonData();
        this.causesJsonData = CausesModel.getCausesJsonData();
        this.parametersJsonData = ParametersModel.getParametersJsonData();
        this.ruleBlocksJsonData = RuleBlocksModel.getRuleBlocksJsonData();
        this.ruleConfigsReferencesRuleBlocksJsonData = RuleConfigsModel.getRuleConfigsReferencesRuleBlocksJsonData();
    }

    checkLiveValue(requestObj) {
        let response = {};

        this.parameter = requestObj.body;
        const parameterId = this.parameter.parameterId;

        if (parameterId) {

            const parameterData = this.parametersJsonData[parameterId];

            if (parameterData) {
                const liveValue = this.parameter.liveValue;
                if (liveValue) {
                    const ruleConfigsFromParameterIdArray = this.getRuleConfigsFromParameterId(parameterId); // get rule from parameter id

                    for (let ruleId of ruleConfigsFromParameterIdArray) {
                        const ruleBlockArrayForRuleId = this.ruleConfigsReferencesRuleBlocksJsonData[ruleId];

                        for (let ruleBlockId of ruleBlockArrayForRuleId) {
                            const isRuleBlockExecuted = this.executedRuleBlocks.hasOwnProperty(ruleBlockId);
                            if (isRuleBlockExecuted) {
                                continue;
                            }

                            const ruleBlock = this.ruleBlocksJsonData[ruleBlockId];
                            const rulesForRuleBlock = ruleBlock.rules;

                            let isRuleBlockConditionTriggered = this.evaluateRuleBlock(rulesForRuleBlock);

                            if (!isRuleBlockExecuted) {
                                this.executedRuleBlocks[ruleBlockId] = isRuleBlockConditionTriggered;
                            }

                            if (isRuleBlockConditionTriggered) {
                                const allCausesForGivenRuleBlock = this.getAllCausesWhichIncludesGivenRuleBlock(ruleBlockId);
                                for (let causeId in allCausesForGivenRuleBlock) {
                                    if (!allCausesForGivenRuleBlock.hasOwnProperty(causeId)) {
                                        continue;
                                    }

                                    const causeChainRuleExpression = allCausesForGivenRuleBlock[causeId];
                                    const isRuleExpressionTriggered = this.evaluateChainRuleExpression(causeChainRuleExpression);

                                    if (isRuleExpressionTriggered) {
                                        this.causesResponseData.push(this.causesJsonData[causeId]); // add cause as any of the added rule conditions is met

                                        const failureAdvisoriesFromCausesArray = this.getFailureAdvisoriesFromCauses([causeId]); // get failure advisories for given cause id
                                        failureAdvisoriesFromCausesArray.forEach(function (failureAdvisoryKey) {
                                            const failureAdvisoriesReferenceCausesArray = FailureAdvisoriesModel.getFailureAdvisoryReferenceCauseByKey(failureAdvisoryKey); // get causes list in array for given failure advisory

                                            failureAdvisoriesReferenceCausesArray.forEach(cKey => { // iterating causes one by one
                                                let isRuleTriggered = false;
                                                const causeReferencesRuleConfigJsonData = CausesModel.getCauseReferencesRuleConfigByKey(cKey); // get rules by cause id

                                                if (ruleBlockId !== causeReferencesRuleConfigJsonData) {
                                                    let isRuleBlockTriggered = false;

                                                    let ruleBlocksArray = causeReferencesRuleConfigJsonData.split(/ *(?:[&|]{2}) */g);

                                                    ruleBlocksArray.forEach(function (rBlockId) { // iterating rules one by one
                                                        if (rBlockId !== ruleBlockId && !isRuleTriggered) {

                                                            const ruleBlockData = this.ruleBlocksJsonData[rBlockId];
                                                            const rulesForRuleBlockData = ruleBlockData.rules;

                                                            isRuleBlockTriggered = this.evaluateRuleBlock(rulesForRuleBlockData, this.parameter);
                                                        }
                                                    }.bind(this));
                                                    if (isRuleBlockTriggered) {
                                                        this.causesResponseData.push(cKey);
                                                    }
                                                }
                                            });
                                            this.failureAdvisoriesResponseData.push(this.failureAdvisoriesJsonData[failureAdvisoryKey]);
                                        }.bind(this));
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // ideally no duplicate values should be there...
        // work on this...
        // response["useCases"] = this.useCasesResponseData;
        response["failureAdvisories"] = this.failureAdvisoriesResponseData;
        response["causes"] = this.causesResponseData;

        // response["useCases"] = Array.from(new Set(this.useCasesResponseData));
        // response["failureAdvisories"] = Array.from(new Set(this.failureAdvisoriesResponseData));
        // response["causes"] = Array.from(new Set(this.causesResponseData));

        return response;
    }

    syncAllJsonFiles() {
        FailureAdvisoriesModel.syncFailureAdvisoriesJsonData();
        FailureAdvisoriesModel.syncFailureAdvisoriesReferencesCausesJsonData();
        CausesModel.syncCausesJsonData();
        CausesModel.syncCausesReferencesRuleConfigJsonData();
        ParametersModel.syncParametersJsonData();
        ParametersModel.syncParametersReferencesRuleConfigJsonData();
        RuleConfigsModel.syncRuleConfigsJsonData();
        RuleBlocksModel.syncRuleBlocksJsonData();
    }

    getRuleConfigsFromParameterId(parameterId) {
        const parametersReferencesRuleConfigJsonData = ParametersModel.getParametersReferencesRuleConfigJsonData();
        let ruleConfigArray = [];

        if (parameterId) {
            if (parametersReferencesRuleConfigJsonData.hasOwnProperty(parameterId)) {
                ruleConfigArray = parametersReferencesRuleConfigJsonData[parameterId];
            }
        }

        return ruleConfigArray;
    }

    getAllCausesWhichIncludesGivenRuleBlock(ruleBlockId) {
        const causesReferencesRuleConfigJsonData = CausesModel.getCausesReferencesRuleConfigJsonData();
        let causesJson = {};

        if (ruleBlockId) {
            for (const key in causesReferencesRuleConfigJsonData) {
                if (causesReferencesRuleConfigJsonData.hasOwnProperty(key)) {
                    const causesReferenceParametersJsonDatum = causesReferencesRuleConfigJsonData[key];
                    if (causesReferenceParametersJsonDatum.includes(ruleBlockId)) {
                        causesJson[key] = causesReferenceParametersJsonDatum;
                    }
                }
            }
        }

        return causesJson;
    }

    getFailureAdvisoriesFromCauses(causesArray) {
        const failureAdvisoriesReferenceCausesJsonData = FailureAdvisoriesModel.getFailureAdvisoriesReferencesCausesJsonData();
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
    }

    // method expects array of rules
    evaluateRuleBlock(ruleBlockData) {
        // all conditions are OR in rule block as of now...
        let isRuleBlockConditionTriggered = false;
        const ruleConfigJsonData = RuleConfigsModel.getRuleConfigsJsonData();

        for (let ruleId in ruleBlockData) {
            if (!isRuleBlockConditionTriggered && ruleBlockData.hasOwnProperty(ruleId)) {
                const ruleData = ruleConfigJsonData[ruleBlockData[ruleId]];
                isRuleBlockConditionTriggered = this.checkConditionsOfRule(this.parameter, ruleData); // check rule
            }
        }
        return isRuleBlockConditionTriggered;
    }

    // this method will throw true or false value
    // whether this rule chain executed all conditions or not...
    // ruleChainExpression array will hold like = '(RB1 && RB2) || RB3 || (RB4 || RB5)';
    evaluateChainRuleExpression(ruleChainExpression) {
        let finalExpressionToBeEvaluated = [];

        const expressionsTokenArray = new Tokenizer().tokenize(ruleChainExpression);

        for (let i in expressionsTokenArray) {
            const expressionsToken = expressionsTokenArray[i];
            const expressionsTokenType = expressionsToken.type;
            const expressionsTokenValue = expressionsToken.value;

            if (expressionsToken && expressionsTokenType !== "EOL" && expressionsTokenType !== "EOF") {
                if (expressionsTokenType === "STR_NUM") {
                    const ruleBlockId = expressionsTokenValue;
                    const ruleBlock = this.ruleBlocksJsonData[ruleBlockId];
                    const rulesForRuleBlock = ruleBlock.rules;

                    const isRuleBlockExecuted = this.executedRuleBlocks.hasOwnProperty(ruleBlockId);
                    let isRuleBlockConditionTriggered;
                    if (isRuleBlockExecuted) {
                        isRuleBlockConditionTriggered = this.executedRuleBlocks[ruleBlockId];
                    } else {
                        isRuleBlockConditionTriggered = this.evaluateRuleBlock(rulesForRuleBlock, this.parameter);
                        this.executedRuleBlocks[ruleBlockId] = isRuleBlockConditionTriggered;
                    }
                    finalExpressionToBeEvaluated.push(isRuleBlockConditionTriggered);
                } else {
                    finalExpressionToBeEvaluated.push(expressionsTokenValue);
                }
            }
        }

        return this.processConditions2(finalExpressionToBeEvaluated);
    }

    checkConditionsOfRule(liveParameterObj, parameterRuleObj) {
        return RuleChecker.detectAndExecuteRuleCondition(liveParameterObj, parameterRuleObj);
    }

    processConditions(conditionalStr) {
        let result, op, i, par, idx, token;

        for (i = 0; i < conditionalStr.length; i++) {
            token = conditionalStr[i];
            if (token === '&&' || token === '||') {
                op = token;
            } else {
                if (token === '(') {
                    for (par = 0, idx = i; par; idx++) {  //handle nested parentheses
                        if (conditionalStr[idx] === '(') par++;
                        else if (conditionalStr[idx] === ')') par--;
                    }
                    token = this.processConditions(conditionalStr.slice(i + 1, idx));
                    i = idx + 1;
                }

                if (op === '&&') result = result && token;
                else if (op === '||') result = result || token;
                else result = token;
            }
        }

        return result;
    }

    processConditions1(conditionalStr) {
        return eval(conditionalStr.join(''));
    }

    processConditions2(conditionalStr) {
        function calculate(a) {
            while (a.length > 2) {
                a.splice(0, 3, op[a[1]](a[0], a[2]));
            }
            return a[0];
        }

        let op = {
                '&&': function (a, b) { return a && b; },
                '||': function (a, b) { return a || b; }
            },
            array = [[]],
            level = 0;

        conditionalStr.forEach(function (a) {
            if (a === '(') {
                ++level;
                array[level] = [];
                return;
            }
            if (a === ')') {
                --level;
                array[level].push(calculate(array[level + 1]));
                return;
            }
            array[level].push(a);
        });
        return calculate(array[0]);
    }

}

module.exports = RuleEngineController;
