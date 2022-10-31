'use strict';

const DataAccessAdaptorSingleton = require("../adaptors/dataAccessAdaptorSingleton");
const {updateUserMappingByUserId, getUserMappingByUserId, saveUserMapping, deleteUserMappingByUserId} = require("./UserMappingModel");
const {USER} = require("../utils/tables");
const {USER_MAPPING} = require("../utils/tables");
let allUserJsonData = null;

exports.getAllUser = async () => {
    if (allUserJsonData == null) {
        allUserJsonData = await exports.getAllUserData();
    }
    return allUserJsonData;
};

exports.getAllUserData = async () => {
    // const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    // const query = `SELECT 
    // firstname as "FirstName",
    // shipname as "ShipName",
    // lastname as "LastName",
    // mobilenumber as "MobileNumber",
    // email as "Email",
    // role as "Role",
    // id as "uId",
    // companyName as "CompanyName",
    // registeruser as "registerUser"
    
    // FROM "${USER}" where status`;

    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const query = `SELECT 
    firstname as "FirstName",
    shipname as "ShipName",
    lastname as "LastName",
    mobilenumber as "MobileNumber",
    email as "Email",
    role as "Role",
     screenmapping as "ScreenMapping",
    "${USER}".id as "uId",
    "${USER_MAPPING}".userid as "uId",
    companyName as "CompanyName",
    registeruser as "registerUser"
    FROM "${USER}" 
    INNER JOIN "${USER_MAPPING}" ON "${USER}".id="${USER_MAPPING}".userid where status`;
    
    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);
    if (dbResponse) {
        dbResponse.rows.map((responseData, i) => {
            dbResponse.rows[i].ShipName = JSON.parse(responseData.ShipName);
        });
    } else {
        console.error("Error while fetching data from User table :: ");
    }
    return dbResponse.rows;

};

exports.getUserById = async (userId) => {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const selectQuery = `SELECT id,
    firstname as "FirstName", 
    lastname as "LastName",
    shipname as "ShipName",
    mobilenumber as "MobileNumber",
    email as "Email",
    password as "Password",
    role as "Role",
    createships as "CreateShips",
    createrules as "CreateRules",
    editrules as "EditRules",
    companyname as "CompanyName"
    FROM "${USER}"
     where id  = ${userId};`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(selectQuery, null);

    if (dbResponse) {
        console.log("Fetched User from User Table")
        dbResponse.rows.map((responseData, i) => {
            dbResponse.rows[i].ShipName = JSON.parse(responseData.ShipName);
        });
        const userMapping = await getUserMappingByUserId(userId);
        if(userMapping) {
            dbResponse.rows[0] = {
                ...dbResponse.rows[0],
                ...userMapping[0]
            };
            return dbResponse.rows;
        } else {
            return null;
        }
    } else {
        console.error("Error Occurred While fetching User from User Table");
        return null;
    }
};

exports.userExists = async function (email) {
    const lowerEmail = email.toLowerCase();
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const query = `SELECT * FROM "${USER}" where lower(email) = '${lowerEmail}';`;
    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);
    if (dbResponse) {
        return dbResponse.rowCount === 1;
    } else {
        console.error("Error while fetching data from User table :: ");
        return false
    }
};


exports.saveUser = async function (userData) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const insertQuery = `INSERT INTO "${USER}" 
    (companyname,createrules,createships,editrules,email,firstname,lastname,mobilenumber,password,role,shipname,registeruser)
    values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id, email`;


    const dbResponse = await DataAccessAdaptor.executeQueryAsync(insertQuery,
        [
            userData.CompanyName,
            userData.CreateRules,
            userData.CreateShips,
            userData.EditRules,
            userData.Email,
            userData.FirstName,
            userData.LastName,
            userData.MobileNumber,
            userData.Password,
            userData.Role,
            userData.ShipName,
            userData.registerUser
        ]);

    if (dbResponse) {
        userData.userId = dbResponse.rows[0].id;
        const userMappingSaved = await saveUserMapping(userData);
        if(userMappingSaved) {
            return dbResponse.rows[0];
        } else {
            return {};
        }
    } else {
        console.error("Error while saving user::");
        return {};
    }

};


exports.validateUser = async (user) => {
    const lowerEmail = user.Email.toLowerCase();
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    let responseData = [];
    const query = `SELECT * FROM "${USER}" where status and lower(email) = $1 and password = $2`;
    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, [lowerEmail, user.Password]);
    if (dbResponse) {
        responseData = dbResponse.rows;
    } else {
        console.error("Error while fetching data from User table :: ");
    }
    return responseData;
};

exports.updateUserById = async (User) => {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const userId = User.id;

    delete User['id'];
    let queryBuilder = "";

    Object.entries(User).map((k, v) => {
        if(k[0] !== "ScreenMapping" && k[0] !== "DefaultScreenMapping") {
            queryBuilder += k[0].toLowerCase() + " = '" + k[1] + "' , ";
        }
    });

    queryBuilder = queryBuilder.substring(0, queryBuilder.length - 2);

    const updateQuery = `UPDATE "${USER}" SET ${queryBuilder} where id = ${userId} RETURNING id, email;`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(updateQuery, null);

    if (dbResponse) {
        if(User.ScreenMapping || User.DefaultScreenMapping) {
            const userMapping = await updateUserMappingByUserId(User.ScreenMapping, User.DefaultScreenMapping, userId);
            if(userMapping) {
                return dbResponse.rows[0];
            } else {
                return {};
            }
        } else {
            return dbResponse.rows[0];
        }
    } else {
        console.error("Error Occurred While Updating UserById from User Table");
        return {};
    }
};

