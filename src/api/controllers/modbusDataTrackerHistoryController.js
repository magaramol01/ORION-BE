'use strict';

const _ = require('lodash');
const appSettingsModel = require('../models/appSettingsModel');
const dateFormat = require('dateformat');
const ModbusTrackerDataHistoryModel = require("../models/modbusDataTrackerHistoryModel");
const {Util} = require("../utils/util");

const saveModbusTrackerDataHistory = function (data) {
    return ModbusTrackerDataHistoryModel.saveModbusTrackerDataHistory(data);
};

const getAllModbusTrackerDataHistory = async function () {
    return await ModbusTrackerDataHistoryModel.getAllModbusTrackerDataHistory();
};

const getModbusTrackerDataHistoryByVesselId = async function (request) {
    const vesselId = parseInt(request.query.vesselId);
    return await ModbusTrackerDataHistoryModel.getModbusTrackerDataHistoryByVesselId(vesselId);
};

const getModbusTrackerDataHistoryByVesselIdAndPagination = async function (request) {
    const vesselId = parseInt(request.query.vesselId);
    const activePage = parseInt(request.query.activePage);

    const {itemsCountPerPage, pageRangeDisplayed} = appSettingsModel.getAppSettingsJsonData().pagination;
    const skippedRowsIndex = (activePage - 1) * itemsCountPerPage;

    const result = await ModbusTrackerDataHistoryModel.getModbusTrackerDataHistoryByVesselIdAndPagination(vesselId, itemsCountPerPage, skippedRowsIndex);

    return {
        activePage,
        itemsCountPerPage,
        totalItemsCount: result.length > 0 ? result[0].totalRows : result.length,
        pageRangeDisplayed,
        modbusTrackerData: result
    };
};

const getModbusTrackerDataHistoryByVesselIdAndDates = async function (request) {
    const vesselId = parseInt(request.query.vesselId);
    const activePage = parseInt(request.query.activePage);

    const {itemsCountPerPage, pageRangeDisplayed} = appSettingsModel.getAppSettingsJsonData().pagination;
    const skippedRowsIndex = (activePage - 1) * itemsCountPerPage;

    const startDateTmp = Util.getNewDate();
    const endDateTmp = Util.getNewDate();
    startDateTmp.setMonth(startDateTmp.getMonth() - 1);
    const startDate = dateFormat(startDateTmp, Util.getCommonDateFormat());
    endDateTmp.setDate(endDateTmp.getDate() + 1);
    const endDate = dateFormat(endDateTmp, Util.getCommonDateFormat());

    const result = await ModbusTrackerDataHistoryModel.getModbusTrackerDataHistoryByVesselIdAndDates(vesselId, startDate, endDate);

    let finalPaginatedData = [];
    let isAddNew = true;
    let isType1 = false;
    let isType2 = false;
    let isType3 = false;

    for (let i = 0; i < result.length; i++) {
        const currentRecord = result[i];
        const finalPaginatedDataLength = finalPaginatedData.length;
        const isFinalPaginatedDataLengthZero = finalPaginatedDataLength === 0;

        if (!currentRecord.isNavigationDataReceived && !currentRecord.isMachineryDataReceived) {
            if ((isType2 || isType3) && !isFinalPaginatedDataLengthZero) {
                let lastEntry = finalPaginatedData[finalPaginatedData.length -1];
                lastEntry["toTime"] = dateFormat(currentRecord.time, Util.getCommonDateFormat());
                isAddNew = true;
            }
            if (isAddNew) {
                finalPaginatedData.push({
                    fromTime: dateFormat(currentRecord.time, Util.getCommonDateFormat()),
                    isNavigationDataReceived: currentRecord.isNavigationDataReceived,
                    isMachineryDataReceived: currentRecord.isMachineryDataReceived,
                    vesselId: currentRecord.vesselId
                });
                isType1 = true;
                isType2 = false;
                isType3 = false;
                isAddNew = false;
            }
        }
        if (currentRecord.isNavigationDataReceived && !currentRecord.isMachineryDataReceived) {
            if ((isType1 || isType3) && !isFinalPaginatedDataLengthZero) {
                let lastEntry = finalPaginatedData[finalPaginatedData.length -1];
                lastEntry["toTime"] = dateFormat(currentRecord.time, Util.getCommonDateFormat());
                isAddNew = true;
            }
            if (isAddNew) {
                finalPaginatedData.push({
                    fromTime: dateFormat(currentRecord.time, Util.getCommonDateFormat()),
                    isNavigationDataReceived: currentRecord.isNavigationDataReceived,
                    isMachineryDataReceived: currentRecord.isMachineryDataReceived,
                    vesselId: currentRecord.vesselId
                });
                isType1 = false;
                isType2 = true;
                isType3 = false;
                isAddNew = false;
            }
        }
        if (currentRecord.isMachineryDataReceived && !currentRecord.isNavigationDataReceived) {
            if ((isType1 || isType2) && !isFinalPaginatedDataLengthZero) {
                let lastEntry = finalPaginatedData[finalPaginatedData.length -1];
                lastEntry["toTime"] = dateFormat(currentRecord.time, Util.getCommonDateFormat());
                isAddNew = true;
            }
            if (isAddNew) {
                finalPaginatedData.push({
                    fromTime: dateFormat(currentRecord.time, Util.getCommonDateFormat()),
                    isNavigationDataReceived: currentRecord.isNavigationDataReceived,
                    isMachineryDataReceived: currentRecord.isMachineryDataReceived,
                    vesselId: currentRecord.vesselId
                });
                isType1 = false;
                isType2 = false;
                isType3 = true;
                isAddNew = false;
            }
        }
        if (currentRecord.isMachineryDataReceived && currentRecord.isNavigationDataReceived) {
            if ((isType1 || isType2 || isType3) && !isFinalPaginatedDataLengthZero) {
                let lastEntry = finalPaginatedData[finalPaginatedData.length -1];
                lastEntry["toTime"] = dateFormat(currentRecord.time, Util.getCommonDateFormat());
                isAddNew = true;

                isType1 = false;
                isType2 = false;
                isType3 = false;
            }
        }
    }
    if(!finalPaginatedData[finalPaginatedData.length-1]['toTime']){
        finalPaginatedData[finalPaginatedData.length-1]['toTime'] = dateFormat(Util.getNewDate(),Util.getCommonDateFormat());
    }

    const lastPaginatedData = _.reverse(finalPaginatedData);

    return {
        activePage,
        itemsCountPerPage,
        totalItemsCount: lastPaginatedData.length,
        pageRangeDisplayed,
        modbusTrackerData: lastPaginatedData.slice(skippedRowsIndex, skippedRowsIndex + itemsCountPerPage)
    };
};

module.exports = {
    saveModbusTrackerDataHistory: saveModbusTrackerDataHistory,
    getAllModbusTrackerDataHistory: getAllModbusTrackerDataHistory,
    getModbusTrackerDataHistoryByVesselId: getModbusTrackerDataHistoryByVesselId,
    getModbusTrackerDataHistoryByVesselIdAndPagination: getModbusTrackerDataHistoryByVesselIdAndPagination,
    getModbusTrackerDataHistoryByVesselIdAndDates: getModbusTrackerDataHistoryByVesselIdAndDates
};