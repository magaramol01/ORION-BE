'use strict';

require('log-timestamp');
const DataAccessAdaptorSingleton = require("../adaptors/dataAccessAdaptorSingleton");
const {Util} = require("../utils/util");
const {WEBEX_MEETINGS, MEETING_TOKENS, MEDIA_INFORMATION} = require("../utils/tables");

exports.getMeetings = async function () {
    let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    let upcomingMeetings = [];

    const query = `SELECT * FROM ${WEBEX_MEETINGS}`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);
    if (dbResponse) {
        upcomingMeetings = dbResponse.rows;
    } else {
        console.error("Error while fetching data from Webex Meetings Table!!!");
    }

    return upcomingMeetings;
};


exports.saveWebexMeeting = async function (meetingObj) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `INSERT INTO ${WEBEX_MEETINGS}` +
        `(meetingid, title, startdatetime, enddatetime, fromuser, touser, meetlink, agenda, status, mediainfo) VALUES (` +
        `$1, $2, $3, $4, $5, $6, $7, $8, $9, $10)` +
        ` RETURNING *;`;
    const values = [
        meetingObj.id,
        meetingObj.title,
        meetingObj.start,
        meetingObj.end,
        meetingObj.fromUser,
        meetingObj.toUser,
        meetingObj.webLink,
        meetingObj.agenda,
        "scheduled",
        meetingObj.mediainfo
    ];


    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, values);
    if (dbResponse) {
        console.log("Webex Meeting Scheduled Record Inserted In WEBEX MEETINGS Table");
        return dbResponse.rows[0];
    } else {
        console.error("Error Occurred While Inserting Webex Meeting Scheduled Record In WEBEX MEETINGS Table");
        return {};
    }
};

exports.updateWebexMeeting = function (meetingObj) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `UPDATE ${WEBEX_MEETINGS} SET ` +
        `title = $1, startdatetime = $2, enddatetime = $3, fromuser = $4, touser = $5, agenda = $6 , status = $7 where meetingid = $8 ;`;
    const values = [
        meetingObj.title,
        meetingObj.start,
        meetingObj.end,
        meetingObj.fromUser,
        meetingObj.toUser,
        meetingObj.agenda,
        meetingObj.meetingStatus,
        meetingObj.id
        ]

    const dbResponse = DataAccessAdaptor.executeQueryAsync(query, values);
    if (dbResponse) {
        console.log("Webex Meeting Scheduled Record Inserted In WEBEX MEETINGS Table");
        return true;
    } else {
        console.error("Error Occurred While Inserting Webex Meeting Scheduled Record In WEBEX MEETINGS Table");
        return false;
    }
};

exports.updateMeetingStatus = async function (meetingNumber,statusValue) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `UPDATE ${WEBEX_MEETINGS} SET` +
        ` status = $1 where meetingid = $2 RETURNING id;`;
    const values = [statusValue, meetingNumber]

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, values);
    if (dbResponse) {
        console.log("Webex Meeting Scheduled Record Inserted In WEBEX MEETINGS Table");
        return dbResponse.rows[0];
    } else {
        console.error("Error Occurred While Inserting Webex Meeting Scheduled Record In WEBEX MEETINGS Table");
        return {};
    }
};

exports.createTable = async function () {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `CREATE TABLE ${WEBEX_MEETINGS}
    (
        id serial
        constraint ${WEBEX_MEETINGS}_pk
            primary key,
        meetingid varchar,
        title varchar,
        startdatetime varchar,
        enddatetime varchar,
        fromuser varchar,
        touser varchar,
        meetLink varchar,
        agenda varchar,
        status varchar,
        mediainfo varchar
    );`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);
    if (dbResponse) {
        console.log("Webex Meetings Table created successfully!!!");
    } else {
        console.error("Error while creating Webex Meetings Table!!!");
    }
};

exports.createMeetingTokensTable = async function () {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `CREATE TABLE ${MEETING_TOKENS}
    (
        id serial
        constraint ${MEETING_TOKENS}_pk
            primary key,
        userid integer,
        username varchar,
        issuedate timestamp,
        tokenid varchar,
        shiplist varchar
    );`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);
    if (dbResponse) {
        console.log("meetingtokens Table created successfully!!!");
    } else {
        console.error("Error while creating meetingtokens Table!!!");
    }
};

exports.checkTokenStatus = async function (userId, formatedDate) {
    let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    let upcomingMeetings = [];

    const query = `SELECT * FROM ${MEETING_TOKENS} where userid = ${userId} and issuedate = '${formatedDate}';`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);
    if (dbResponse) {
        upcomingMeetings = dbResponse.rows;
    } else {
        console.error("Error while fetching data from Webex Meetings Table!!!");
    }
    return upcomingMeetings;
};

