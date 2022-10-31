'use strict';

const {Pool, Client} = require('pg');
const appSettingsModel = require('../models/appSettingsModel');

let DataAccessAdaptor = null;

exports.getInstance = function () {
    if (!DataAccessAdaptor) {
        DataAccessAdaptor = new DataAccessAdaptorSingleton();
    }
    return DataAccessAdaptor;
};

exports.initializeInstance = function () {
    if (!DataAccessAdaptor) {
        DataAccessAdaptor = new DataAccessAdaptorSingleton();
    }
};

class DataAccessAdaptorSingleton {

    constructor() {
        this.dbSettings = appSettingsModel.getAppSettingsJsonData().db.postgresql;
        this.createDatabasePool();
    }

    createDatabasePool() {
        this.pool = new Pool({
            host: this.dbSettings.host,
            port: this.dbSettings.port,
            user: this.dbSettings.user,
            password: this.dbSettings.password,
            database: this.dbSettings.databaseName,
            Client: EnhancedClient,
        });
    }
    executeQuery(query, queryParams) {
        this.pool.connect((err, client, release) => {
            if (err) {
                console.error(err);
            }
            client.query(query, queryParams, (err, result) => {
               release();
                if (err) {
                    console.error(err);
                }
            })
        });
    }

    async executeQueryAsync(query, queryParams) {
        const client = await this.pool.connect();
        try {
            return await client.query(query, queryParams);
        } catch (err) {
            console.error("db query error ---->",err);
            return null;
        } finally {
           client.release(); // Make sure to release the client
        }
    }

    getConnectionPool() {
        return this.pool;
    }

}

class EnhancedClient extends Client {

    getStartupConf() {
        const schemaName = appSettingsModel.getAppSettingsJsonData().db.postgresql.schemaName;

        if (schemaName) {
            try {
                const options = {
                    "search_path": schemaName
                };
                return {
                    ...super.getStartupConf(),
                    ...options,
                };
            } catch (err) {
                console.error(err);
            }
        }

        return super.getStartupConf();
    }

}