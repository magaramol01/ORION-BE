'use strict';

exports.detectAndExecuteRuleCondition = function (actualDataObj, expectedDataObj) { // liveParameterObj, configuredRuleKey
    let isTrigger = false;
    const actualValue = actualDataObj.liveValue;

    const ruleData = expectedDataObj;

    if (actualDataObj.parameterId === ruleData.parameterId && ruleData.isActive) {
        const ruleDataCondition = ruleData.condition;
        const specifiedRange = ruleDataCondition.specifiedRange;
        const normalRange = ruleDataCondition.normalRange;
        const operationalMax = ruleDataCondition.operationalMax;
        const alarmCondition = ruleDataCondition.alarmCondition;

        if (operationalMax.isOperationalMax) {
            if (!isTrigger && exports.isEmpty(operationalMax.value)) {
                if (getCondition(actualValue, operationalMax.value, operationalMax.valueOperator)) {
                    isTrigger = true;
                }
            }
        }
        if (!isTrigger && alarmCondition.isAlarmCondition) {
            if (exports.isEmpty(alarmCondition.value)) {
                if (getCondition(actualValue, alarmCondition.value, alarmCondition.valueOperator)) {
                    isTrigger = true;
                }
            }
        }
        if (!isTrigger && specifiedRange.isSpecifiedRange) {
            if (specifiedRange.isRange) {
                const range = specifiedRange.range;
                if (exports.isEmpty(range.from) && exports.isEmpty(range.to)) {
                    if (getCondition(actualValue, range.from, range.fromOperator) || getCondition(actualValue, range.to, range.toOperator)) {
                        isTrigger = true;
                    }
                }
            }
            if (specifiedRange.isSingleValue) {
                const singleValue = specifiedRange.singleValue;
                if (exports.isEmpty(singleValue) && getCondition(actualValue, singleValue.value, singleValue.valueOperator)) {
                    isTrigger = true;
                }
            }
            if (specifiedRange.isCalculatedExpression) {
                const calculatedExpression = specifiedRange.calculatedExpression;

                // don't know exact scenario and condition to apply and hence implement it later...
            }
        }
        if (!isTrigger && normalRange.isNormalRange) {
            if (specifiedRange.isRange) {
                const range = specifiedRange.range;
                if (exports.isEmpty(range.from) && exports.isEmpty(range.to)) {
                    if (getCondition(actualValue, range.from, range.fromOperator) || getCondition(actualValue, range.to, range.toOperator)) {
                        isTrigger = true;
                    }
                }
            }
            if (specifiedRange.isSingleValue) {
                const singleValue = specifiedRange.singleValue;
                if (exports.isEmpty(singleValue) && getCondition(actualValue, singleValue.value, singleValue.valueOperator)) {
                    isTrigger = true;
                }
            }
            if (specifiedRange.isCalculatedExpression) {
                const calculatedExpression = specifiedRange.calculatedExpression;

                // don't know exact scenario and condition to apply and hence implement it later...
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
