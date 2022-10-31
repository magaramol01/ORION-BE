'use strict';

const DataAccessAdaptorSingleton = require("../adaptors/dataAccessAdaptorSingleton");
const {TOKENS, USER_COUNTER}  = require("../utils/tables");

exports.createTable = async function (){
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `create table ${TOKENS}
    (
        id serial
        constraint ${TOKENS}_pk
            primary key,
        email varchar,
        expireTime timestamp,
        issueTime timestamp,
        password varchar
    );`;

    await DataAccessAdaptor.executeQueryAsync(query, null)
        .then(resp => {
            if (resp)
                console.log("Tokens Table Created")
            else
                console.error("Could Not Create Tokens Table");
        })
};

exports.createUserCounterTable = async function (){
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `create table ${USER_COUNTER}
    (
        id serial
        constraint ${USER_COUNTER}_pk
            primary key,
        counter integer,
        date date,
        userName varchar(320)
    );`;

    await DataAccessAdaptor.executeQueryAsync(query, null)
        .then(resp => {
            if (resp)
                console.log("UserCounter Table Created")
            else
                console.error("Could Not Create UserCounter Table");
        })
};

exports.insertToken = async (TokenDetails) => {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const reThinkDb = DataAccessAdaptor.getDBReference();
    let causes = [];

    try {
        causes = await new Promise((resolve, reject) => {
            reThinkDb.table('tokens')
                .insert(TokenDetails)
                .run(DataAccessAdaptor.connection, function (err, cursor) {
                    if (err) {
                        console.log(err);
                        //throw err;
                    }
                    resolve(cursor);
                });
        });

        return causes;
    } catch (e) {
        console.log(e)
    }
};

exports.getAllTokensData = async () => {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const reThinkDb = DataAccessAdaptor.getDBReference();
    let userJson = {};
    let data = [];
    try {
        data = await new Promise((resolve, reject) => {
            reThinkDb.table('tokens')
                .run(DataAccessAdaptor.connection, function (err, cursor) {
                    if (err) {
                        console.log(err);
                        //throw err;
                    }
                    const userData = cursor.toArray(function (err, result) {
                        if (err) {
                            //throw err;
                            console.log(err);
                        }
                    });
                    resolve(userData);
                });
        });

        data.forEach(cause => {
            const causeId = cause.id;
            delete cause.id;
            userJson[causeId] = cause;
        });

        return userJson;
    } catch (e) {
        console.log(e);
    }
};

exports.getAllUserCounterData = async () => {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const selectQuery = `SELECT id, counter, date, username as "userName"  from ${USER_COUNTER};`;
    const dbResponse = await DataAccessAdaptor.executeQueryAsync(selectQuery, null);

    if (dbResponse) {
        console.log("Fetched All UserCounter Data from UserCounter Table");
        const userCounterJsonData = {};

        dbResponse.rows.map(item => {
            userCounterJsonData[item.id] = item;
        });
        return userCounterJsonData;
    } else {
        console.error("Error Occurred While fetching UserCounter Data from UserCounterTable");
        return {};
    }
};

exports.insertUserCounter = async (TokenDetails) => {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const insertQuery = `INSERT INTO ${USER_COUNTER}
    (counter, date, username) VALUES($1, $2, $3) RETURNING id;`;

    const values = [ TokenDetails.counter, TokenDetails.date, TokenDetails.userName ];

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(insertQuery, values);

    if (dbResponse) {
        console.log("UserCounter Data Inserted In UserCounter Table");
        return dbResponse.rowCount === 1;
    } else {
        console.error("Error Occurred While Inserting UserCounter Data In UserCounter Table");
        return false;
    }
};

exports.updateUserCounter = async (key,counterValue) => {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const updateQuery = `UPDATE ${USER_COUNTER} SET counter = ${counterValue} where id = ${key};`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(updateQuery, null);

    if (dbResponse) {
        console.log("Updated UserCounter In UserCounter Table")
        return dbResponse.rowCount === 1;
    } else {
        console.error("Error Occurred While Updating UserCounter In UserCounter Table");
        return false;
    }
};