'use strict';

const DataAccessAdaptorSingleton = require("../adaptors/dataAccessAdaptorSingleton");
const {SHIP, USER}  = require("../utils/tables");
let {Util} = require("../utils/util");

let shipJsonData = null;
let allVesselsData = null;

exports.loadShipJsonDataInMemory = async function () {
    if (shipJsonData === null) {
        shipJsonData = await this.getAllShipMappingNamesAndIds();
    }
};

exports.getAllShipJsonData = function () {
    return shipJsonData;
};

exports.getShipIdByMappingName = function (mappingName) {
    return shipJsonData[mappingName];
};

exports.getShipMappingNameById = function (shipId) {
    for (let [key, value] of Object.entries(shipJsonData)) {
        if(value === shipId)
            return key;
    }
    return undefined;
};

exports.syncShipJsonData = async function () {
    shipJsonData = null;
    shipJsonData = await this.getAllShipMappingNamesAndIds();
};

exports.getAllShipMappingNamesAndIds = async function () {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    let responseArr = {};
    const selectQuery = `SELECT id, mappingname  from ${SHIP};`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(selectQuery, null);

    if (dbResponse) {
        console.log("Fetched All IDs and Mapping Names from Ship Table")
        dbResponse.rows.map(item => {
            responseArr[item.mappingname] = item.id;
        });
    } else
        console.error("Error Occurred While fetching All IDs and Mapping Names from Ship Table");

    return responseArr;
};

exports.updateShipDataById = async (Ship) => {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const shipId = Ship.id;

    delete Ship['id'];
    delete Ship['oldShipName'];
    delete Ship['userId'];

    let queryBuilder = "";

    Object.entries(Ship).map((k,v) =>{
        if (k[0] === "MakingDate" || k[0] === "PurchaseDate") {
            queryBuilder += k[0].toLowerCase() + " = TO_DATE('" + k[1] + "' , 'DD-MM-YYYY'), ";
        } else {
            queryBuilder += k[0].toLowerCase() + " = '" + k[1] + "' , ";
        }
    });

    queryBuilder = queryBuilder.substring(0, queryBuilder.length - 2);

    const updateQuery = `UPDATE ${SHIP} SET ${queryBuilder} where id = ${shipId} RETURNING id, name;`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(updateQuery, null);

    if (dbResponse) {
        console.log("Updated ShipById from Ship Table")
        return dbResponse.rows[0];
    } else {
        console.error("Error Occurred While Updating ShipById from Ship Table");
        return {};
    }
};

exports.deleteShipDataById = async (ShipID) => {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const deleteQuery = `DELETE from ${SHIP} where id = ${ShipID} RETURNING id, name, mappingname as "MappingName";`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(deleteQuery, null);

    if (dbResponse) {
        console.log("Deleting Ship Data By ID from Ship Table")
        return dbResponse.rows[0];
    } else {
        console.error("Error Occurred While Deleting Ship Data By ID from Ship Table");
        return {};
    }
};

exports.getAllData = async function () {
    if(!Util)
        Util = require("../utils/util").Util;

    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const selectQuery = `SELECT id, name as "Name", category as "Category", mappingname as "MappingName", makingyard as "MakingYard", to_char(makingdate, '${Util.getDBCommonDateOnlyFormat()}') as "MakingDate",
     to_char(purchasedate, '${Util.getDBCommonDateOnlyFormat()}') as "PurchaseDate", registeredcountry as "RegisteredCountry", homeport as "HomePort", mmsi as "Mmsi", callsign as "CallSign", imo as "Imo", sistergroup as "SisterGroup", fleet as "Fleet"  from ${SHIP};`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(selectQuery, null);

    if (dbResponse) {
        console.log("Fetched All Ships Data from Ship Table");
        return dbResponse.rows;
    } else {
        console.error("Error Occurred While fetching data from Ship Table");
        return [];
    }
};

exports.getShipDataById = async (ShipID) => {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const selectQuery = `SELECT id, name as "Name", category as "Category", makingyard as "MakingYard", to_char(makingdate, '${Util.getDBCommonDateOnlyFormat()}') as "MakingDate",
     to_char(purchasedate, '${Util.getDBCommonDateOnlyFormat()}') as "PurchaseDate", registeredcountry as "RegisteredCountry", homeport as "HomePort", mappingname as "MappingName",
       imo as "Imo", mmsi as "Mmsi", callsign as "CallSign", flag as "Flag", length as "Length", sistergroup as "SisterGroup", fleet as "Fleet" from ${SHIP}
     where id = ${ShipID};`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(selectQuery, null);

    if (dbResponse) {
        dbResponse.rows.map((responseData, i) => {
            dbResponse.rows[i].Fleet = JSON.parse(responseData.Fleet);
        });
        return dbResponse.rows;
    } else {
        console.error("Error Occurred While fetching ShipById from Ship Table");
        return null;
    }
};

