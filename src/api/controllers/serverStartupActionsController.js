'use strict';

const {
    AUDIT_TRAIL, CALCULATED_EXPRESSION, CAUSES,REPORT_TABLE_DATA,
    CAUSES_REFERENCES_RULE_CONFIG, COMPANY_REGISTRATION,
    CONSTANT_PARAMETERS, CONSTANT_PARAMETERS_DATA, FAILURE_ADVISORIES,
    FAILURE_ADVISORIES_REFERENCES_CAUSES, MACHINES, PARAMETER_SOURCE, PARAMETERS,
    PARAMETERS_REFERENCES_RULE_CONFIG, RTDAS_REAL_TIME_DATA, RTDAS_REAL_TIME_ONE_DAY_DATA,
    RULES_CSV_DATA, PARAMETER_CSV_DATA,SISTER_VESSEL_GROUP, FLEET,
    RTDAS_REGISTRATION, RULE_BLOCKS, RULE_CONFIGS, RULE_CONFIGS_REFERENCES_RULE_BLOCKS, SHIP,
    STORM_GLASS_WEATHER, TOKENS, TRIGGERED_OUTCOMES_HISTORY, TRIGGERED_OUTCOMES_TODAY, UNITS,
    USE_CASES, USER, USER_COUNTER, USER_WIDGETS_PARAMETERS, VESSEL_JOURNEY_COUNTER, HYDROSTATIC,
    VOYAGE_FORECAST, WIDGETS_PARAMETERS, GRAPH_DATA, MRV_NOON_REPORT, XPRESS_MRV_NOON_REPORT, EU_PORTS, USER_MAPPING, WIDGET_TAG_MAPPING,

} =  require("../utils/tables");

const appSettingsModel = require('../models/appSettingsModel');
const DataAccessAdaptorSingleton = require("../adaptors/dataAccessAdaptorSingleton");
const {Util} = require("../utils/util");

const AuditTrailModel = require("../models/auditTrailModel");
const CalculatedExpressionModel = require("../models/calculatedExpressionModel");
const CausesModel = require("../models/causesModel");
const RuleCsvModal = require("../models/ruleCsvModal");
const ParameterCsvModal = require("../models/parameterCsvModal");
const ConstantParametersModel = require("../models/constantParameterModel");
const FailureAdvisoriesModel = require("../models/failureAdvisoriesModel");
const ParametersModel = require("../models/parametersModel");
const ParameterSourceModel = require("../models/parameterSourceModel");
const RTDASModel = require("../models/rtdasModel");
const RuleBlocksModel = require("../models/ruleBlocksModel");
const RulesModel = require("../models/ruleConfigsModel");
const UnitsModel = require("../models/unitsModel");
const UserModel = require("../models/userModel");
const UserMappingModel = require("../models/UserMappingModel");
const CompanyRegistrationModel = require("../models/companyRegistrationModel");
const ShipModel = require("../models/shipModel");
const WidgetsParametersModel = require("../models/widgetsParametersModel");
const MachineModel = require("../models/machineModel");
const UserWidgetsParametersModel = require("../models/userWidgetsParametersModel");
const OutcomesTodayModel = require("../models/triggeredOutcomesTodayModel");
const OutcomesHistoryModel = require("../models/triggeredOutcomesHistoryModel");
const RealTimeDataModel = require("../models/realTimeDataModel");
const SisterVesselModel = require("../models/sisterVesselGroupModel");
const FleetModel = require("../models/fleetModel");
const RealTimeOneDayDataModel = require("../models/realTimeOneDayDataModel");
const VoyageForecastModel = require("../models/voyageForecastModel");
const StormGlassWeatherModel = require("../models/stormGlassWeatherModel");
const VesselJourneyCounterModel = require("../models/vesselJourneyCounterModel");
const TokenModal = require("../models/tokenModel");
const GraphDataModel = require("../models/graphDataModel");
const widgetMappingModel = require("../models/widgetMappingModel");
const MRVNoonReportModel = require("../models/mrvNoonReportModel");
const EUPortsModel = require("../models/euPortsModel");
const pdfModel = require("../models/pdfModel");

const RuleExecutionSingletonController = require("../controllers/ruleExecutionSingletonController");
const widgetsParametersController = require("../controllers/widgetsParametersController");
const EmailScheduler = require("../mappers/scheduleEmail");
const mrvNoonReportController = require("../controllers/mrvNoonReportController");

