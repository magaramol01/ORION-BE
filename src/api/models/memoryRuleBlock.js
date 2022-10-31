'use strict';

const RuleConfigsModel = require("../models/ruleConfigsModel");
const ParametersModel = require("../models/parametersModel");
const ConstantParameterModel = require("../models/constantParameterModel");
const RuleChecker = require("../validations/RuleChecker");

class MemoryRuleBlock {

    constructor(ruleBlockId, ruleBlockData, ruleESC) {
        this.ruleBlockId = ruleBlockId;
        this.ruleBlockData = ruleBlockData;
        this.ruleESC = ruleESC;

        this.initializeFlags();
        this.scheduleRuleBlockExecution();
    }

    setRuleBlockData(ruleBlockData) {
        this.ruleBlockData = ruleBlockData;
    }

    getRuleBlockData() {
        return this.ruleBlockData;
    }

    initializeFlags() {
        this.executedRule = "";
        this.triggeredOccurence = 0;
        this.sum = 0;
        this.numArray = [];
        this.incrDescArray = [];
        this.efCount = 0;
        this.success = 0;
        this.failure = 0;
        this.lastExecutedLiveParameterDataTimestamp = ""
    }

    scheduleRuleBlockExecution() {
        const periodicity = this.ruleBlockData.evaluationMethod.periodicity;
        const periodicityInMS = this.getTimeInMilliSeconds(periodicity);

        this.intervalId = setInterval(this.handleRuleBlockExecution.bind(this), periodicityInMS);
    }

    reScheduleRuleBlockExecution() {
        this.removeInterval(this.intervalId);
        this.scheduleRuleBlockExecution();
    }

