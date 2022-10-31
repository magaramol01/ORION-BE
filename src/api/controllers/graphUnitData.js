const dateFormat = require('dateformat');
const WebSocketAdaptor = require("../adaptors/webSocketAdaptor");
const _ = require('lodash');
const { Util } = require("../utils/util");
const GraphDataModal = require("../models/graphDataModel");
const appSettingsModel = require('../models/appSettingsModel');
const cron = require('node-cron');

class graphUnitData {

    constructor() {
        this.allGraphData = {};
        this.flagData = {};
        this.timer = appSettingsModel.getAppSettingsJsonData().packetSavingFrequency;
        this.saveDataScheduler();
    }

    saveDataScheduler() {
        cron.schedule(this.timer, this.onSaveGraphDataInDB.bind(this));
    }

    // TODO : Hitesh this logic can be optimized... // if there is no change then no need to execute update query also too many iterations...
    onSaveGraphDataInDB() {
        if (Object.keys(this.flagData).length > 0) {
            Object.entries(this.flagData).map(([flagVesselId, flagValue]) => {
                Object.entries(flagValue).map(([flagModbusIdentifier, flagGraphData]) => {

                    if (Object.keys(this.allGraphData).length > 0 && flagGraphData.graphData) {
                        Object.entries(this.allGraphData).map(([allDataVesselId, allDataValue]) => {
                            Object.entries(allDataValue).map(([allDataModbusIdentifier, allDataGraphData]) => {
                                if (flagModbusIdentifier === allDataModbusIdentifier && flagVesselId === allDataVesselId)
                                    GraphDataModal.updateGraphData(allDataVesselId, allDataModbusIdentifier, allDataGraphData.graphData);
                            })
                        });
                    }

                });
            })
        }
    }

    setGraphDataFromDB(graphDataDB, flagData) {
        this.allGraphData = graphDataDB;
        this.flagData = flagData;
    }

    // setGraphData(vesselId, modbusParameterIdentifier, dataPointTime, dataPointValue) {
    //     if (!dataPointValue && dataPointValue !== 0) {
    //         return;
    //     }
    //     //console.log("Data before scaling " + modbusParameterIdentifier + " " + dataPointValue);
    //     dataPointValue = parseInt(Util.getScaledValue(dataPointValue, vesselId, modbusParameterIdentifier, 0));
    //    // console.log("Data after scaling " + modbusParameterIdentifier + " " + dataPointValue);
    //     let isSaveGraphData = true;
    //     if (Object.keys(this.flagData).length > 0) {
    //         Object.entries(this.flagData).map(([key, value]) => {
    //             Object.entries(value).map(([key1, value1]) => {
    //                 if (vesselId.toString() === key && modbusParameterIdentifier === key1 && value1.graphData) {
    //                     isSaveGraphData = false;
    //                 }
    //             })
    //         })
    //     }

    //     if (!this.allGraphData[vesselId]) {
    //         let modbusParamSpecificData = {};
    //         modbusParamSpecificData[modbusParameterIdentifier] = {
    //             'graphData': []
    //         };

    //         this.allGraphData[vesselId] = modbusParamSpecificData;
    //     }

    //     if (!this.allGraphData[vesselId][modbusParameterIdentifier]) {
    //         this.allGraphData[vesselId][modbusParameterIdentifier] = {
    //             'graphData': []
    //         };
    //     }

    //     if (!this.allGraphData[vesselId][modbusParameterIdentifier].graphData) {
    //         this.allGraphData[vesselId][modbusParameterIdentifier].graphData = [];
    //     }

    //     const commonDateFormat = Util.getCommonDateFormat();
    //     const dataPointTimeCopy = _.cloneDeep(dataPointTime);
    //     const formattedDataPointTime = Util.getDateInCommonFormat(dataPointTimeCopy);

    //     let dataPoint = {
    //         'time': dateFormat(formattedDataPointTime, commonDateFormat),
    //         'timestampValue': new Date(dateFormat(formattedDataPointTime, commonDateFormat)).getTime(),
    //         'value': dataPointValue ? dataPointValue : 0
    //     };