const createAllApplicationTables = async function () {
    // this list can be move to appSettings.js
    const requiredTables = [
        USER,
        USER_MAPPING,
        SHIP,
        AUDIT_TRAIL,
        PARAMETERS,
        CONSTANT_PARAMETERS,
        CONSTANT_PARAMETERS_DATA,
        USE_CASES,
        FAILURE_ADVISORIES,
        FAILURE_ADVISORIES_REFERENCES_CAUSES,
        CAUSES,
        RULES_CSV_DATA,
        PARAMETER_CSV_DATA,
        CAUSES_REFERENCES_RULE_CONFIG,
        RULE_BLOCKS,
        RULE_CONFIGS,
        UNITS,
        CALCULATED_EXPRESSION,
        PARAMETER_SOURCE,
        RTDAS_REGISTRATION,
        PARAMETERS_REFERENCES_RULE_CONFIG,
        RULE_CONFIGS_REFERENCES_RULE_BLOCKS,
        TRIGGERED_OUTCOMES_TODAY,
        TRIGGERED_OUTCOMES_HISTORY,
        COMPANY_REGISTRATION,
        WIDGETS_PARAMETERS,
        MACHINES,
        USER_WIDGETS_PARAMETERS,
        RTDAS_REAL_TIME_DATA,
        RTDAS_REAL_TIME_ONE_DAY_DATA,
        SISTER_VESSEL_GROUP,
        FLEET,
        VOYAGE_FORECAST,
        STORM_GLASS_WEATHER,
        VESSEL_JOURNEY_COUNTER,
        USER_COUNTER,
        TOKENS,
        GRAPH_DATA,
        MRV_NOON_REPORT,
        XPRESS_MRV_NOON_REPORT,
        EU_PORTS,
        WIDGET_TAG_MAPPING,
        HYDROSTATIC
    ];

    // need to implement behaviour here
    let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const fetchAllApplicationTablesQuery = "SELECT table_name\n" +
        " FROM information_schema.tables\n" +
        " WHERE table_schema='" + appSettingsModel.getAppSettingsJsonData().db.postgresql.schemaName + "'\n" +
        " AND table_type='BASE TABLE';";
    const dbResponse = await DataAccessAdaptor.executeQueryAsync(fetchAllApplicationTablesQuery, []);

    if (!dbResponse) {
        return;
    }
    const existingTables = [];

    dbResponse.rows.map(k => {
        existingTables.push(k["table_name"])
    });

    for (let index in requiredTables) {
        const tableName = requiredTables[index];
        if (!requiredTables.hasOwnProperty(tableName) && existingTables.includes(tableName)) {
            continue;
        }

        switch (tableName) {
            case SHIP:
                await ShipModel.createTable();
                break;

            case USER:
                await UserModel.createTable();
                break;

            case USER_MAPPING:
                await UserMappingModel.createTable();
                break;

            case AUDIT_TRAIL:
                await AuditTrailModel.createTable();
                break;

            case CONSTANT_PARAMETERS:
                await ConstantParametersModel.createConstantParametersTable();
                break;

            case CONSTANT_PARAMETERS_DATA:
                await ConstantParametersModel.createConstantParametersDataTable();
                break;

            case USE_CASES:
                // await UseCasesModel.createTable();
                break;

            case FAILURE_ADVISORIES:
                await FailureAdvisoriesModel.createTable();
                break;

            case FAILURE_ADVISORIES_REFERENCES_CAUSES:
                await FailureAdvisoriesModel.createFailureAdvisoriesReferencesCausesTable();
                break;

            case CAUSES:
                await CausesModel.createTable();
                break;

            case RULES_CSV_DATA:
                await RuleCsvModal.createTable();
                break;

            case PARAMETER_CSV_DATA:
                await ParameterCsvModal.createTable();
                break;

            case CAUSES_REFERENCES_RULE_CONFIG:
                await CausesModel.createCausesReferencesRuleConfigTable();
                break;

            case RULE_BLOCKS:
                await  RuleBlocksModel.createTable();
                break;

            case RULE_CONFIGS:
                await RulesModel.createTable();
                break;

            case PARAMETERS:
                await ParametersModel.createTable();
                break;

            case UNITS:
                await UnitsModel.createTable();
                break;

            case CALCULATED_EXPRESSION:
                await CalculatedExpressionModel.createTable();
                break;

            case PARAMETER_SOURCE:
                //await ParameterSourceModel.createTable();
                break;

            case RTDAS_REGISTRATION:
                await RTDASModel.createTable();
                break;

            case PARAMETERS_REFERENCES_RULE_CONFIG:
                await ParametersModel.createParametersReferencesRuleConfigTable();
                break;

            case RULE_CONFIGS_REFERENCES_RULE_BLOCKS:
                await RulesModel.createRuleConfigsReferencesRuleBlocksTable();
                break;

            case TRIGGERED_OUTCOMES_TODAY:
                await OutcomesTodayModel.createTable();
                break;

            case TRIGGERED_OUTCOMES_HISTORY:
                await OutcomesHistoryModel.createTable();
                break;

            case COMPANY_REGISTRATION:
                await CompanyRegistrationModel.createTable();
                break;

            case WIDGETS_PARAMETERS:
                //await WidgetsParametersModel.createTable();
                break;

            case MACHINES:
                await MachineModel.createTable();
                break;

            case USER_WIDGETS_PARAMETERS:
                //await UserWidgetsParametersModel.createTable();
                break;

            case RTDAS_REAL_TIME_DATA:
                await RealTimeDataModel.createTable();
                break;

            case RTDAS_REAL_TIME_ONE_DAY_DATA:
                await RealTimeOneDayDataModel.createTable();
                break;

            case SISTER_VESSEL_GROUP:
                await SisterVesselModel.createTable();
                break;

            case FLEET:
                await FleetModel.createTable();
                break;

            case VOYAGE_FORECAST:
                await VoyageForecastModel.createTable();
                break;

            case STORM_GLASS_WEATHER:
                await StormGlassWeatherModel.createTable();
                break;

            case VESSEL_JOURNEY_COUNTER:
                await VesselJourneyCounterModel.createTable();
                break;

            case TOKENS:
                await TokenModal.createTable();
                break;

            case USER_COUNTER:
                await TokenModal.createUserCounterTable();
                break;

            case GRAPH_DATA:
                await GraphDataModel.createTable();
                break;

            case MRV_NOON_REPORT:
                await MRVNoonReportModel.createTable();
                break;

            case XPRESS_MRV_NOON_REPORT:
                await MRVNoonReportModel.createXpressNoonTable();
                break;

            case EU_PORTS:
                await EUPortsModel.createTable();
                break;

            case WIDGET_TAG_MAPPING:
                await widgetMappingModel.createTable();
                break;

                case REPORT_TABLE_DATA:
                    await PdfModel.createTable();
                    break;
        }
    }
};