    async handleRuleBlockExecution() {
        const ruleBlock = this.ruleBlockData;
        let rulesArr = ruleBlock.rules;

        // if rule block already executed for particular timestamp then dont execute further
        if (this.lastExecutedLiveParameterDataTimestamp === this.ruleESC.parametersLiveData.Timestamp) {
            return
        }

        // if (ruleBlock.isActive) {
        if (ruleBlock.isActivated) {
            const ruleBlockExecutedInfo = await this.evaluateRuleBlock(rulesArr);
            const isRuleBlockExecuted = ruleBlockExecutedInfo.isRuleBlockConditionTriggered;

            if (isRuleBlockExecuted) {
                const noOfOccurrence = ruleBlock.evaluationMethod.noOfOccurrences;
                const evaluationFactor = ruleBlock.evaluationFactor;
                let isOneOfEvaluationTriggered = false;

                if (noOfOccurrence.isChecked && this.triggeredOccurence < parseInt(noOfOccurrence.value)) {
                    this.triggeredOccurence += 1;

                    if (evaluationFactor.isEvaluationFactorChecked) {
                        const evaluationType = evaluationFactor.type;
                        const noOfOccurrenceFromOriginalRule = parseInt(noOfOccurrence.value);
                        const triggeredRulesSameasNoOfOccurences = this.triggeredOccurence == noOfOccurrenceFromOriginalRule;
                        if (evaluationType === "IncreasingContinuasly") {
                            if(triggeredRulesSameasNoOfOccurences) {
                                this.incrDescArray.push(parseInt(ruleBlockExecutedInfo.liveValues.liveValue));
                                let IncreasingContinuaslyValue = true;
                                let allValuesArray = this.incrDescArray;
                                if(allValuesArray.length>1){
                                    for(let i=1;i<allValuesArray.length;i++){
                                        if(allValuesArray[i]-allValuesArray[i-1]<0){
                                            IncreasingContinuaslyValue = false;
                                            break;
                                        }
                                    }
                                    if(IncreasingContinuaslyValue){
                                        isOneOfEvaluationTriggered = true;
                                    }
                                }
                                this.triggeredOccurence = 0;
                                this.incrDescArray = [];
                            } else {
                                this.incrDescArray.push(parseInt(ruleBlockExecutedInfo.liveValues.liveValue));
                            }
                        }
                        if (evaluationType === "DecreasingContinuasly") {
                            if(triggeredRulesSameasNoOfOccurences) {
                                this.incrDescArray.push(parseInt(ruleBlockExecutedInfo.liveValues.liveValue));
                                let DecreasingContinuaslyValue = true;
                                let allValuesArray = this.incrDescArray;
                                if(allValuesArray.length>1){
                                    for(let i=1;i<allValuesArray.length;i++){
                                        if(allValuesArray[i]-allValuesArray[i-1]>0){
                                            DecreasingContinuaslyValue = false;
                                            break;
                                        }
                                    }
                                    if(DecreasingContinuaslyValue){
                                        isOneOfEvaluationTriggered = true;
                                    }
                                }
                                this.triggeredOccurence = 0;
                                this.incrDescArray = [];
                            } else {
                                this.incrDescArray.push(parseInt(ruleBlockExecutedInfo.liveValues.liveValue));
                            }
                        }
                        if (evaluationType === "Increasing") {
                            if(triggeredRulesSameasNoOfOccurences) {
                                this.incrDescArray.push(parseInt(ruleBlockExecutedInfo.liveValues.liveValue));
                                let increasingCount = 0;
                                let allValuesArray = this.incrDescArray;
                                if(allValuesArray.length>1){
                                    for(let i=1;i<allValuesArray.length;i++){
                                        const tempValue = allValuesArray[i]-allValuesArray[i-1];
                                        if(i==1){
                                            increasingCount = tempValue;
                                        } else {
                                            increasingCount = increasingCount + tempValue;
                                        }
                                    }
                                    if(increasingCount>0){
                                        isOneOfEvaluationTriggered = true;
                                    }
                                }
                                this.triggeredOccurence = 0;
                                this.incrDescArray = [];
                            } else {
                                this.incrDescArray.push(parseInt(ruleBlockExecutedInfo.liveValues.liveValue));
                            }
                        }
                        if (evaluationType === "Decreasing") {
                            if(triggeredRulesSameasNoOfOccurences) {
                                this.incrDescArray.push(parseInt(ruleBlockExecutedInfo.liveValues.liveValue));
                                let decreasingCount = 0;
                                let allValuesArray = this.incrDescArray;
                                if(allValuesArray.length>1){
                                    for(let i=1;i<allValuesArray.length;i++){
                                        const tempValue = allValuesArray[i]-allValuesArray[i-1];
                                        if(i==1){
                                            decreasingCount = tempValue;
                                        } else {
                                            decreasingCount = decreasingCount + tempValue;
                                        }
                                    }
                                    if(decreasingCount<0){
                                        isOneOfEvaluationTriggered = true;
                                    }
                                }
                                this.triggeredOccurence = 0;
                                this.incrDescArray = [];
                            } else {
                                this.incrDescArray.push(parseInt(ruleBlockExecutedInfo.liveValues.liveValue));
                            }
                        }
                        if (evaluationType === "Probability") {
                            const noOfOccurrenceV = parseInt(noOfOccurrence.value);
                            const probabilityUpperValue = Math.round(noOfOccurrenceV *(evaluationFactor.value/100));
                            if (this.triggeredOccurence === probabilityUpperValue) {
                                isOneOfEvaluationTriggered = true;
                            }
                        }
                        if (evaluationType === "Count") {
                            if (this.efCount < parseInt(evaluationFactor.value) - 1) {
                                this.efCount += 1;
                            } else {
                                isOneOfEvaluationTriggered = true;
                            }
                        }
                        if (evaluationType === "Standard Deviation") {
                            const noOfOccurrenceV = parseInt(noOfOccurrence.value)-1;
                            const triggeredOccure = this.triggeredOccurence;
                            this.numArray.push(parseInt(ruleBlockExecutedInfo.liveValues.liveValue));
                            this.sum = this.sum+parseInt(ruleBlockExecutedInfo.liveValues.liveValue);
                            if(triggeredOccure==noOfOccurrenceV){
                                let standardDeviation = 0;
                                const mean = this.sum/parseInt(noOfOccurrence.value);
                                let numArray = this.numArray;
                                for(let i=0;i<numArray.length-1;i++) {
                                    standardDeviation += Math.pow(numArray[i] - mean, 2);
                                }
                                if(standardDeviation!=evaluationFactor.value){
                                    isOneOfEvaluationTriggered = true;
                                }
                            }
                        }
                        if (evaluationType === "Sum") {
                            const noOfOccurrenceV = parseInt(noOfOccurrence.value)-1;
                            const triggeredOccure = this.triggeredOccurence;
                            this.sum = this.sum+parseInt(ruleBlockExecutedInfo.liveValues.liveValue);
                            if(triggeredOccure==noOfOccurrenceV){
                                if(this.sum!=evaluationFactor.value){
                                    isOneOfEvaluationTriggered = true;
                                }
                            }
                        }
                        if (evaluationType === "Average") {
                            const noOfOccurrenceV = parseInt(noOfOccurrence.value)-1;
                            const triggeredOccure = this.triggeredOccurence;
                            this.sum = this.sum+parseInt(ruleBlockExecutedInfo.liveValues.liveValue);
                            if(triggeredOccure==noOfOccurrenceV){
                                if((this.sum/parseInt(noOfOccurrence.value))!=evaluationFactor.value){
                                    isOneOfEvaluationTriggered = true;
                                }
                            }
                            isOneOfEvaluationTriggered = true;
                        }
                    }
                } else {
                    isOneOfEvaluationTriggered = true;
                }

                if (isOneOfEvaluationTriggered) {
                    this.executedRule = ruleBlockExecutedInfo.triggeredRule;
                    let executedRuleBlockHolder = this.ruleESC.getExecutedRuleBlockHolder();
                    this.liveData = ruleBlockExecutedInfo.liveValues;
                    executedRuleBlockHolder.push(this);

                    this.lastExecutedLiveParameterDataTimestamp = this.ruleESC.parametersLiveData.Timestamp;
                }

            }
        }
    }

