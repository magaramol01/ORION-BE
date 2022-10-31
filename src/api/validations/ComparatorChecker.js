'use strict';

exports.detectAndExecuteParameterCondition = function (actualDataObj, idealDataObj) {
    let isTriggered = false;
    const actualValue = actualDataObj.liveValue;
    const relationalOperator = idealDataObj.relationalOperator;

    if (idealDataObj.informationSource !== "AMS") {
        return false;
    }

    if (!exports.isEmpty(idealDataObj.operationMaxFromRange) && !exports.isEmpty(idealDataObj.operationMaxToRange)) {
        isTriggered = exports.greaterThan(actualValue, idealDataObj.operationMaxFromRange) || exports.greaterThan(actualValue, idealDataObj.operationMaxToRange);

        // it can be less than or any operator... ideally it should come from configuration...
        // isTriggered = exports.lessThan(actualValue, idealDataObj.operationMaxFromRange) || exports.lessThan(actualValue, idealDataObj.operationMaxToRange);

        // isTriggered = exports.getDecisionFromRelationalFunctionAndOperators(relationalOperator, null, null, actualValue, idealDataObj.operationMaxFromRange) ||
        //     exports.getDecisionFromRelationalFunctionAndOperators(relationalOperator, null, null, actualValue, idealDataObj.operationMaxToRange);

        if (isTriggered) {
            return isTriggered;
        }
    }
    if (!exports.isEmpty(idealDataObj.alarmPoint)) {
        isTriggered = exports.greaterThan(actualValue, idealDataObj.alarmPoint);
        // isTriggered = exports.getDecisionFromRelationalFunctionAndOperators(relationalOperator, null, null, actualValue, idealDataObj.alarmPoint);
        if (isTriggered) {
            return isTriggered;
        }
    }
    if (!exports.isEmpty(idealDataObj.specifiedFromRange) && !exports.isEmpty(idealDataObj.specifiedToRange)) {
        isTriggered = exports.isBetween (actualValue, idealDataObj.specifiedFromRange, idealDataObj.specifiedToRange);
        // isTriggered = exports.getDecisionFromRelationalFunctionAndOperators(relationalOperator, idealDataObj.specifiedFromRange, idealDataObj.specifiedToRange, actualValue, null);
        if (isTriggered) {
            return isTriggered;
        }
    }
    if (!exports.isEmpty(idealDataObj.normalFromRange) && !exports.isEmpty(idealDataObj.normalToRange)) {
        if (idealDataObj.normalFromRange !== idealDataObj.normalToRange) {
            isTriggered = exports.isBetween(actualValue, idealDataObj.normalFromRange, idealDataObj.normalToRange);
            // isTriggered = exports.getDecisionFromRelationalFunctionAndOperators(relationalOperator, idealDataObj.normalFromRange, idealDataObj.normalToRange, actualValue, null);
            if (isTriggered) {
                return isTriggered;
            }
        }
    }

    return false;
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
    return (!str || 0 === str.length);
};

exports.getDecisionFromRelationalFunctionAndOperators = function (operator, fromValue, toValue, actualValue, expectedValue) {
    let functionName = null;

    switch (operator) {
        case "<":
            functionName = exports.lessThan(actualValue, expectedValue);
            break;

        case "<=":
            functionName = exports.lessThanEqualsTo(actualValue, expectedValue);
            break;

        case ">":
            functionName = exports.greaterThan(actualValue, expectedValue);
            break;

        case ">=":
            functionName = exports.greaterThanEqualsTo(actualValue, expectedValue);
            break;

        case "==":
            functionName = exports.equalsTo(actualValue, expectedValue);
            break;

        case "!=":
            functionName = exports.notEqualsTo(actualValue, expectedValue);
            break;

        case "<>":
            functionName = exports.isBetween(actualValue, fromValue, toValue);
            break;

        default:
            break;
    }

    return functionName;
};