exports.getTokenData = async function (token,formatedDate) {
    let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    let availabledata = [];

    const query = `SELECT * FROM ${MEETING_TOKENS} where tokenid = '${token}' and issuedate = '${formatedDate}';`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);
    if (dbResponse) {
        availabledata = dbResponse.rows;
    } else {
        return "Error occured while checking token data !!";
    }
    return availabledata
};

exports.insertMeetingToken = async function (tokenData) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `INSERT INTO ${MEETING_TOKENS}` +
        `(userid, username, issuedate, tokenid, shiplist) VALUES (` +
        `$1, $2, $3, $4, $5)` +
        ` RETURNING *;`;
    const values = [
        tokenData.userid,
        tokenData.username,
        tokenData.issuedate,
        tokenData.tokenid,
        tokenData.shiplist
    ];

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, values);
    if (dbResponse) {
        console.log("Meeting Token Record Inserted In MeetingToken Table");
        return true;
    } else {
        console.error("Error Occurred While Creating Token");
        return false;
    }
};

exports.createMediaInformationTable = async function () {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `CREATE TABLE ${MEDIA_INFORMATION}
    (
        id serial
        constraint ${MEDIA_INFORMATION}_pk
            primary key,
        username varchar,
        medianame varchar,
        mediadescription varchar,
        mediapath varchar,
        mediatype varchar
    );`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);
    if (dbResponse) {
        console.log("mediainformation Table created successfully!!!");
    } else {
        console.error("Error while creating mediainformation Table!!!");
    }
};

exports.getPreviousIdentifierArray = async function (meetingId) {
    let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    let mediaData = [];

    const query = `SELECT mediainfo FROM ${WEBEX_MEETINGS} where meetingid = '${meetingId}';`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);
    if (dbResponse) {
        mediaData = dbResponse.rows;
    } else {
        console.error("Error while fetching data from Webex Meetings Table!!!");
    }
    return mediaData;
};

exports.insertMediaInformationTable = async function (data) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `INSERT INTO ${MEDIA_INFORMATION}` +
        `(username, medianame, mediadescription, mediapath, mediatype) VALUES ($1, $2, $3, $4, $5) RETURNING *;`;
    const values = [
        data.userName,
        data.mediaName,
        data.mediaDescription,
        data.mediaPath,
        data.mediatype
    ];
    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, values);
    if (dbResponse) {
        console.log("MeetingInformation Record Inserted In MeetingToken Table");
        return dbResponse.rows[0].id;
    } else {
        console.error("Error Occurred While inserting MeetingInformation data");
        return false;
    }
};

exports.getMediaDataById = async function (mediaId) {
    let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    let mediaData = [];

    const query = `SELECT * FROM ${MEDIA_INFORMATION} where id = '${mediaId}';`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);
    if (dbResponse) {
        mediaData = dbResponse.rows;
    } else {
        return "Error occured while checking token data !!";
    }
    return mediaData
};

exports.updateMediaIdentifier = async function (meetingId,updatedIdentifierArray) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `UPDATE ${WEBEX_MEETINGS} SET mediainfo = $1 where meetingid = $2;`;
    const values = [updatedIdentifierArray, meetingId]

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, values);
    if (dbResponse) {
        console.log("Webex Meeting Scheduled Record Inserted In WEBEX MEETINGS Table");
        return true;
    } else {
        console.error("Error Occurred While Inserting Webex Meeting Scheduled Record In WEBEX MEETINGS Table");
        return false;
    }
};

exports.getAllSchedulesMeetings = async function (userName) {
    let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    let allMeetings = [];

    const query = `SELECT meetingid,title,startdatetime,enddatetime,fromuser,touser,meetlink,agenda,status,mediainfo FROM ${WEBEX_MEETINGS} where fromuser = '${userName}' order by startdatetime;`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);
    if (dbResponse) {
        allMeetings = dbResponse.rows;
    } else {
        return "Error occured while getting all data !!";
    }
    return allMeetings
};

// exports.getAllSchedulesMeetingsWithDate = async function (userName,status,startDate,endDate) {
//     let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
//     let allMeetings = [];
//
//     const query = `SELECT meetingid,title,startdatetime,enddatetime,fromuser,touser,meetlink,agenda,status,mediainfo FROM ${WEBEX_MEETINGS} where fromuser = '${userName}' and status = '${status}' and startdatetime >= '${startDate}' and startdatetime <= '${endDate}';`;
//
//     const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);
//     if (dbResponse) {
//         allMeetings = dbResponse.rows;
//     } else {
//         return "Error occured while getting all data !!";
//     }
//     return allMeetings
// };

exports.getMediaInfo = async function (meetinglink) {
    let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    let allMeetings = [];

    const query = `SELECT mediainfo FROM ${WEBEX_MEETINGS} where meetlink = '${meetinglink}';`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);
    if (dbResponse) {
        allMeetings = dbResponse.rows;
    } else {
        return "Error occured while getting all data !!";
    }
    return allMeetings
};