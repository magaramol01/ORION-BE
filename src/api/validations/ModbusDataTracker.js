'use strict';

const appSettingsModel = require("../models/appSettingsModel");
const TrackerTiming = appSettingsModel.getAppSettingsJsonData().modbusDataTracker.checkerTime;
const {Util} = require("../../api/utils/util");
const ShipModel = require('../models/shipModel');
const WebSocketAdaptor = require("../adaptors/webSocketAdaptor");
const ModbusDataTrackerHistoryController = require("../controllers/modbusDataTrackerHistoryController");

let modbusTrackerData = {};
const isProductionMode = appSettingsModel.getAppSettingsJsonData().modbusDataTracker.isScheduled;

class ModbusDataTracker {

    constructor() {
        this.scheduleTrackerExecution();
    }

    scheduleTrackerExecution() {
        this.intervalId = setInterval(this.executeTracker, TrackerTiming)
    }

    removeInterval() {
        clearInterval(this.intervalId);
    }

    setDefaultModbusTrackerData(vesselId) {
        const initialTimestamp = Util.getNewDate();

        modbusTrackerData[vesselId] = {
            nmeaDataLastTimestamp: initialTimestamp,
            machineryDataLastTimestamp: initialTimestamp,
            isNMEADataReceived: true,
            isMachineryDataReceived: true
        };
    }

    setModbusTrackerData(vesselId, dataKey, dataValue) {
        modbusTrackerData[vesselId][dataKey] = dataValue;
    }

    getModbusTrackerData(vesselId) {
        return modbusTrackerData[vesselId];
    }

    evaluateAndUpdateModbusTrackerData(vesselId, realTimeModbustData, latestReceivedTimestamp) {
        if (!modbusTrackerData.hasOwnProperty(vesselId)) {
            this.setDefaultModbusTrackerData();
        }

        const navigationParameters = appSettingsModel.getAppSettingsJsonData().modbusDataTracker.navigationParameters;
        const machineryParameters = appSettingsModel.getAppSettingsJsonData().modbusDataTracker.machineryParameters;
        let isNavigationParametersDataReceived = true;
        let isMachineryParametersDataReceived = true;

        for (let i = 0; i < navigationParameters.length; i++) {
            const navigationParameter = navigationParameters[i];
            if (navigationParameter && !realTimeModbustData.has(navigationParameter)) {
                isNavigationParametersDataReceived = false;
                break;
            }
        }

        for (let j = 0; j < machineryParameters.length; j++) {
            const machineryParameter = machineryParameters[j];
            if (machineryParameter && !realTimeModbustData.has(machineryParameter)) {
                isMachineryParametersDataReceived = false;
                break;
            }
        }

        if (isNavigationParametersDataReceived) {
            modbusTrackerData[vesselId].nmeaDataLastTimestamp = latestReceivedTimestamp;
            modbusTrackerData[vesselId].isNMEADataReceived = isNavigationParametersDataReceived;
        }
        if (isMachineryParametersDataReceived) {
            modbusTrackerData[vesselId].machineryDataLastTimestamp = latestReceivedTimestamp;
            modbusTrackerData[vesselId].isMachineryDataReceived = isMachineryParametersDataReceived
        }
    }

    executeTracker() {
        if (isProductionMode) {
            const currentTimestamp = Util.getNewDate();

            const allRegisteredShips = ShipModel.getAllShipJsonData();
            for (let vesselName in allRegisteredShips) {
                if (allRegisteredShips.hasOwnProperty(vesselName)) {
                    const vesselId = allRegisteredShips[vesselName];

                    if (modbusTrackerData.hasOwnProperty(vesselId)) {
                        let modbusTrackerDataOfVessel = modbusTrackerData[vesselId];
                        if (modbusTrackerDataOfVessel.hasOwnProperty("nmeaDataLastTimestamp")) {
                            const lastDataReceiveTimestamp1 = modbusTrackerDataOfVessel.nmeaDataLastTimestamp;
                            let difference1 = Math.abs(currentTimestamp - lastDataReceiveTimestamp1) / 1000;
                            let minutes1 = Math.floor(difference1 / 60) % 60;

                            if (minutes1 >= 1) {
                                modbusTrackerDataOfVessel.isNMEADataReceived = false;
                            } else {
                                modbusTrackerDataOfVessel.isNMEADataReceived = true;
                            }
                        }
                        if (modbusTrackerDataOfVessel.hasOwnProperty("machineryDataLastTimestamp")) {
                            const lastDataReceiveTimestamp2 = modbusTrackerDataOfVessel.machineryDataLastTimestamp;
                            let difference2 = Math.abs(currentTimestamp - lastDataReceiveTimestamp2) / 1000;
                            let minutes2 = Math.floor(difference2 / 60) % 60;

                            if (minutes2 >= 1) {
                                modbusTrackerDataOfVessel.isMachineryDataReceived = false;
                            } else {
                                modbusTrackerDataOfVessel.isMachineryDataReceived = true;
                            }
                        }

                        // inform on UI by sending data through socket
                        WebSocketAdaptor.emitDataOnSocket("subscribeToDashboard", {
                            popupData: {
                                popUpTimerData:{
                                    "isNMEADataReceived": modbusTrackerDataOfVessel.isNMEADataReceived,
                                    "isMachineryDataReceived": modbusTrackerDataOfVessel.isMachineryDataReceived,
                                    "shipName": vesselName,
                                    "vesselId": vesselId
                                }
                            }
                        }, vesselId);

                        ModbusDataTrackerHistoryController.saveModbusTrackerDataHistory({
                            time: currentTimestamp,
                            isNavigationDataReceived: modbusTrackerDataOfVessel.isNMEADataReceived,
                            isMachineryDataReceived: modbusTrackerDataOfVessel.isMachineryDataReceived,
                            vesselId: vesselId
                        });
                    }
                }
            }
        }
    }
}

class ModbusDataTrackerSingleton {

    constructor() {
        if (!ModbusDataTrackerSingleton.instance) {
            ModbusDataTrackerSingleton.instance = new ModbusDataTracker();
        }
    }

    static getInstance() {
        if (!ModbusDataTrackerSingleton.instance) {
            ModbusDataTrackerSingleton.instance = new ModbusDataTracker();
        }
        return ModbusDataTrackerSingleton.instance;
    }

}

module.exports = ModbusDataTrackerSingleton;