const loadDataInMemory = async function () {
    await mrvNoonReportController.loadHydrostaticInMemory();
    await ShipModel.loadShipJsonDataInMemory();
    await ShipModel.loadAllVesselsDataInMemory();
    await ParametersModel.loadParametersJsonDataInMemory();
    await ParametersModel.loadParametersReferencesRuleConfigJsonDataInMemory();
    await RulesModel.loadRuleConfigsJsonDataInMemory();
    await RulesModel.loadRuleConfigsReferencesRuleBlocksJsonDataInMemory();
    await RuleBlocksModel.loadRuleBlocksJsonDataInMemory();
    // await RuleBlocksModel.loadRuleBlockReferenceCauseJsonDataInMemory();
    await CausesModel.loadCausesJsonDataInMemory();
    await CausesModel.loadCausesReferencesRuleConfigJsonDataInMemory();
    await FailureAdvisoriesModel.loadFailureAdvisoriesJsonDataInMemory();
    await FailureAdvisoriesModel.loadFailureAdvisoriesReferencesCausesJsonDataInMemory();
    // await CalculatedExpressionModel.loadCalculatedExpressionJsonDataInMemory();
    // await ConstantParametersModel.loadConstantParametersJsonDataInMemory();
    // await ParameterSourceModel.loadParameterSourcesJsonDataInMemory();
    // await RTDASModel.loadRTDASRegistrationJsonDataInMemory();
    await UnitsModel.loadUnitsJsonDataInMemory();
    // await WidgetsParametersModel.loadWidgetsParametersJsonDataInMemory();
    await MachineModel.loadMachineJsonDataInMemory();
    await VesselJourneyCounterModel.loadVesselJourneyCounterJsonDataInMemory();
    await VoyageForecastModel.loadVoyageForecastJsonDataInMemory();
    await GraphDataModel.loadGraphJsonDataInMemory();
    await EUPortsModel.loadEUPortsDataInMemory();
    await widgetMappingModel.loadWidgetTagMappingJsonDataInMemory();
    await widgetsParametersController.loadAllFilesStateJsonsInMemory();
    await mrvNoonReportController.loadMrvDataInMemory();
    await MRVNoonReportModel.loadAllMRVBannerDataDataInMemory();
};

const scheduleRuleBlocksForExecution = async function () {
    const ruleExecutionSingletonController = RuleExecutionSingletonController.getInstance();

    const allRegisteredVessels = ShipModel.getAllVesselsData();
    for (let i = 0; i < allRegisteredVessels.length; i++) {
        const vesselData = allRegisteredVessels[i];
        const vesselId = vesselData.id;
        ruleExecutionSingletonController.createInstance(vesselId);
        const vesselInst = ruleExecutionSingletonController.getVesselInstanceByVesselId(vesselId);
        vesselInst.setInstVesselId(vesselId);
    }

    ruleExecutionSingletonController.scheduleAllRulesForAllVesselInstances();
};

const scheduleEmailsForModbusData = async function () {
    const emailSchedulerInstance = EmailScheduler.getInstance();
    const initialTimestamp = Util.getNewDate();

    const allRegisteredVessels = ShipModel.getAllVesselsData();
    for (let i = 0; i < allRegisteredVessels.length; i++) {
        const vesselData = allRegisteredVessels[i];
        const vesselId = vesselData.id;
        emailSchedulerInstance.setEmailSchedulerData(vesselId, initialTimestamp);
    }
};

const performServerStartupActions = async function () {
    await createAllApplicationTables();
    await loadDataInMemory();
    await scheduleRuleBlocksForExecution();
    await scheduleEmailsForModbusData();
};

module.exports = {
    createAllApplicationTables: createAllApplicationTables,
    loadDataInMemory: loadDataInMemory,
    scheduleRuleBlocksForExecution: scheduleRuleBlocksForExecution,
    performServerStartupActions: performServerStartupActions
};