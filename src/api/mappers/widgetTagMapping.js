'use strict';

class WidgetTagMapping {

    constructor() {
        this.tag = "";
        this.unit = "";
        this.caption = "";
        this.precision = "";
        this.startValue = "";
        this.endValue = "";
        this.minValue = "";
        this.maxValue = "";
        this.lowerBoundValue = "";
        this.upperBoundValue = "";
        this.hideMinValue = "";
        this.hideMaxValue = "";
        this.digitalData = {};
    }

    getTag() {
        return this.tag;
    };

    setTag(tag) {
        this.tag = tag;
    };

    getUnit() {
        return this.unit;
    };

    setUnit(unit) {
        this.unit = unit;
    };

    getCaption() {
        return this.caption;
    };

    setCaption(caption) {
        this.caption = caption;
    };

    getPrecision() {
        return this.precision;
    };

    setPrecision(precision) {
        this.precision = precision;
    };

    getStartValue() {
        return this.startValue;
    };

    setStartValue(startValue) {
        this.startValue = startValue;
    };

    getEndValue() {
        return this.endValue;
    };

    setEndValue(endValue) {
        this.endValue = endValue;
    };

    setMinValue(minValue) {
        this.minValue = minValue;
    };

    setMaxValue(maxValue) {
        this.maxValue = maxValue;
    };

    setLowerBoundValue(lowerBoundValue) {
        this.lowerBoundValue = lowerBoundValue;
    };

    setUpperBoundValue(upperBoundValue) {
        this.upperBoundValue  = upperBoundValue;
    };

    setHideMinValue(hideMinValue) {
        this.hideMinValue = hideMinValue;
    };

    setHideMaxValue(hideMaxValue) {
        this.hideMaxValue  = hideMaxValue;
    };

    setDigitalData(digitalData) {
        this.digitalData = digitalData;
    };
}

module.exports = WidgetTagMapping;