    // as of now all conditions in rule block are combined with OR
    async evaluateRuleBlock(rulesArr) {
        let isRuleBlockConditionTriggered = false;
        let triggeredRule;
        let liveDataObject = {}

        const ruleConfigJsonData =  await RuleConfigsModel.getRuleConfigsJsonData();
        const parameterJsonData = await ParametersModel.getParametersJsonData();
        const constantParameterJsonData = await ConstantParameterModel.getConstantParametersJsonData();

        for (let ruleId in rulesArr) {
            if (!isRuleBlockConditionTriggered && rulesArr.hasOwnProperty(ruleId)) {
                const ruleData = ruleConfigJsonData[rulesArr[ruleId]];
                // if (ruleData.isActive) {
                if (true) {
                    if (parameterJsonData.hasOwnProperty(ruleData.parameterId)) {
                        liveDataObject = {
                            // liveValue: this.ruleESC.parametersLiveData["AlertData"][0][ruleData.parameterId],
                            // liveValue: this.ruleESC.parametersLiveData[parameterJsonData[ruleData.parameterId].rtdasMapping.replace("stream:","")],
                            // @Ajay: why stream???
                            liveValue: this.ruleESC.parametersLiveData[parameterJsonData[ruleData.parameterId].rtdasMapping],
                            parameterId: ruleData.parameterId
                        };

                        if (liveDataObject.liveValue) {
                            const parameterScale = parameterJsonData[liveDataObject.parameterId].scale;
                            if (parameterScale && parameterScale !== "1") {
                                liveDataObject.liveValue = (parameterScale * liveDataObject.liveValue);
                            }
                            isRuleBlockConditionTriggered = RuleChecker.detectAndExecuteRuleCondition(liveDataObject, ruleData); // check rule
                        }
                    } else if (constantParameterJsonData.hasOwnProperty(ruleData.parameterId)) {
                        //This is Constant Parameter
                        liveDataObject = {
                            liveValue: constantParameterJsonData[ruleData.parameterId].currentValueOfParameter,
                            parameterId: ruleData.parameterId
                        };
                        isRuleBlockConditionTriggered = RuleChecker.detectAndExecuteRuleCondition(liveDataObject, ruleData); // check rule
                    }
                    if (isRuleBlockConditionTriggered) {
                        triggeredRule = rulesArr[ruleId];
                    }
                }
            }
        }
        return {
            isRuleBlockConditionTriggered: isRuleBlockConditionTriggered,
            triggeredRule: triggeredRule,
            liveValues:liveDataObject
        };
    }

    getTimeInMilliSeconds(periodicity) {
        const periodicityValue = periodicity.value;
        const periodicityUnit = periodicity.unit;
        let milliseconds = 0;

        switch (periodicityUnit) {
            case "sec":
                milliseconds = periodicityValue * 1000;
                break;
            case "min":
                milliseconds = periodicityValue * 60 * 1000;
                break;
            case "hrs":
                milliseconds = periodicityValue * 60 * 60 * 1000;
                break;
            case "days":
                milliseconds = periodicityValue * 24 * 60 * 60 * 1000;
        }

        return milliseconds;
    }

    removeInterval() {
        clearInterval(this.intervalId);
    }
}

module.exports = MemoryRuleBlock;