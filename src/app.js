const nconf = require('nconf');
const server = require('./server');
const {loadSettings} = require('./config/configurationAdaptor');
const RuleExecutionByRuleBlockSingleton = require('./api/controllers/ruleExecutionByRuleBlockSingleton');

// const appSettingsPath = process.env.APP_SETTINGS_FILE_PATH;
// const appSettingsPath = "F:\\Vessel Projects Source Code\\RuleEngineNode\\src\\config\\appSettings.json";
const appSettingsModel = require('./api/models/appSettingsModel');
const appSettingsPath = appSettingsModel.getAppSettingsJsonData();
const constantParameterModel = require('./api/models/constantParameterModel');

loadSettings({appSettingsPath})
    .then(() => {
        // TODO Connect to DB, if any.

        // Read the config property required for starting the server
        // const ruleExecutionByRuleBlockSingleton = new RuleExecutionByRuleBlockSingleton().getInstance();
        // ruleExecutionByRuleBlockSingleton.getConstantAndStore();

        const serverOptions = {
            logSeverity: nconf.get('logSeverity'),
        };
        server.createServer(serverOptions);
    })
    .catch((err) => {
        console.log(err);
    });