    //     const onlyDataPointTime = dataPoint.time.split(" ");
    //     const currentPacketValueDateInMilliseconds = new Date(onlyDataPointTime[0]).setHours(onlyDataPointTime[1].split(":")[0], onlyDataPointTime[1].split(":")[1], onlyDataPointTime[1].split(":")[2]);

    //     let newGraphData = [];
    //     let existingGraphData = this.allGraphData[vesselId][modbusParameterIdentifier].graphData;

    //     if (existingGraphData.length > 0) {
    //         for (let i = 0; i < existingGraphData.length; i++) {
    //             const oldDataPoint = existingGraphData[i];
    //             const onlyOldDataPointTime = oldDataPoint.time.split(" ");
    //             const currentValueDateInMilliseconds = new Date(onlyOldDataPointTime[0]).setHours(onlyOldDataPointTime[1].split(":")[0], onlyOldDataPointTime[1].split(":")[1], onlyOldDataPointTime[1].split(":")[2]);

    //             const timeInMillis = currentPacketValueDateInMilliseconds - currentValueDateInMilliseconds;
    //             if (timeInMillis < 86400000) { // 24 Hours = 86,400,000 Milliseconds, we are keeping 24 hours rolling data
    //                 newGraphData.push(oldDataPoint);
    //             }
    //         }
    //     }
    //     newGraphData.push(dataPoint);
    //     this.allGraphData[vesselId][modbusParameterIdentifier].graphData = newGraphData;

    //     dataPoint["rechartModbusParameterIdentifier"] = modbusParameterIdentifier;

    //     const socketPool = WebSocketAdaptor.getSocketPool();
    //     for (let socketId in socketPool) {
    //         const socketData = socketPool[socketId];
    //         const socketSubscriberName = socketData.socketSubscriberName;
    //         const otherData = socketData.otherData;
    //         const otherDataVesselId = parseInt(otherData.vesselId);

    //         if (socketSubscriberName && socketSubscriberName === "subscribeToGaugeChart") {
    //             if (vesselId && otherDataVesselId && vesselId === otherDataVesselId) {
    //                 WebSocketAdaptor.emitDataOnSocketId("subscribeToGaugeChart", socketId, JSON.stringify(dataPoint));
    //             }
    //         }
    //     }
    //     const graphData = {
    //         vesselId: vesselId,
    //         modbusParameterIdentifier: modbusParameterIdentifier,
    //         graphData: newGraphData
    //     };


    //     if (isSaveGraphData) {
    //         GraphDataModal.insertGraphData(graphData);

    //         if (!this.flagData[vesselId]) {
    //             let modbusParamSpecificData = {};
    //             modbusParamSpecificData[modbusParameterIdentifier] = {
    //                 'graphData': false
    //             };
    //             this.flagData[vesselId] = modbusParamSpecificData;
    //         }

    //         if (!this.flagData[vesselId][modbusParameterIdentifier]) {
    //             this.flagData[vesselId][modbusParameterIdentifier] = {
    //                 'graphData': false
    //             };
    //         }

    //         if (!this.flagData[vesselId][modbusParameterIdentifier].graphData) {
    //             this.flagData[vesselId][modbusParameterIdentifier].graphData = false;
    //         }

    //         this.flagData[vesselId][modbusParameterIdentifier] = {
    //             'graphData': true
    //         }

