'use strict';

const RuleConfigsModel = require("../models/ruleConfigsModel");
const RuleBlocksModel = require("../models/ruleBlocksModel");
const ParametersModel = require("../models/parametersModel");
const ConstantParameterModel = require("../models/constantParameterModel");
const RuleChecker = require("../validations/RuleChecker");
const {Util} = require("../utils/util");

class RuleExecutionByRuleBlockSingleton {

    constructor() {
        this.liveData = {};
        this.constantParameterJsonData = {};
        this.constantParameterLatestValuesById = {};
        this.ruleBlockExecutionDataArr = {};
    }

    getConstantAndStore (){

    }

    setConstantData(data){
        this.constantParameterJsonData = data;
    }

    ruleBlockExecutionFromLiveData(liveData) {
        this.liveData = liveData;
        const ruleBlocksJsonData = RuleBlocksModel.getRuleBlocksJsonData();

        for (let ruleBlockId in ruleBlocksJsonData) {
            if (!ruleBlocksJsonData.hasOwnProperty(ruleBlockId)) {
                continue;
            }

            const ruleBlock = ruleBlocksJsonData[ruleBlockId];
            let rulesArr = ruleBlock.rules;

            let occurrences = ruleBlock.evaluationMethod.noOfOccurrences.isChecked ? ruleBlock.evaluationMethod.noOfOccurrences.value : 1;
            const isRuleBlockExecuted = this.evaluateRuleBlock(rulesArr);

            if (isRuleBlockExecuted) {
                if (this.ruleBlockExecutionDataArr.hasOwnProperty(ruleBlockId)) {
                    let ruleDataOfExecution = this.ruleBlockExecutionDataArr[ruleBlockId];
                    if (Util.checkExecutionStartTimeWithCurrentTime(ruleDataOfExecution.executionStartTime, ruleDataOfExecution.periodicityTime, ruleDataOfExecution.periodicityUnit)) {
                        ruleDataOfExecution.executedOccurrence = 0;
                        ruleDataOfExecution.isExecuted = false;
                    }
                    let occurrence = ruleDataOfExecution.executionOccurrence;
                    if (occurrence === ruleDataOfExecution.executedOccurrence + 1) {
                        ruleDataOfExecution.executedOccurrence = 0;
                        ruleDataOfExecution.isExecuted = true;
                    } else {
                        ruleDataOfExecution.isExecuted = false;
                    }

                    this.ruleBlockExecutionDataArr[ruleBlockId] = ruleDataOfExecution;
                } else {
                    let ruleDataOfExecution = {
                        "executionStartTime": Util.getCurrentDateTime(),
                        "periodicityTime": ruleBlocksJsonData[ruleBlockId].evaluationMethod.periodicity.value,
                        "periodicityUnit": ruleBlocksJsonData[ruleBlockId].evaluationMethod.periodicity.unit,
                        "executionOccurrence": occurrences,
                        "executedOccurrence": 1,
                        "isExecuted": false
                    };
                    this.ruleBlockExecutionDataArr[ruleBlockId] = ruleDataOfExecution;
                }
            } else {
                if (!this.ruleBlockExecutionDataArr.hasOwnProperty(ruleBlockId)) {
                    let ruleDataOfExecution = {
                        "executionStartTime": Util.getCurrentDateTime(),
                        "periodicityTime": ruleBlocksJsonData[ruleBlockId].evaluationMethod.periodicity.value,
                        "periodicityUnit": ruleBlocksJsonData[ruleBlockId].evaluationMethod.periodicity.unit,
                        "executionOccurrence": occurrences,
                        "executedOccurrence": 0,
                        "isExecuted": false
                    };
                    if (Util.checkExecutionStartTimeWithCurrentTime(ruleDataOfExecution.executionStartTime, ruleDataOfExecution.periodicityTime, ruleDataOfExecution.periodicityUnit)) {
                        ruleDataOfExecution.executedOccurrence = 0;
                        ruleDataOfExecution.isExecuted = false;
                    }
                    this.ruleBlockExecutionDataArr[ruleBlockId] = ruleDataOfExecution;
                }
            }
        }

        debugger
        //
    }

    // all conditions are OR in rule block as of now...
    evaluateRuleBlock(ruleBlockData) {
        let isRuleBlockConditionTriggered = false;
        const ruleConfigJsonData = RuleConfigsModel.getRuleConfigsJsonData();
        const parameterJsonData = ParametersModel.getParametersJsonData();

        for (let ruleId in ruleBlockData) {
            if (!isRuleBlockConditionTriggered && ruleBlockData.hasOwnProperty(ruleId)) {
                const ruleData = ruleConfigJsonData[ruleBlockData[ruleId]];
                if (parameterJsonData.hasOwnProperty(ruleData.parameterId)) {
                    //This is Live Parameter

                    let liveDataObject = {
                        liveValue: this.liveData [parameterJsonData[ruleData.parameterId].rtdasMapping.split(":")[1]],//todo rtdas name and field
                        parameterId: ruleData.parameterId
                    };
                    isRuleBlockConditionTriggered = this.checkConditionsOfRule(liveDataObject, ruleData); // check rule
                }
                // else if ( this.constantParameterJsonData.hasOwnProperty ( ruleData.parameterId ) ) {
                //     //This is Constant Parameter
                //     let liveDataObject = {
                //         liveValue : this.constantParameterLatestValuesById[ ruleData.parameterId ] ,
                //         parameterId : ruleData.parameterId
                //     }
                //     isRuleBlockConditionTriggered = this.checkConditionsOfRule ( liveDataObject , ruleData ); // check rule
                // }
            }
        }
        return isRuleBlockConditionTriggered;
    }

    checkConditionsOfRule(liveParameterObj, parameterRuleObj) {
        return RuleChecker.detectAndExecuteRuleCondition(liveParameterObj, parameterRuleObj);
    }

}

class Singleton {

    constructor() {
        if (!Singleton.instance) {
            Singleton.instance = new RuleExecutionByRuleBlockSingleton();
        }
    }

    getInstance() {
        return Singleton.instance;
    }

}

module.exports = Singleton;