exports.deleteUserById = async function (userId) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const deleteQuery = `DELETE from "${USER}" where id = ${userId} RETURNING userid, email, role;`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(deleteQuery, null);
    const userMapping = await deleteUserMappingByUserId(userId);

    if (dbResponse) {
        console.log("Deleting User Data By ID from USER Table")
        return dbResponse.rows[0];
    } else {
        console.error("Error Occurred While Deleting User Data By ID from USER Table");
        return await this.deactivateUserById(userId).then(dbResponse =>{
           return dbResponse ? dbResponse : {};
        });
    }
};


exports.deactivateUserById = async function (userId) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const updateQuery = `UPDATE "${USER}" SET status = false, email = CONCAT(email,'.#.',id) where id = ${userId} 
    RETURNING id, split_part(email, '.#.',1) as email, role;`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(updateQuery, null);

    if (dbResponse) {
        console.log("Deactivating User By ID from USER Table")
        return dbResponse.rows[0];
    } else {
        console.error("Error Occurred While Deactivating User By ID from USER Table");
        return {};
    }
};

exports.createTable = async function () {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `create table "${USER}"
    (
        id serial
        constraint ${USER}_pk
            primary key,
        companyName varchar,
        createRules boolean,
        createShips boolean,
        editRules boolean,
        email varchar(320),
        firstName varchar(200),
        lastName varchar(200),
        mobileNumber varchar(50),
        password varchar,
        role varchar(50),
        shipName varchar,
        registerUser integer,
        status boolean default true
    );
    
    create unique index ${USER}_email_uindex
    on "${USER}" (Email);
    `;

    await DataAccessAdaptor.executeQueryAsync(query, null)
        .then(resp => {
            if (resp)
                console.log("User Table Created")
            else
                console.error("Could Not Create User Table");
        })
};

exports.getEmail = async (email) => {
    const lowerEmail = email.toLowerCase();
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const selectQuery = `SELECT * FROM "${USER}" where lower(email) = '${lowerEmail}';`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(selectQuery, null);

    if (dbResponse) {
        return dbResponse.rowCount === 1;
    } else {
        console.error("Error Occurred While fetching User from User Table");
        return false;
    }
};

exports.updateUserShips = async function (userId, Ships) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    let status = false;
    const updateQuery = `UPDATE "${USER}" SET shipname = '${Ships}' where id = ${userId};`

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(updateQuery, null);

    if (dbResponse) {
        status = dbResponse.rowCount >= 1;
    } else {
        console.error("Error while Updating user ship::");
    }
    return status;

};


exports.updateUserPasswordByEmail = async function (user) {
    const lowerEmail = user.email.toLowerCase();
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    let status = false;
    const updateQuery = `UPDATE "${USER}" SET password = $1 where lower(email) = $2;`

    const values = [user.encPassword, lowerEmail]
    const dbResponse = await DataAccessAdaptor.executeQueryAsync(updateQuery, values);

    if (dbResponse) {
        status = dbResponse.rowCount === 1;
    } else {
        console.error("Error while Updating user Password::");
    }
    return status;
}

exports.updateCompanyOfUsers = async (oldCompanyName, newCompanyName) => {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    let rowCount = false;
    const updateQuery = `UPDATE "${USER}" SET companyname = '${newCompanyName}' where companyname = '${oldCompanyName}' and status;`

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(updateQuery, null);

    if (dbResponse) {
       if(dbResponse.rowCount >= 1){
           console.log("Company Name Updated into User Table")
       }
    } else {
        console.error("Error while Updating user Company::");
    }
};

exports.getAllShips = async function (userId) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    let nameArray = [];

    const selectQuery = `SELECT shipname from "${USER}" where id = ${userId};`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(selectQuery, null);

    if (dbResponse) {
        nameArray = JSON.parse(dbResponse.rows[0].shipname);
    } else
        console.error("Error Occurred While Fetching Data From Ship Table");

    return nameArray;
};

exports.getDiData = async function (userId) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    let nameArray = {};

    const selectQuery = `SELECT * from diusers where userid = ${userId};`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(selectQuery, null);

    if (dbResponse.rows.length > 0) {
        nameArray = dbResponse.rows[0];
    } else
        nameArray = {
            "userid" : 4,
            "u1" : "smartshiphub",
            "p1" : "Insight@007",
            "u2" : "smartship",
            "p2" : "Insight@007"
    }

    return nameArray;
};

exports.getUserByShipId = async (shipId) => {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const selectQuery = ` SELECT * FROM "${USER}" WHERE shipname LIKE '%${shipId}%';`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(selectQuery, null);

    if (dbResponse) {
        console.log("Fetched User from User Table by ship id")
        return dbResponse.rows;
    } else {
        console.error("Error Occurred While fetching User from User Table by ship id");
        return null;
    }
};