exports.saveShip = async function (Ship) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

      let FleetArray =  JSON.stringify(Ship.Fleet);

    const insertQuery = `INSERT INTO ${SHIP}
    (name, mappingname, category, makingyard, makingdate, purchasedate, registeredcountry,
     homeport, imo, mmsi, callsign, flag, length, userid, sistergroup, fleet)
      VALUES($1, $2, $3, $4, TO_DATE($5, 'DD-MM-YYYY'), TO_DATE($6, 'DD-MM-YYYY'), $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING id;`;

    const values = [
        Ship.Name, Ship.MappingName, Ship.Category, Ship.MakingYard, Ship.MakingDate,
        Ship.PurchaseDate, Ship.RegisteredCountry, Ship.HomePort, Ship.Imo, Ship.Mmsi,
        Ship.CallSign, Ship.Flag, Ship.Length, Ship.userId, Ship.SisterGroup, FleetArray
    ];

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(insertQuery, values);

    if (dbResponse) {
        console.log("Ship Record Inserted In Ship Table");
        return dbResponse.rows[0];
    } else {
        console.error("Error Occurred While Inserting Ship Record In Ship Table");
        return {};
    }
};

exports.createTable = async function () {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `create table ${SHIP}
    (
        id serial
        constraint ${SHIP}_pk
            primary key,
        callSign varchar,
        category varchar,
        flag varchar,
        homePort varchar,
        imo varchar,
        length varchar,
        makingDate date,
        makingYard varchar,
        mappingName varchar,
        mmsi varchar,
        name varchar,
        purchaseDate date,
        registeredCountry varchar(150),
        sistergroup varchar(50),
        fleet varchar(100),
        userId integer
            constraint ${SHIP}_${USER}_id_fk
                references "${USER}"
    );`;

    await DataAccessAdaptor.executeQueryAsync(query, null)
        .then(resp => {
            if (resp)
                console.log("Ship Table Created")
            else
                console.error("Could Not Create Ship Table");
        })
};

exports.getAllShipNames = async () => {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const selectQuery = `SELECT id,name from ${SHIP};`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(selectQuery, null);

    if (dbResponse) {
        return dbResponse.rows;
    } else {
        console.error("Error Occurred While Fetching Data From Ship Table");
        return [];
    }
};

exports.getAllShipNamesBySister = async (data) => {

    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    let selectQuery;
    if(data == "Select All") {
        selectQuery = `SELECT id,name,mappingname from ${SHIP};`;
    }
    else {
        selectQuery = `SELECT id,name,mappingname from ${SHIP} where sistergroup = '${data}';`;
    }
    const dbResponse = await DataAccessAdaptor.executeQueryAsync(selectQuery, null);

    if (dbResponse) {
        return dbResponse.rows;
    } else {
        console.error("Error Occurred While Fetching Data From Ship Table");
        return [];
    }
};


exports.getAllShipNamesByFleet = async (data) => {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const selectQuery = `SELECT id,name,mappingname,fleet from ${SHIP}`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(selectQuery, null);
    if (dbResponse) {
        return dbResponse.rows;
    } else {
        console.error("Error Occurred While Fetching Data From Ship Table");
        return [];
    }


};

exports.getAllShipsForRegistration = async () => {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    let nameArray = [];

    const selectQuery = `SELECT name from ${SHIP};`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(selectQuery, null);

    if (dbResponse) {
        dbResponse.rows.map(k =>{
            nameArray.push(k['name']);
        });
    } else
        console.error("Error Occurred While Fetching Data From Ship Table");

    return nameArray;
};

exports.loadAllVesselsDataInMemory = async function () {
    if (allVesselsData === null) {
        allVesselsData = await this.getAllData();
    }
};

exports.getAllVesselsData = function () {
    return allVesselsData;
};

exports.getDetailedShipDataById = function (vesselId) {
    for (let i = 0; i < allVesselsData.length; i++) {
        const vesselData = allVesselsData[i];
        if (vesselId === vesselData.id) {
            return vesselData;
        }
    }

    return allVesselsData[vesselId];
};

exports.syncAllVesselsData = async function () {
    allVesselsData = null;
    allVesselsData = await this.getAllData();
};