    //     }
    // }
    setGraphData(vesselId, modbusParameterIdentifier, dataPointTime, dataPointValue, charterData) {
        if (!dataPointValue && dataPointValue !== 0 && !charterData) {
            return;
        }
        //console.log("Data before scaling " + modbusParameterIdentifier + " " + dataPointValue);
        dataPointValue = parseInt(Util.getScaledValue(dataPointValue, vesselId, modbusParameterIdentifier, 0));
        // console.log("Data after scaling " + modbusParameterIdentifier + " " + dataPointValue);
        let isSaveGraphData = true;
        if (Object.keys(this.flagData).length > 0) {
            Object.entries(this.flagData).map(([key, value]) => {
                Object.entries(value).map(([key1, value1]) => {
                    if (vesselId.toString() === key && modbusParameterIdentifier === key1 && value1.graphData) {
                        isSaveGraphData = false;
                    }
                })
            })
        }

        if (!this.allGraphData[vesselId]) {
            let modbusParamSpecificData = {};
            modbusParamSpecificData[modbusParameterIdentifier] = {
                'graphData': []
            };

            this.allGraphData[vesselId] = modbusParamSpecificData;
        }

        if (!this.allGraphData[vesselId][modbusParameterIdentifier]) {
            this.allGraphData[vesselId][modbusParameterIdentifier] = {
                'graphData': []
            };
        }

        if (!this.allGraphData[vesselId][modbusParameterIdentifier].graphData) {
            this.allGraphData[vesselId][modbusParameterIdentifier].graphData = [];
        }

        const commonDateFormat = Util.getCommonDateFormat();
        const dataPointTimeCopy = _.cloneDeep(dataPointTime);
        const formattedDataPointTime = Util.getDateInCommonFormat(dataPointTimeCopy);
        let dataPoint = {};

        if (!!charterData) {
            if (charterData === "AE Fuel Cons. Rate") {
                dataPoint = {
                    'time': dateFormat(formattedDataPointTime, commonDateFormat),
                    'timestampValue': new Date(dateFormat(formattedDataPointTime, commonDateFormat)).getTime(),
                    'value': dataPointValue ? dataPointValue : 0,
                    'value2': this.allVesselCharterParty[vesselId]["fueldata"]
                };
            }
            // *_____Nawroz Multi line graph values____*

            else if (charterData === "Shaft Power") {
                dataPoint = {
                    'time': dateFormat(formattedDataPointTime, commonDateFormat),
                    'timestampValue': new Date(dateFormat(formattedDataPointTime, commonDateFormat)).getTime(),
                    'value': datapointValue ? dataPointValue : 0,
                    'value2': this.allVesselCharterParty[vesselId]["speeddata"]
                };
            } else if (charterData === "Mean Draft") {
                dataPoint = {
                    'time': dateFormat(formattedDataPointTime, commonDateFormat),
                    'timestampValue': new Date(dateFormat(formattedDataPointTime, commonDateFormat)).getTime(),
                    'value': datapointValue ? dataPointValue : 0,
                    'value2': this.allVesselCharterParty[vesselId]["speeddata"]
                };
            } else if (charterData === "ME Fuel Cons. Rate") {
                dataPoint = {
                    'time': dateFormat(formattedDataPointTime, commonDateFormat),
                    'timestampValue': new Date(dateFormat(formattedDataPointTime, commonDateFormat)).getTime(),
                    'value': dataPointValue ? dataPointValue : 0,
                    'value2': this.allVesselCharterParty[vesselId]["speeddata"]
                };
            } else if (charterData === "PCO O.T.5") { // ME RPM
                dataPoint = {
                    'time': dateFormat(formattedDataPointTime, commonDateFormat),
                    'timestampValue': new Date(dateFormat(formattedDataPointTime, commonDateFormat)).getTime(),
                    'value': dataPointValue ? dataPointValue : 0,
                    'value2': this.allVesselCharterParty[vesselId]["pcodata"]
                };
            } else if (charterData === "ME RPM") { // ME RPM
                dataPoint = {
                    'time': dateFormat(formattedDataPointTime, commonDateFormat),
                    'timestampValue': new Date(dateFormat(formattedDataPointTime, commonDateFormat)).getTime(),
                    'value': dataPointValue ? dataPointValue : 0,
                    'value2': this.allVesselCharterParty[vesselId]["speeddata"]
                };
            } else if (charterData === "Rel. Wind Speed") { // Rel. Wind Speed/
                dataPoint = {
                    'time': dateFormat(formattedDataPointTime, commonDateFormat),
                    'timestampValue': new Date(dateFormat(formattedDataPointTime, commonDateFormat)).getTime(),
                    'value': dataPointValue ? dataPointValue : 0,
                    'value2': this.allVesselCharterParty[vesselId]["speeddata"]
                };
            } else if (charterData === "Rel. Wind Direction") { // Rel. Wind Direction/
                dataPoint = {
                    'time': dateFormat(formattedDataPointTime, commonDateFormat),
                    'timestampValue': new Date(dateFormat(formattedDataPointTime, commonDateFormat)).getTime(),
                    'value': dataPointValue ? dataPointValue : 0,
                    'value2': this.allVesselCharterParty[vesselId]["speeddata"]
                };
            } else if (charterData === "Current Speed") { // Current Speed
                dataPoint = {
                    'time': dateFormat(formattedDataPointTime, commonDateFormat),
                    'timestampValue': new Date(dateFormat(formattedDataPointTime, commonDateFormat)).getTime(),
                    'value': dataPointValue ? dataPointValue : 0,
                    'value2': this.allVesselCharterParty[vesselId]["speeddata"]
                };
            } else if (charterData === "Current Direction") { // Current Direction
                dataPoint = {
                    'time': dateFormat(formattedDataPointTime, commonDateFormat),
                    'timestampValue': new Date(dateFormat(formattedDataPointTime, commonDateFormat)).getTime(),
                    'value': dataPointValue ? dataPointValue : 0,
                    'value2': this.allVesselCharterParty[vesselId]["speeddata"]
                };
            } else if (charterData === "Vessel Heading") { // Vessel Heading
                dataPoint = {
                    'time': dateFormat(formattedDataPointTime, commonDateFormat),
                    'timestampValue': new Date(dateFormat(formattedDataPointTime, commonDateFormat)).getTime(),
                    'value': dataPointValue ? dataPointValue : 0,
                    'value2': this.allVesselCharterParty[vesselId]["speeddata"]
                };
            } else if (charterData === "Speed Thru Water") { // Speed Thru Water
                dataPoint = {
                    'time': dateFormat(formattedDataPointTime, commonDateFormat),
                    'timestampValue': new Date(dateFormat(formattedDataPointTime, commonDateFormat)).getTime(),
                    'value': dataPointValue ? dataPointValue : 0,
                    'value2': this.allVesselCharterParty[vesselId]["speeddata"]
                };
            }
            else if (charterData === "Speed Over Ground GPVTG_5") {
                dataPoint = {
                    'time': dateFormat(formattedDataPointTime, commonDateFormat),
                    'timestampValue': new Date(dateFormat(formattedDataPointTime, commonDateFormat)).getTime(),
                    'value': dataPointValue ? dataPointValue : 0,
                    'value2': this.allVesselCharterParty[vesselId]["speeddata"]
                };
            } else if (charterData === "ME Fuel Eff.") {
                dataPoint = {
                    'time': dateFormat(formattedDataPointTime, commonDateFormat),
                    'timestampValue': new Date(dateFormat(formattedDataPointTime, commonDateFormat)).getTime(),
                    'value': dataPointValue ? dataPointValue : 0,
                    'value2': this.allVesselCharterParty[vesselId]["speeddata"]
                };
            } else if (charterData === "ME Est. Engine Load") {
                dataPoint = {
                    'time': dateFormat(formattedDataPointTime, commonDateFormat),
                    'timestampValue': new Date(dateFormat(formattedDataPointTime, commonDateFormat)).getTime(),
                    'value': dataPointValue ? dataPointValue : 0,
                    'value2': this.allVesselCharterParty[vesselId]["speeddata"]
                };
            } else {
                dataPoint = {
                    'time': dateFormat(formattedDataPointTime, commonDateFormat),
                    'timestampValue': new Date(dateFormat(formattedDataPointTime, commonDateFormat)).getTime(),
                    'value': dataPointValue ? dataPointValue : 0
                };
            }
        } else {
            dataPoint = {
                'time': dateFormat(formattedDataPointTime, commonDateFormat),
                'timestampValue': new Date(dateFormat(formattedDataPointTime, commonDateFormat)).getTime(),
                'value': dataPointValue ? dataPointValue : 0
            };
        }

        const onlyDataPointTime = dataPoint.time.split(" ");
        const currentPacketValueDateInMilliseconds = new Date(onlyDataPointTime[0]).setHours(onlyDataPointTime[1].split(":")[0], onlyDataPointTime[1].split(":")[1], onlyDataPointTime[1].split(":")[2]);

        let newGraphData = [];
        let existingGraphData = this.allGraphData[vesselId][modbusParameterIdentifier].graphData;

        if (existingGraphData.length > 0) {
            for (let i = 0; i < existingGraphData.length; i++) {
                const oldDataPoint = existingGraphData[i];
                const onlyOldDataPointTime = oldDataPoint.time.split(" ");
                const currentValueDateInMilliseconds = new Date(onlyOldDataPointTime[0]).setHours(onlyOldDataPointTime[1].split(":")[0], onlyOldDataPointTime[1].split(":")[1], onlyOldDataPointTime[1].split(":")[2]);

                const timeInMillis = currentPacketValueDateInMilliseconds - currentValueDateInMilliseconds;
                if (timeInMillis < 86400000) { // 24 Hours = 86,400,000 Milliseconds, we are keeping 24 hours rolling data
                    newGraphData.push(oldDataPoint);
                }
            }
        }
        newGraphData.push(dataPoint);
        this.allGraphData[vesselId][modbusParameterIdentifier].graphData = newGraphData;

        dataPoint["rechartModbusParameterIdentifier"] = modbusParameterIdentifier;

        const socketPool = WebSocketAdaptor.getSocketPool();
        for (let socketId in socketPool) {
            const socketData = socketPool[socketId];
            const socketSubscriberName = socketData.socketSubscriberName;
            const otherData = socketData.otherData;
            const otherDataVesselId = parseInt(otherData.vesselId);

            if (socketSubscriberName && socketSubscriberName === "subscribeToGaugeChart") {
                if (vesselId && otherDataVesselId && vesselId === otherDataVesselId) {
                    WebSocketAdaptor.emitDataOnSocketId("subscribeToGaugeChart", socketId, JSON.stringify(dataPoint));
                }
            }
        }
        const graphData = {
            vesselId: vesselId,
            modbusParameterIdentifier: modbusParameterIdentifier,
            graphData: newGraphData
        };


        if (isSaveGraphData) {
            GraphDataModal.insertGraphData(graphData);

            if (!this.flagData[vesselId]) {
                let modbusParamSpecificData = {};
                modbusParamSpecificData[modbusParameterIdentifier] = {
                    'graphData': false
                };
                this.flagData[vesselId] = modbusParamSpecificData;
            }

            if (!this.flagData[vesselId][modbusParameterIdentifier]) {
                this.flagData[vesselId][modbusParameterIdentifier] = {
                    'graphData': false
                };
            }

            if (!this.flagData[vesselId][modbusParameterIdentifier].graphData) {
                this.flagData[vesselId][modbusParameterIdentifier].graphData = false;
            }

            this.flagData[vesselId][modbusParameterIdentifier] = {
                'graphData': true
            }

        }

    }

    getGraphData(vesselId, modbusParameterIdentifier) {
        if (!this.allGraphData[vesselId]) {
            return [];
        } else {
            if (!this.allGraphData[vesselId][modbusParameterIdentifier]) {
                return [];
            } else {
                return this.allGraphData[vesselId][modbusParameterIdentifier].graphData;
            }
        }
    }

    clearSpecificData(vesselId, modbusParameterIdentifier) {
        if (!this.allGraphData[vesselId]) {
            this.allGraphData[vesselId] = {};
        } else {
            if (!this.allGraphData[vesselId][modbusParameterIdentifier]) {
                this.allGraphData[vesselId][modbusParameterIdentifier] = {};
            } else {
                this.allGraphData[vesselId][modbusParameterIdentifier].graphData = {};
            }
        }
    }

    clearAllData() {
        this.allGraphData = {};
    };
}

class GraphDataSingleton {

    constructor() {
        if (!GraphDataSingleton.instance) {
            GraphDataSingleton.instance = new graphUnitData();
        }
    }

    static getInstance() {
        if (!GraphDataSingleton.instance) {
            GraphDataSingleton.instance = new graphUnitData();
        }
        return GraphDataSingleton.instance;
    }
}

module.exports = GraphDataSingleton;