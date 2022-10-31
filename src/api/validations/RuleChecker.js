'use strict';
const parametersModel = require('../models/parametersModel');
const {getRTDASRegistrationJsonData} = require('../models/rtdasModel');

exports.detectAndExecuteRuleCondition = function (actualDataObj, expectedDataObj) { // liveParameterObj, configuredRuleKey
    let isTrigger = false;
    const actualValue = actualDataObj.liveValue;

    const ruleData = expectedDataObj;

    if (actualDataObj.parameterId === ruleData.parameterId && ruleData.isActive) {
        const ruleDataCondition = ruleData.condition;

        if (!isTrigger && ruleDataCondition.isRange) {
            const range = ruleDataCondition.range;
            if (exports.isEmpty(range.from) && exports.isEmpty(range.to) && exports.isEmpty(range.fromOperator) && exports.isEmpty(range.toOperator)) {
                // if (getCondition(actualValue, range.from, range.fromOperator) || getCondition(actualValue, range.to, range.toOperator)) {
                if(range.fromOperator == ">=" && range.toOperator == "<=" && range.from <= range.to) {
                    if (exports.isBetween(actualValue, parseFloat(range.from), parseFloat(range.to))) {
                        isTrigger = true;
                        console.log("First range condition");
                    }
                }
                if(range.fromOperator == "<=" && range.toOperator == ">=" && range.from <= range.to){
                    if (!exports.isBetween(actualValue, parseFloat(range.from), parseFloat(range.to))) {
                        isTrigger = true;
                        console.log("Third range condition");
                    }
                }
            }
        }

        if (!isTrigger && ruleDataCondition.isSingleValue) {
            const singleValue = ruleDataCondition.singleValue;
            if (exports.isEmpty(singleValue) && getCondition(actualValue, parseFloat(singleValue.value), singleValue.valueOperator)) {
                isTrigger = true;
            }
        }

        // if (!isTrigger && ruleDataCondition.isCalculatedExpression) {
        //     const calculatedExpression = specifiedRange.calculatedExpression;
        //
        //     // don't know exact scenario and condition to apply and hence implement it later...
        //     isTrigger = true;
        // }

        if (!isTrigger && ruleData.enumeratedValue && ruleData.enumeratedValue.isEnumeratedValue) {
            const enumeratedValue = ruleData.enumeratedValue.value;
            for (let str in enumeratedValue) {
                if (!enumeratedValue.hasOwnProperty(str)) {
                    continue
                }
                if (exports.isEmpty(enumeratedValue[str]) && getCondition(actualValue, enumeratedValue[str], "===")) {
                    isTrigger = false;
                    break;
                } else {
                    isTrigger = true;
                }
            }
        }
    }

    return isTrigger;
};

exports.lessThan = function (val1, val2) {
    return val1 < val2;
};

exports.greaterThan = function (val1, val2) {
    return val1 > val2;
};

exports.lessThanEqualsTo = function (val1, val2) {
    return val1 <= val2;
};

exports.greaterThanEqualsTo = function (val1, val2) {
    return val1 >= val2;
};

exports.equalsTo = function (val1, val2) {
    return val1 === val2;
};

exports.notEqualsTo = function (val1, val2) {
    return val1 !== val2;
};

exports.isBetween = function (x, min, max) {
    return x >= min && x <= max;
};

exports.isBetween2 = function (x, min, max) {
    return x > min && x < max;
};

exports.isEmpty = function (str) {
    return (str || 0 === str.length);
};

function getCondition(actualValue, expectedValue, strOperator) {
    switch (strOperator) {
        case "<":
            return actualValue < expectedValue;

        case "<=":
            return actualValue <= expectedValue;

        case ">":
            return actualValue > expectedValue;

        case ">=":
            return actualValue >= expectedValue;

        case "==":
            return actualValue === expectedValue;

        case "!=":
            return actualValue !== expectedValue;

        default:
            return false;
    }
}
