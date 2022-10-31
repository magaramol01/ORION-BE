"use strict";

require("log-timestamp");
const DataAccessAdaptorSingleton = require("../adaptors/dataAccessAdaptorSingleton");
const {
  MRV_NOON_REPORT,
  XPRESS_MRV_NOON_REPORT,
  SHIP,
  HYDROSTATIC,
  MRVBANNERDATA,
  USER,
  CIIEEOIDATATABLE,
  CIIEEOIDATATABLEAVG,
  LOOKUP,
} = require("../utils/tables");
const _ = require("lodash");
const format = require("pg-format");



// SSH-53 Voayge Banner
exports.getVoyageDetailsByVesselIdForDashboard = async function (vessel) {
  let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

  const query = `select * from (select vessel, replace(vessel,' ','') as sn ,voyage ,replace(split_part(reportdatetime,'/',2),'ShipTime  ','') as timezone,timestamp :: timestamp as rptDate ,
    scr,destination,etanextport,(totaldistrun) as totaldistrun,disttogo from ${MRV_NOON_REPORT}
        union all
        select  vessel, replace(vessel,' ','') as sn ,voyage,vsltz,createdon :: timestamp ,sourceport,destination ,eta,totaldist,disttogo from ${MRVBANNERDATA}) as vld
        WHERE vld.sn = '${vessel}'
        order by  vld.rptDate desc limit 1`;

  const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);

  if (dbResponse) {
    return dbResponse;
  } else {
    console.error("Error Occurred in getVoyagesBetweenFormAndToDate()");
    return {};
  }
};

let allMrvBannerData = null;

exports.loadAllMRVBannerDataDataInMemory = async function () {
  if (allMrvBannerData === null) {
    allMrvBannerData = await this.getAllData();
  }
};

exports.fetchHydrostaticData = async function () {
  const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
  const selectQuery = `SELECT * FROM ${HYDROSTATIC}`;
  const dbResponse = await DataAccessAdaptor.executeQueryAsync(
    selectQuery,
    null
  );
  if (dbResponse.rows.length > 0) {
    return dbResponse.rows;
  } else {
    return {};
  }
};

async function fetchHydrostaticDataLocal() {
  const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
  const selectQuery = `SELECT * FROM ${HYDROSTATIC}`;
  const dbResponse = await DataAccessAdaptor.executeQueryAsync(selectQuery, null);
  if (dbResponse.rows.length > 0) {
      return dbResponse.rows;
  } else {
      return {};
  }
}

async function fetchLookupDataLocal () {
  const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
  const selectQuery = `SELECT * FROM ${LOOKUP}`;
  const dbResponse = await DataAccessAdaptor.executeQueryAsync(selectQuery, null);
  if (dbResponse.rows.length > 0) {
      return dbResponse.rows;
  } else {
      return {};
  }
}

exports.getAllData = async function () {
  const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
  const selectQuery = `SELECT mbd.id as mid, mbd.vessel,ss.id as vesselId, mbd.voyage, mbd.sourceport, mbd.destination,  mbd.ETA, mbd.totalDist, mbd.vslTZ, mbd.userId,mbd.createdOn,mbd.vessel,CONCAT(us.firstname,' ',us.lastname) as username  from "${MRVBANNERDATA}" as mbd left join "${USER}" as us on mbd.userId = us.id  left join "${SHIP}" ss on ss.name=mbd.vessel order by mbd.createdOn desc`;
  const dbResponse = await DataAccessAdaptor.executeQueryAsync(
    selectQuery,
    null
  );

  if (dbResponse) {
    console.log("Fetched All MRV BANNER DATA from MRVBANNERDATA Table");
    return dbResponse.rows;
  } else {
    console.error("Error Occurred While fetching data MRVBANNERDATA Table");
    return [];
  }
};

exports.getAllMRVBannerData = function () {
  return allMrvBannerData; //.length > 0 ? allMrvBannerData.filter(x => x.vesselid === vesselId) : [];
};

exports.syncAllVoaygeNumberData = async function () {
  allMrvBannerData = null;
  allMrvBannerData = await this.getAllData();
};

exports.deleteVBDataById = async (VBID) => {
  const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
  const deleteQuery = `DELETE from ${MRVBANNERDATA} where id = ${parseInt(
    VBID
  )} RETURNING id, voyage;`;

  const dbResponse = await DataAccessAdaptor.executeQueryAsync(
    deleteQuery,
    null
  );

  if (dbResponse) {
    console.log("Deleting Voyge Banner Data By ID from MRVBANNERDATA Table");
    return dbResponse.rows[0];
  } else {
    console.error(
      "Error Occurred While Deleting MRVBANNERDATA Data By ID from MRVBANNERDATA Table"
    );
    return {};
  }
};

exports.saveMrvBannerData = async function (mrvbannerdata) {
  const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

  const insertQuery = `INSERT INTO ${MRVBANNERDATA}  (voyage, sourceport, destination, ETA, totalDist, vslTZ, userId,createdOn,vessel) VALUES($1, $2, $3, $4, $5, $6,$7,$8,$9) RETURNING id;`;

  const values = [
    mrvbannerdata.voyage,
    mrvbannerdata.sourceport,
    mrvbannerdata.destination,
    mrvbannerdata.eta,
    mrvbannerdata.totaldist,
    mrvbannerdata.vsltz,
    mrvbannerdata.userId,
    moment().format("YYYY-MM-DD HH:mm:ss"),
    mrvbannerdata.vessel,
  ];

  const dbResponse = await DataAccessAdaptor.executeQueryAsync(
    insertQuery,
    values
  );

  if (dbResponse) {
    console.log("Mrv Banner Data Record Inserted In MrvBannerData Table");
    return dbResponse.rows[0];
  } else {
    console.error(
      "Error Occurred While Inserting Mrv Banner Data Record In MrvBannerData Table"
    );
    return {};
  }
};

exports.getVBDataById = async (VBID) => {
  const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
  const selectQuery = `SELECT id, vessel ,voyage as voyageno,destination,eta as ETA, vsltz,totaldist,sourceport from ${MRVBANNERDATA} where id = ${VBID};`;
  const dbResponse = await DataAccessAdaptor.executeQueryAsync(
    selectQuery,
    null
  );

  if (dbResponse) {
    console.log("Fetched VBById from Ship Table");
    return dbResponse.rows;
  } else {
    console.error(
      "Error Occurred While fetching VBById from Voyage Banner Table"
    );
    return null;
  }
};

exports.updateVBDataById = async (VB) => {
  const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
  const VBId = VB.id;
  delete VB["id"];
  delete VB["userid"];
  let queryBuilder = "";

  Object.entries(VB).map((k, v) => {
    if (k[0] === "createdon") {
      queryBuilder +=
        k[0].toLowerCase() + " = TO_DATE('" + k[1] + "' , 'DD-MM-YYYY'), ";
    } else {
      queryBuilder +=
        k[0].toLowerCase() +
        " = '" +
        k[1] +
        "' ,createdon='" +
        moment().format("YYYY-MM-DD HH:mm:ss") +
        "'";
    }
  });

  //queryBuilder = queryBuilder.substring(0, queryBuilder.length - 1);

  const updateQuery = `UPDATE ${MRVBANNERDATA} SET ${queryBuilder} where id = ${VBId} RETURNING id, voyage;`;
  const dbResponse = await DataAccessAdaptor.executeQueryAsync(
    updateQuery,
    null
  );

  if (dbResponse) {
    console.log("Updated VBById from MRVBANNERDATA Table");
    return dbResponse.rows[0];
  } else {
    console.error("Error Occurred While Updating ShipById from Ship Table");
    return {};
  }
};

exports.getVoyages = async function (vesselId) {
  let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
  const query = ` Select * from (SELECT DISTINCT ON (trim(voyage)) Voyage as "Voyage", trim(scr) as "Scr",trim(destination) as "Destination", vessel,reportdatetime as "ReportDateTime",  to_timestamp(reportdatetime, 'DD Mon YYYY') as to_timestampreportdatetime, FIRST_VALUE(ReportDateTime) OVER w, LAST_VALUE(ReportDateTime) OVER w FROM ${MRV_NOON_REPORT}  WHERE vesselId = ${vesselId} WINDOW w AS (PARTITION BY trim(Voyage) ORDER BY id ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING )) a order by a.to_timestampreportdatetime DESC`;

  const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);

  if (dbResponse) {
    return dbResponse;
  } else {
    console.error("Error Occurred in getVoyages()");
    return {};
  }
};


exports.getMRVReportData = async function (vesselId) {
  let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

  const query = `SELECT id, vessel, reportdatetime as "ReportDateTime", voyage as "Voyage", destination as "Destination", scr as "Scr", totalhfo as "TOTALHFO", totalvlsfo as "TOTALVLSFO", totalvlsgo as "TOTALVLSGO", distrun as "distRun",  totalulsgo as "TOTALULSGO", nextport as "NextPort", etanextport as "ETANextPort", timestamp, vesselid as "vesselId",  reporttype as "ReportType", steamingtime as "SteamingTime" , robhfo,robvlsfo,robvlsgo,robulsgo,robmecyl,roblsmecyl,robmecc,robaecc,robfw,avs,mas,merpm,slip,wind, douglasseastate,seaheight,swell FROM ${MRV_NOON_REPORT}  WHERE vesselId = ${vesselId}  ORDER BY timestamp;`;

  const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);

  if (dbResponse) {
    return dbResponse;
  } else {
    console.error("Error Occurred in getMRVReportData()");
    return {};
  }
};

exports.getMRVReportDataByVoyage = async function (
  vesselId,
  voyage,
  source,
  destination
) {
  let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

  const query = `SELECT id, vessel, reportdatetime as "ReportDateTime", voyage as "Voyage", destination as "Destination",   scr as "Scr", totalhfo as "TOTALHFO", totalvlsfo as "TOTALVLSFO", totalvlsgo as "TOTALVLSGO", distrun as "distRun",   totalulsgo as "TOTALULSGO", nextport as "NextPort", etanextport as "ETANextPort", timestamp, vesselid as "vesselId",   reporttype as "ReportType", steamingtime as "SteamingTime", robhfo,robvlsfo,robvlsgo,robulsgo,robmecyl,roblsmecyl,robmecc,robaecc,robfw,draftfwd,draftaft,avs,mas,merpm,slip,wind, douglasseastate,seaheight,swell FROM ${MRV_NOON_REPORT} WHERE vesselId = ${vesselId} AND voyage = '${voyage}' ORDER BY timestamp;`;

  const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);

  if (dbResponse) {
    return dbResponse;
  } else {
    console.error("Error Occurred in getMRVReportData()");
    return {};
  }
};

exports.getMRVReportDataByTimeAndVoyage = async function (
  vesselId,
  fromDate,
  toDate,
  voyageName
) {
  let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
  const query = `SELECT * FROM (SELECT id as id, vessel, reportdatetime as "ReportDateTime", voyage as "Voyage", destination as "Destination", scr as "Scr", totalhfo as "TOTALHFO", totalvlsfo as "TOTALVLSFO", totalvlsgo as "TOTALVLSGO", distrun as "distRun", totalulsgo as "TOTALULSGO", nextport as "NextPort", etanextport as "ETANextPort", timestamp, vesselid as "vesselId", reporttype as "ReportType", steamingtime as "SteamingTime", to_date(reportdatetime, 'DD Mon YYYY') as to_datereportdatetime, robhfo,robvlsfo,robvlsgo,robulsgo,robmecyl,roblsmecyl,robmecc,robaecc,robfw,avs,mas,merpm,slip,wind, douglasseastate,seaheight,swell FROM ${MRV_NOON_REPORT} WHERE vesselId = ${vesselId} AND voyage='${voyageName}') as mv WHERE mv.to_datereportdatetime BETWEEN '${fromDate}' AND '${toDate}' ORDER BY mv.timestamp;`;

  const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);
  if (dbResponse) {
    return dbResponse;
  } else {
    console.error("Error Occurred in getMRVReportData()");
    return {};
  }
};

exports.getMRVReportDataByTime = async function (vesselId, fromDate, toDate) {
  let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

  const query = `SELECT * FROM  (SELECT id as id, vessel, reportdatetime as "ReportDateTime", voyage as "Voyage", destination as "Destination", scr as "Scr", totalhfo as "TOTALHFO", totalvlsfo as "TOTALVLSFO", totalvlsgo as "TOTALVLSGO", distrun as "distRun", totalulsgo as "TOTALULSGO", nextport as "NextPort", etanextport as "ETANextPort", timestamp, vesselid as "vesselId", reporttype as "ReportType", steamingtime as "SteamingTime", to_date(reportdatetime, 'DD Mon YYYY') as to_datereportdatetime, robhfo, robvlsfo,robvlsgo,robulsgo,robmecyl,roblsmecyl,robmecc,robaecc,robfw,avs,mas,merpm,slip,wind, douglasseastate,seaheight, swell, draftfwd, draftaft FROM ${MRV_NOON_REPORT}  WHERE vesselId = ${vesselId}) as mv    WHERE mv.to_datereportdatetime BETWEEN '${fromDate}' AND '${toDate}' ORDER BY mv.timestamp;`;

  const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);

  if (dbResponse) {
    return dbResponse;
  } else {
    console.error("Error Occurred in getMRVReportData()");
    return {};
  }
};

exports.saveReportData = async function (reportData) {
  const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

  const insertQuery =
    `INSERT INTO ${MRV_NOON_REPORT}` +
    `(vessel, ReportDateTime, Lat, Lng, Voyage, Destination, Scr, AVS, MAS, DistRun, TotalDistRun, DistToGo,` +
    `SteamingTime, TotalSteamingTime, MERPM, Slip, Wind, SeaHeight, Swell, DouglasSeaState, ROBHFO, ROBVLSFO,` +
    `ROBVLSGO, ROBULSGO, ROBMECYL, ROBLSMECYL, ROBMECC, ROBAECC, ROBFW, TOTALHFO, HFOME, HFOAX, HFOBL, TOTALVLSFO,` +
    `VLSFOME, VLSFOAX, VLSFOBL, TOTALVLSGO, VLSGOME, VLSGOAX, VLSGOBL, TOTALULSGO, ULSGOME, ULSGOAX, ULSGOBL, MECYL,` +
    `LSMECYL, MECC, AECC, FW2, NextPort, ETANextPort, DraftFWD, DraftAFT, timestamp, reportType, liveHFO, liveRealSFO, vesselId)` +
    `VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,` +
    `$17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32,` +
    `$33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45, $46, $47, $48,` +
    `$49, $50, $51, $52, $53, $54, $55, $56, $57, $58, $59) RETURNING id;`;

  const values = [
    reportData.Vessel,
    reportData.ReportDateTime,
    reportData.Lat,
    reportData.Lng,
    reportData.Voyage,
    reportData.Destination,
    reportData.Scr,
    reportData.AVS,
    reportData.MAS,
    reportData.DistRun,
    reportData.TotalDistRun,
    reportData.DistToGo,
    reportData.SteamingTime,
    reportData.TotalSteamingTime,
    reportData.MERPM,
    reportData.Slip,
    reportData.Wind,
    reportData.SeaHeight,
    reportData.Swell,
    reportData.DouglasSeaState,
    reportData.ROBHFO,
    reportData.ROBVLSFO,
    reportData.ROBVLSGO,
    reportData.ROBULSGO,
    reportData.ROBMECYL,
    reportData.ROBLSMECYL,
    reportData.ROBMECC,
    reportData.ROBAECC,
    reportData.ROBFW,
    reportData.TOTALHFO,
    reportData.HFOME,
    reportData.HFOAX,
    reportData.HFOBL,
    reportData.TOTALVLSFO,
    reportData.VLSFOME,
    reportData.VLSFOAX,
    reportData.VLSFOBL,
    reportData.TOTALVLSGO,
    reportData.VLSGOME,
    reportData.VLSGOAX,
    reportData.VLSGOBL,
    reportData.TOTALULSGO,
    reportData.ULSGOME,
    reportData.ULSGOAX,
    reportData.ULSGOBL,
    reportData.MECYL,
    reportData.LSMECYL,
    reportData.MECC,
    reportData.AECC,
    reportData.FW2,
    reportData.NextPort,
    reportData.ETANextPort,
    reportData.DraftFWD,
    reportData.DraftAFT,
    reportData.timestamp,
    reportData.ReportType,
    reportData.liveHFO,
    reportData.liveRealSFO,
    reportData.vesselId,
  ];

  const dbResponse = await DataAccessAdaptor.executeQueryAsync(
    insertQuery,
    values
  );
  if (dbResponse) {
    return dbResponse.rows[0].id;
  } else {
    console.error("Error Occurred Inserting Data in Xpress Noon Report Table");
    return -1;
  }
};

exports.saveXpressReportData = async function (reportData) {
  const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

  const insertQuery = `INSERT INTO ${XPRESS_MRV_NOON_REPORT} (vessel,RPM,ReportDate,ME_fmc,ME_vc,ME_sp,ME_pm,AE_fo,ME_ae,BLR_fo,Total,tc1rpm,tc2rpm,created_date,vesselId) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING id;`;

  const values = [
    reportData.Vessel,
    reportData.RPM,
    reportData.ReportDate,
    reportData.ME_fmc,
    reportData.ME_vc,
    reportData.ME_sp,
    reportData.ME_pm,
    reportData.AE_fo,
    reportData.ME_ae,
    reportData.BLR_fo,
    reportData.Total,
    reportData.tc1rpm,
    reportData.tc2rpm,
    reportData.created,
    reportData.vesselId,
  ];

  const dbResponse = await DataAccessAdaptor.executeQueryAsync(
    insertQuery,
    values
  );
  if (dbResponse) {
    return dbResponse.rows[0].id;
  } else {
    console.error("Error Occurred Inserting Data in Xpress Noon Report Table");
    return -1;
  }
};

exports.getLastInsertedRecords = async function () {
  const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

  const selectQuery = `SELECT * FROM ${XPRESS_MRV_NOON_REPORT} where id = ( SELECT MAX(ID) FROM ${XPRESS_MRV_NOON_REPORT} );`;

  const dbResponse = await DataAccessAdaptor.executeQueryAsync(
    selectQuery,
    null
  );
  if (dbResponse.rows.length > 0) {
    return dbResponse.rows[0]["me_fmc"];
  } else {
    return "";
  }
};

exports.getVoyages = async function (vesselId) {
  let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
  const query = ` Select * from (SELECT DISTINCT ON (trim(voyage)) Voyage as "Voyage" , trim(scr) as "Scr",trim(destination) as "Destination", vessel,reportdatetime as "ReportDateTime",  to_timestamp(reportdatetime, 'DD Mon YYYY') as to_timestampreportdatetime, FIRST_VALUE(ReportDateTime) OVER w, LAST_VALUE(ReportDateTime) OVER w FROM ${MRV_NOON_REPORT}  WHERE vesselId = ${vesselId} WINDOW w AS ( PARTITION BY trim(Voyage) ORDER BY id ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING )) a order by a.to_timestampreportdatetime DESC`;

  const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);

  if (dbResponse) {
    return dbResponse;
  } else {
    console.error("Error Occurred in getVoyages()");
    return {};
  }
};

exports.getAllVesselsVoyageDetails = async function (vesselId) {
  let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

  const query = `SELECT sgw.timestamp, sgw.reportdatetime, sgw.id, sgw.lat, sgw.lng, sgw.vesselid, sgw.voyage, sgw.destination,  sgw.vessel, sgw.reportdatetime as "ReportDateTime", sgw.voyage as "Voyage", sgw.destination "Destination",   sgw.scr as "Scr", sgw.totalhfo as "TOTALHFO", sgw.totalvlsfo as "TOTALVLSFO", sgw.totalvlsgo "TOTALVLSGO",  sgw.totaldistrun as "TotalDistRun", sgw.disttogo as "DistToGo", sgw.nextport as "NextPort", setanextport as "ETANextPort",  sgw.timestamp, sgw.vesselid as "vesselId", sgw.reporttype as "ReportType", sgw.steamingtime "SteamingTime",  to_date(sgw.reportdatetime, 'DD Mon YYYY') as to_datereportdatetime FROM ${MRV_NOON_REPORT} sgw  LEFT JOIN ${MRV_NOON_REPORT} b ON sgw.vesselid = b.vesselid AND sgw.timestamp < b.timestamp WHERE b.timestamp IS NULL;`;

  const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);

  if (dbResponse) {
    return dbResponse.rows;
  } else {
    console.error("Error Occurred in getAllVesselsVoyageDetails()");
    return {};
  }
};

exports.createTable = async function () {
  const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

  const query = `CREATE TABLE ${MRV_NOON_REPORT}
    (
        id serial
        constraint ${MRV_NOON_REPORT}_pk
            primary key,
            
        vessel varchar,
        ReportDateTime varchar,
        Lat varchar,
        Lng varchar,
        Voyage varchar,
        Destination varchar,
        Scr varchar,
        AVS numeric,
        MAS numeric, 
        DistRun numeric,
        TotalDistRun numeric,
        DistToGo numeric,
        SteamingTime numeric,
        TotalSteamingTime numeric,
        MERPM numeric,
        Slip numeric,
        Wind numeric,
        SeaHeight numeric,
        Swell numeric,
        DouglasSeaState numeric,
        ROBHFO numeric,
        ROBVLSFO numeric,
        ROBVLSGO numeric,
        ROBULSGO numeric,
        ROBMECYL numeric,
        ROBLSMECYL numeric,
        ROBMECC numeric,
        ROBAECC numeric,
        ROBFW numeric,
        TOTALHFO numeric,
        HFOME numeric,
        HFOAX numeric,
        HFOBL numeric,
        TOTALVLSFO numeric,
        VLSFOME numeric,
        VLSFOAX numeric,
        VLSFOBL numeric,
        TOTALVLSGO numeric,
        VLSGOME numeric,
        VLSGOAX numeric,
        VLSGOBL numeric,
        TOTALULSGO numeric,
        ULSGOME numeric,
        ULSGOAX numeric,
        ULSGOBL numeric,
        MECYL numeric,
        LSMECYL numeric,
        MECC numeric,
        AECC numeric,
        FW2 numeric,
        NextPort varchar,
        ETANextPort varchar,
        DraftFWD numeric,
        DraftAFT numeric,
        timestamp timestamp,
        reportType varchar,
        liveHFO numeric,
        liveRealSFO numeric,
        
        vesselId integer
        constraint ${MRV_NOON_REPORT}_${SHIP}_id_fk
            references ${SHIP}
    );`;

  await DataAccessAdaptor.executeQueryAsync(query, null).then((resp) => {
    if (resp) {
      console.log(MRV_NOON_REPORT + " table created successfully!!!");
    } else {
      console.error(`Error occurred while creating table ${MRV_NOON_REPORT}`);
    }
  });
};

exports.createXpressNoonTable = async function () {
  const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

  const query = `CREATE TABLE ${XPRESS_MRV_NOON_REPORT}
    (
        id serial
        constraint ${XPRESS_MRV_NOON_REPORT}_pk
            primary key,
            
        vessel varchar,
        RPM numeric,
        ReportDate text,
        ME_fmc numeric,
        ME_vc numeric,
        ME_sp numeric,
        ME_pm numeric,
        AE_fo numeric,
        ME_ae numeric, 
        BLR_fo numeric,
        Total numeric,
        tc1rpm numeric,
        tc2rpm numeric,
        created_date timestamp,
        
        vesselId integer
        constraint ${XPRESS_MRV_NOON_REPORT}_${SHIP}_id_fk
            references ${SHIP}
    );`;

  await DataAccessAdaptor.executeQueryAsync(query, null).then((resp) => {
    if (resp) {
      console.log(XPRESS_MRV_NOON_REPORT + " table created successfully!!!");
    } else {
      console.error(
        `Error occurred while creating table ${XPRESS_MRV_NOON_REPORT}`
      );
    }
  });
};

exports.fetchLatestMrvNoonData = async function () {
  const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

  const selectQuery = `SELECT o.vesselid,o.vessel,o.rpm,o.reportdate,o.me_fmc,o.me_vc,o.me_sp,o.me_pm,o.ae_fo,o.me_ae,o.blr_fo,o.total, o.tc1rpm, o.tc2rpm, o.created_date FROM ${XPRESS_MRV_NOON_REPORT} o LEFT JOIN ${XPRESS_MRV_NOON_REPORT} b ON o.vesselid = b.vesselid AND o.id < b.id WHERE b.vesselid is NULL;`;

  // const selectQuery = `SELECT DISTINCT ON (vesselid) vesselid,vessel,rpm,reportdate,me_fmc,me_vc,me_sp,me_pm,ae_fo,me_ae,blr_fo,total,tc1rpm,tc2rpm,created_date FROM ${XPRESS_MRV_NOON_REPORT} ORDER BY vesselid;`;
  const dbResponse = await DataAccessAdaptor.executeQueryAsync(
    selectQuery,
    null
  );
  if (dbResponse.rows.length > 0) {
    return dbResponse.rows;
  } else {
    return {};
  }
};

exports.fetchLookupData = async function () {
  const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
  const selectQuery = `SELECT * FROM ${LOOKUP}`;
  const dbResponse = await DataAccessAdaptor.executeQueryAsync(
    selectQuery,
    null
  );
  if (dbResponse.rows.length > 0) {
    return dbResponse.rows;
  } else {
    return {};
  }
};

exports.getLastInsertedRecordInMRVNoonReportTabel = async function (vesselId) {
  try {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const selectQuery = `SELECT * FROM ${MRV_NOON_REPORT} where vesselid =${vesselId} order by id desc limit 1;`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(
      selectQuery,
      null
    );
    if (dbResponse.rows.length > 0) {
      return dbResponse.rows[0];
    } else {
      return "";
    }
  } catch (error) {
    console.log(error);
  }
};

exports.saveDataInCIIEEOIDataTable = async function (
  noonReportDataTabelLastRow
  // extractData
) {
  let hydrostaticData = [];
  const supplyDeadWeight = 69787;
  try {
    if (!noonReportDataTabelLastRow || !noonReportDataTabelLastRow.vesselid)
      return;

    let displacementValue = 0;
    const result = await fetchHydrostaticDataLocal();
    const lookupResult = await fetchLookupDataLocal();
    
    if (Object.keys(hydrostaticData).length === 0) {
      if (Object.keys(result).length > 0) {
        result.map((data) => {
          hydrostaticData[data.vesselid] = data;
        });
      }
    }
    let hydrostaticcsvdata = JSON.parse(hydrostaticData[1].hydrostaticcsvdata);


    let trimM = parseFloat(
      noonReportDataTabelLastRow.draftaft - noonReportDataTabelLastRow.draftfwd
    ).toFixed(2);
    let robColTotal =
      parseFloat(noonReportDataTabelLastRow.robhfo) +
      parseFloat(noonReportDataTabelLastRow.robulsgo) +
      parseFloat(noonReportDataTabelLastRow.robfw);

    let meanDraftValue = parseFloat(
      (
        (parseFloat(noonReportDataTabelLastRow.draftfwd) +
          parseFloat(noonReportDataTabelLastRow.draftaft)) /
        2
      ).toFixed(4)
    );

    if ((meanDraftValue * 100) % 5 === 0) {
      displacementValue =
        hydrostaticcsvdata.filter(
          (x) =>
            parseFloat(x.Draft.toFixed(2)) ===
            parseFloat(meanDraftValue.toFixed(2))
        ).length > 0
          ? hydrostaticcsvdata.filter(
              (x) =>
                parseFloat(x.Draft.toFixed(2)) ===
                parseFloat(meanDraftValue.toFixed(2))
            )[0].Disp_full
          : 0;
    } else {
      let lowerDraftValue = parseFloat(
        (Math.floor((meanDraftValue * 100) / 5) * 0.05).toFixed(2)
      );
      let higherDraftValue = parseFloat(
        (Math.ceil((meanDraftValue * 100) / 5) * 0.05).toFixed(2)
      );
      let lowerDisplacementValue =
        hydrostaticcsvdata.filter(
          (x) => parseFloat(x.Draft.toFixed(2)) === lowerDraftValue
        ).length > 0
          ? hydrostaticcsvdata.filter(
              (x) => parseFloat(x.Draft.toFixed(2)) === lowerDraftValue
            )[0].Disp_full
          : 0;
      let higherDisplacementValue =
        hydrostaticcsvdata.filter(
          (x) => parseFloat(x.Draft.toFixed(2)) === higherDraftValue
        ).length > 0
          ? hydrostaticcsvdata.filter(
              (x) => parseFloat(x.Draft.toFixed(2)) === higherDraftValue
            )[0].Disp_full
          : 0;
      let interpolationDisplacementValue =
        (higherDisplacementValue - lowerDisplacementValue) / 500;
      let inerploatedDraftValue = meanDraftValue - Math.floor(meanDraftValue);
      displacementValue =
        lowerDisplacementValue +
        interpolationDisplacementValue * inerploatedDraftValue;
    }

    let MASSOFCARGO = parseFloat(
      (displacementValue - 14285 - robColTotal).toFixed(2)
    );
    let transportWorkDown =
      parseFloat(noonReportDataTabelLastRow.distrun) * parseFloat(MASSOFCARGO);
    let MASOFCO2 =
      parseFloat(noonReportDataTabelLastRow.totalhfo) *
        parseFloat(lookupResult[0].cfhfo) +
      parseFloat(noonReportDataTabelLastRow.totalvlsfo) *
        parseFloat(lookupResult[0].cfvlsf) +
      parseFloat(noonReportDataTabelLastRow.totalulsgo) *
        parseFloat(lookupResult[0].cfulsg);
    let EEOI = (MASOFCO2 * Math.pow(10, 6)) / transportWorkDown;
    let deadweight = parseFloat(displacementValue - 14285);
    let supplyTransportWorkDownCII =
      parseFloat(noonReportDataTabelLastRow.distrun) * supplyDeadWeight;
    let transportWorkDownCII =
      parseFloat(noonReportDataTabelLastRow.distrun) * deadweight;

    let supplyCII = (MASOFCO2 * Math.pow(10, 6)) / supplyTransportWorkDownCII;
    let CII = (MASOFCO2 * Math.pow(10, 6)) / transportWorkDownCII;
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const values = [
      [
        noonReportDataTabelLastRow.voyage,
        noonReportDataTabelLastRow.vesselid,
        parseFloat(trimM).toFixed(2),
        parseFloat(supplyDeadWeight).toFixed(2),
        parseFloat(transportWorkDown).toFixed(2),
        parseFloat(supplyTransportWorkDownCII).toFixed(2),
        parseFloat(supplyCII).toFixed(2),
        parseFloat(noonReportDataTabelLastRow.distrun).toFixed(2),
        parseFloat(MASOFCO2).toFixed(2),
        parseFloat(MASSOFCARGO).toFixed(2),
        parseFloat(EEOI).toFixed(2),
        noonReportDataTabelLastRow.id,
        "supply",
        parseFloat(displacementValue),
        noonReportDataTabelLastRow.reportdatetime,
        robColTotal,
      ],
      [
        noonReportDataTabelLastRow.voyage,
        noonReportDataTabelLastRow.vesselid,
        parseFloat(trimM).toFixed(2),
        parseFloat(deadweight).toFixed(2),
        parseFloat(transportWorkDown).toFixed(2),
        parseFloat(transportWorkDownCII).toFixed(2),
        parseFloat(CII).toFixed(2),
        parseFloat(noonReportDataTabelLastRow.distrun).toFixed(2),
        parseFloat(MASOFCO2).toFixed(2),
        parseFloat(MASSOFCARGO).toFixed(2),
        parseFloat(EEOI).toFixed(2),
        noonReportDataTabelLastRow.id,
        "demand",
        parseFloat(displacementValue),
        noonReportDataTabelLastRow.reportdatetime,
        robColTotal,
      ],
    ];

    const insertQuery = format(
      `INSERT INTO ${CIIEEOIDATATABLE} (voyageno, vesselid, trimm, deadweight,  transportworkdone, transportworkdonecii, attainedcii, distrun, masofco2, massofcargo, eeoi, noonreportid, type, displacementvalue, reportdatetime, robcoltotal) VALUES  %L RETURNING id;`,
      values
    );

    const dbResponse = await saveCIIEEOICalData(insertQuery);
    // const dbResponse = await this.saveCIIEEOICalData(insertQuery);
    if (dbResponse !== undefined) {
      const dbCIIEEOITabelExstingData =
        await checkIfRecordIsAvailableInCIIEEOITable(
          noonReportDataTabelLastRow
        );
        // await this.checkIfRecordIsAvailableInCIIEEOITable(
        //   noonReportDataTabelLastRow
        // );

      if (dbCIIEEOITabelExstingData) {
        if (dbCIIEEOITabelExstingData.length > 0) {
          // const hfoResponse = await this.getHfoValuesForMassOfCargoCal(
          //   noonReportDataTabelLastRow.vesselid,
          //   noonReportDataTabelLastRow.voyage
          // );
          const hfoResponse = await getHfoValuesForMassOfCargoCal(
            noonReportDataTabelLastRow.vesselid,
            noonReportDataTabelLastRow.voyage
          );

          if (hfoResponse) {
            let totalHfo =
              parseFloat(hfoResponse[0].robhfo) +
              parseFloat(hfoResponse[0].robulsgo) +
              parseFloat(hfoResponse[0].robfw);

            let distRunSumDemand = dbCIIEEOITabelExstingData
              .filter((item) => item.type === "demand")
              .map((item) => item.distrun)
              .reduce((prev, curr) => parseFloat(prev) + parseFloat(curr), 0);

            let distRunSumSupply = dbCIIEEOITabelExstingData
              .filter((item) => item.type === "supply")
              .map((item) => item.distrun)
              .reduce((prev, curr) => parseFloat(prev) + parseFloat(curr), 0);

            let MASOFCO2Demand = dbCIIEEOITabelExstingData
              .filter((item) => item.type === "demand")
              .map((item) => item.distrun)
              .reduce((prev, curr) => parseFloat(prev) + parseFloat(curr), 0);

            let MASOFCO2Supply = dbCIIEEOITabelExstingData
              .filter((item) => item.type === "supply")
              .map((item) => item.distrun)
              .reduce((prev, curr) => parseFloat(prev) + parseFloat(curr), 0);

            let MASSOFCARGO = parseFloat(
              (displacementValue - 14285 - totalHfo).toFixed(2)
            );

            let transportWorkDownDemand = parseFloat(
              parseFloat(distRunSumDemand).toFixed(2) * parseFloat(MASSOFCARGO)
            ).toFixed(2);

            let transportWorkDownSupply = parseFloat(
              parseFloat(distRunSumSupply).toFixed(2) * parseFloat(MASSOFCARGO)
            ).toFixed(2);

            const SupplyEEOIValues = dbCIIEEOITabelExstingData
              .filter((item) => item.type === "supply")
              .map((item) => parseFloat(item.eeoi));
            let EEOIAvg =
              SupplyEEOIValues.reduce((a, b) => a + b, 0) /
              SupplyEEOIValues.length;

            // let EEOI = parseFloat(MASOFCO2Demand * Math.pow(10, 6) / transportWorkDownDemand).toFixed(2);

            let deadweight = parseFloat(displacementValue - 14285).toFixed(2);

            let supplyTransportWorkDownCII = parseFloat(
              parseFloat(distRunSumSupply) * supplyDeadWeight
            ).toFixed(2);

            let transportWorkDownCII = parseFloat(
              parseFloat(distRunSumDemand) * deadweight
            ).toFixed(2);

            let supplyCII = parseFloat(
              (MASOFCO2 * Math.pow(10, 6)) / supplyTransportWorkDownCII
            ).toFixed(2);

            const attainedCIIValuesSupply = dbCIIEEOITabelExstingData
              .filter((item) => item.type === "supply")
              .map((item) => parseFloat(item.attainedcii));

            let CIIAvgSupply =
              attainedCIIValuesSupply.reduce((a, b) => a + b, 0) /
              attainedCIIValuesSupply.length;

            const attainedCIIValuesDemand = dbCIIEEOITabelExstingData
              .filter((item) => item.type === "demand")
              .map((item) => parseFloat(item.attainedcii));

            let CIIAvgDemand =
              attainedCIIValuesDemand.reduce((a, b) => a + b, 0) /
              attainedCIIValuesDemand.length;

            const massOfCo2Array = dbCIIEEOITabelExstingData
              .filter((item) => item.type === "demand")
              .map((item) => parseFloat(item.masofco2));

            const totalCO2Mass = massOfCo2Array.reduce((a, b) => a + b, 0);

            const dbCIIEEOITabelAVGExstingData =
              await checkIfRecordIsAvailableInAvgTabel(
                noonReportDataTabelLastRow
              );

            if (dbCIIEEOITabelAVGExstingData) {
              if (dbCIIEEOITabelAVGExstingData.length > 0) {
                let tempMassOfCo2 = parseFloat(MASOFCO2).toFixed(2);

                const updateSupplyQuery = `update ${CIIEEOIDATATABLEAVG} set deadweight_cal=${supplyDeadWeight},transportworkdone_cal=${transportWorkDownSupply}, transportworkdoneCII_cal=${supplyTransportWorkDownCII},attainedcii_cal=${CIIAvgSupply}, distrun_sum=${distRunSumSupply},masofco2_cal=${totalCO2Mass},massofcargo_cal=${MASSOFCARGO}, eeoi_cal=${EEOIAvg} where voyageno='${dbCIIEEOITabelAVGExstingData[0].voyageno}' AND type='supply';`;

                let dbResponseAvg = await DataAccessAdaptor.executeQueryAsync(
                  updateSupplyQuery,
                  null
                );

                if (!dbResponseAvg) {
                  console.log(
                    "unable to update CII data in average table for supply type"
                  );
                }

                const updateDemandQuery = `update  ${CIIEEOIDATATABLEAVG} set deadweight_cal= ${deadweight},transportworkdone_cal=${transportWorkDownDemand}, transportworkdoneCII_cal=${transportWorkDownCII},attainedcii_cal=${CIIAvgDemand}, distrun_sum=${distRunSumDemand},masofco2_cal=${totalCO2Mass},massofcargo_cal=${MASSOFCARGO}, eeoi_cal=${EEOIAvg} where voyageno='${dbCIIEEOITabelAVGExstingData[0].voyageno}' AND type='demand';`;

                dbResponseAvg = await DataAccessAdaptor.executeQueryAsync(
                  updateDemandQuery,
                  null
                );

                if (!dbResponseAvg) {
                  console.log(
                    "unable to update CII data in average table for demand type"
                  );
                }
              } else if (
                dbCIIEEOITabelAVGExstingData.length === 0 ||
                !dbCIIEEOITabelAVGExstingData
              ) {
                const values = [
                  [
                    noonReportDataTabelLastRow.voyage,
                    noonReportDataTabelLastRow.vesselid,
                    parseFloat(supplyDeadWeight).toFixed(2),
                    parseFloat(transportWorkDown).toFixed(2),
                    parseFloat(supplyTransportWorkDownCII).toFixed(2),
                    parseFloat(CIIAvgSupply).toFixed(2),
                    parseFloat(noonReportDataTabelLastRow.distrun).toFixed(2),
                    parseFloat(MASOFCO2).toFixed(2),
                    parseFloat(MASSOFCARGO).toFixed(2),
                    parseFloat(EEOIAvg).toFixed(2),
                    noonReportDataTabelLastRow.id,
                    "supply",
                  ],
                  [
                    noonReportDataTabelLastRow.voyage,
                    noonReportDataTabelLastRow.vesselid,
                    parseFloat(deadweight).toFixed(2),
                    parseFloat(transportWorkDown).toFixed(2),
                    parseFloat(transportWorkDownCII).toFixed(2),
                    parseFloat(CIIAvgDemand).toFixed(2),
                    parseFloat(noonReportDataTabelLastRow.distrun).toFixed(2),
                    parseFloat(MASOFCO2).toFixed(2),
                    parseFloat(MASSOFCARGO).toFixed(2),
                    parseFloat(EEOIAvg).toFixed(2),
                    noonReportDataTabelLastRow.id,
                    "demand",
                  ],
                ];

                const insertQuery = format(
                  `INSERT INTO ${CIIEEOIDATATABLEAVG} (voyageno, vesselid, deadweight_cal,transportworkdone_cal, transportworkdoneCII_cal, attainedcii_cal, distrun_sum, masofco2_cal, massofcargo_cal, eeoi_cal, noonreportid, type) VALUES %L RETURNING id;`,
                  values
                );

                const dbResponseAvg = await DataAccessAdaptor.executeQueryAsync(
                  insertQuery
                );
                if (!dbResponseAvg) {
                  console.log(
                    "unable to insert CII data in average table for both types"
                  );
                }
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.log("error in calculating cii and eeoi values", error);
  }
};

 async function saveCIIEEOICalData(insertQuery, values) {
  const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

  const dbResponse = await DataAccessAdaptor.executeQueryAsync(
    insertQuery,
    values
  );
  if (dbResponse) {
    console.log("CIIEEOICalData Record Inserted In CIIEEOICalData Table");
    return dbResponse.rows[0];
  } else {
    console.error(
      "Error Occurred While Inserting CIIEEOICalData Record In CIIEEOICalData Table"
    );
    return {};
  }
};

// Dev :- Yogesh Chavan Date:-28-05-2022
// get EEOI view call  data from table
exports.fetchEEOIData = async function () {
  const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
  const selectQuery = `select noon.voyage, noon.vesselid,noon.reportdatetime,
    noon.voyage,ciieeoi.massofcargo,lo.eeoi2020,lo.eeoi2021,lo.foc,
    ciieeoi.eeoi,ciieeoi.distrun from ${MRV_NOON_REPORT} as noon
    inner join ${CIIEEOIDATATABLE} as ciieeoi
    on noon.id = ciieeoi.noonreportid
    join ${LOOKUP} as lo on
    ciieeoi.vesselid=lo.vesselid`;
  const dbResponse = await DataAccessAdaptor.executeQueryAsync(
    selectQuery,
    null
  );
  if (dbResponse.rows.length > 0) {
    return dbResponse.rows;
  } else {
    return {};
  }
};

exports.fetchLast90DaysCIIData = async function (vesselID, year, type) {
  const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
  const selectQuery = `select noon.voyage, noon.ReportDateTime,cii.attainedcii as attainedcii,
    to_Date(noon.ReportDateTime, 'DD Mon YYYY') as reportdate
    ,cii.distrun as distance, cii.masofco2 as co2, cii.noonreportid, cii.type as type,
    lk.supboundary As A,lk.lowboundary as b ,lk.uppboundary as c,
    lk.inferiorboundary as d,
    lk.reqciifor as requiredcii
    from ${MRV_NOON_REPORT} as noon
    right join ${CIIEEOIDATATABLE} as cii
    on noon.vesselid = cii.vesselid and 
    noon.voyage=cii.voyageno and cii.ReportDateTime=noon.reportdatetime
    join ${LOOKUP} as lk
    on lk.vesselid=noon.vesselid AND lk.year=${year}
    where cii.vesselid=${vesselID} order by to_Date(noon.ReportDateTime, 'DD Mon YYYY')`;

  const selectQuery2 = `
  select cii.distrun as distance, cii.masofco2 as co2, cii.noonreportid, cii.type as type, cii.transportworkdonecii as transportworkdonecii, cii.voyageno as voyage,  cii.attainedcii as attainedcii, lk.supboundary As A,lk.lowboundary as b , lk.uppboundary as c, lk.inferiorboundary as d, lk.reqciifor as requiredcii, to_Date(cii.reportdatetime, 'DD Mon YYYY') as reportdate from ciieeoidatatable as cii, lookup as lk where cii.vesselid = ${vesselID} and lk.year = ${year}`;

  //TODO: to be changed later after demo

  /*and
    to_Date(noon.ReportDateTime, 'DD Mon YYYY')>current_date- interval '90' day*/

  console.log("query :" + selectQuery);

  const dbResponse = await DataAccessAdaptor.executeQueryAsync(
    selectQuery2,
    null
  );
  if (
    dbResponse !== null &&
    dbResponse.rows !== undefined &&
    dbResponse.rows.length > 0
  ) {
    return dbResponse.rows;
  } else {
    return {};
  }
};

exports.getMRVDataForInsertInNewTabel = async function (password) {
  let multipleValues = [];
  let undefineValues = [];
  if (password === "smartship@123") {
    let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `SELECT * FROM  ${MRV_NOON_REPORT} `;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);

    if (dbResponse) {
      if (dbResponse.rows.length > 0) {
        for (let index = 0; index < dbResponse.rows.length; index++) {
          const element = dbResponse.rows[index];
          const insertValue = await this.getValuesForInsertCIIEEOIValues(
            element
          );
          if (insertValue != undefined) {
            multipleValues.push(insertValue[0]);
            multipleValues.push(insertValue[1]);
          } else {
            undefineValues.push("");
          }
        }
        if (true) {
          return multipleValues;
        }
      }
    } else {
      console.error("Error Occurred in getMRVDataForInsertInNewTabel()");
    }
  }
};

exports.getAllMRVdata = async function () {
  let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

  const query = `SELECT * FROM ${MRV_NOON_REPORT}`;
  const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);
  if (dbResponse) {
    return dbResponse.rows;
  } else {
    return [];
  }
};

 async function checkIfRecordIsAvailableInAvgTabel (
  noonReportDataTabelLastRow
) {
  const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
  const selectQuery = `select * from ${CIIEEOIDATATABLEAVG} where voyageno='${noonReportDataTabelLastRow.voyage}'
    and vesselid=${noonReportDataTabelLastRow.vesselid}`;

  const dbResponse = await DataAccessAdaptor.executeQueryAsync(
    selectQuery,
    null
  );
  if (dbResponse) {
    return dbResponse.rows;
  } else {
    console.error(
      "Error Occurred While Inserting CIIEEOICalData Record In CIIEEOICalData Table"
    );
    return {};
  }
};

 async function checkIfRecordIsAvailableInCIIEEOITable(
  noonReportDataTabelLastRow
) {
  const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
  const selectQuery = `select * from ${CIIEEOIDATATABLE} as ce inner join ${MRV_NOON_REPORT} as mrv on
                ce.noonreportid=mrv.id where mrv.vesselid=${noonReportDataTabelLastRow.vesselid} and mrv.voyage='${noonReportDataTabelLastRow.voyage}'`;

  const dbResponse = await DataAccessAdaptor.executeQueryAsync(
    selectQuery,
    null
  );
  if (dbResponse) {
    return dbResponse.rows;
  } else {
    console.error(
      "Error Occurred While select  Record In CIIEEOICalData Table"
    );
    return {};
  }
};

exports.getValuesForInsertCIIEEOIValues = async function (
  noonReportDataTabelLastRow
) {
  let hydrostaticData = [];
  const supplyDeadWeight = parseFloat("69787");

  try {
    if (noonReportDataTabelLastRow != undefined) {
      if (
        noonReportDataTabelLastRow.vesselid != null &&
        noonReportDataTabelLastRow.distrun != "0"
      ) {
        let displacementValue = 0;
        const result = await fetchHydrostaticDataLocal();
        const lookupResult = await fetchLookupDataLocal();
        if (Object.keys(hydrostaticData).length === 0) {
          if (Object.keys(result).length > 0) {
            result.map((data) => {
              hydrostaticData[data.vesselid] = data;
            });
          }
        }
        let hydrostaticcsvdata = JSON.parse(
          hydrostaticData[1].hydrostaticcsvdata
        );

        let trimM =
          parseFloat(
            noonReportDataTabelLastRow.draftaft -
              noonReportDataTabelLastRow.draftfwd
          ).toFixed(2) + parseFloat(noonReportDataTabelLastRow.robfw);
        let robColTotal =
          parseFloat(noonReportDataTabelLastRow.robhfo) +
          parseFloat(noonReportDataTabelLastRow.robvlsgo) +
          parseFloat(noonReportDataTabelLastRow.robfw);
        let robColTotalOld =
          parseFloat(noonReportDataTabelLastRow.robhfo) +
          parseFloat(noonReportDataTabelLastRow.robvlsfo) +
          parseFloat(noonReportDataTabelLastRow.robvlsgo) +
          parseFloat(noonReportDataTabelLastRow.robulsgo) +
          parseFloat(noonReportDataTabelLastRow.robmecyl) / 1000 +
          parseFloat(noonReportDataTabelLastRow.roblsmecyl) / 1000 +
          parseFloat(noonReportDataTabelLastRow.robmecc) / 1000 +
          parseFloat(noonReportDataTabelLastRow.robaecc) / 1000 +
          parseFloat(noonReportDataTabelLastRow.robfw);
        let meanDraftValue = parseFloat(
          (
            (parseFloat(noonReportDataTabelLastRow.draftfwd) +
              parseFloat(noonReportDataTabelLastRow.draftaft)) /
            2
          ).toFixed(4)
        );
        // let displacementValue = (hydrostaticcsvdata.filter(x => parseFloat(x.Draft.toFixed(2)) === parseFloat(meanDraftValue.toFixed(2)))).length > 0 ?
        //     hydrostaticcsvdata.filter(x => parseFloat(x.Draft.toFixed(2)) === parseFloat(meanDraftValue.toFixed(2)))[0].Disp_full : 0;
        if ((meanDraftValue * 100) % 5 === 0) {
          displacementValue =
            hydrostaticcsvdata.filter(
              (x) =>
                parseFloat(x.Draft.toFixed(2)) ===
                parseFloat(meanDraftValue.toFixed(2))
            ).length > 0
              ? hydrostaticcsvdata.filter(
                  (x) =>
                    parseFloat(x.Draft.toFixed(2)) ===
                    parseFloat(meanDraftValue.toFixed(2))
                )[0].Disp_full
              : 0;
        } else {
          let lowerDraftValue = parseFloat(
            (Math.floor((meanDraftValue * 100) / 5) * 0.05).toFixed(2)
          );
          let higherDraftValue = parseFloat(
            (Math.ceil((meanDraftValue * 100) / 5) * 0.05).toFixed(2)
          );
          let lowerDisplacementValue =
            hydrostaticcsvdata.filter(
              (x) => parseFloat(x.Draft.toFixed(2)) === lowerDraftValue
            ).length > 0
              ? hydrostaticcsvdata.filter(
                  (x) => parseFloat(x.Draft.toFixed(2)) === lowerDraftValue
                )[0].Disp_full
              : 0;
          let higherDisplacementValue =
            hydrostaticcsvdata.filter(
              (x) => parseFloat(x.Draft.toFixed(2)) === higherDraftValue
            ).length > 0
              ? hydrostaticcsvdata.filter(
                  (x) => parseFloat(x.Draft.toFixed(2)) === higherDraftValue
                )[0].Disp_full
              : 0;
          let interpolationDisplacementValue =
            (higherDisplacementValue - lowerDisplacementValue) / 500;
          let inerploatedDraftValue =
            meanDraftValue - Math.floor(meanDraftValue);
          displacementValue =
            lowerDisplacementValue +
            interpolationDisplacementValue * inerploatedDraftValue;
        }
        let MASSOFCARGO = parseFloat(
          (displacementValue - 14285 - robColTotal).toFixed(2)
        );
        let transportWorkDown =
          parseFloat(noonReportDataTabelLastRow.distrun) *
          parseFloat(MASSOFCARGO);
        let MASOFCO2 =
          parseFloat(noonReportDataTabelLastRow.totalhfo) *
            parseFloat(lookupResult[0].cfhfo) +
          parseFloat(noonReportDataTabelLastRow.totalvlsfo) *
            parseFloat(lookupResult[0].cfvlsf) +
          parseFloat(noonReportDataTabelLastRow.totalulsgo) *
            parseFloat(lookupResult[0].cfulsg);
        let EEOI = (MASOFCO2 * Math.pow(10, 6)) / transportWorkDown;
        //-----------------------------------------------------------------------------------------------
        //-----------------------------------CII Calulation------------------------------------------------
        let deadweight = parseFloat(displacementValue - 14285);
        let supplyTransportWorkDownCII =
          parseFloat(noonReportDataTabelLastRow.distrun) * supplyDeadWeight;
        let transportWorkDownCII =
          parseFloat(noonReportDataTabelLastRow.distrun) * deadweight;

        let supplyCII =
          (MASOFCO2 * Math.pow(10, 6)) / supplyTransportWorkDownCII;
        let CII = (MASOFCO2 * Math.pow(10, 6)) / transportWorkDownCII;
        //---------------------------------------END-------------------------------------------------------
        if (EEOI === Infinity) {
          console.log(noonReportDataTabelLastRow);
        }

        return [
          [
            noonReportDataTabelLastRow.voyage,
            noonReportDataTabelLastRow.vesselid,
            parseFloat(trimM).toFixed(2),
            parseFloat(supplyDeadWeight).toFixed(2),
            parseFloat(transportWorkDown).toFixed(2),
            parseFloat(supplyTransportWorkDownCII).toFixed(2),
            parseFloat(supplyCII).toFixed(2),
            parseFloat(noonReportDataTabelLastRow.distrun).toFixed(2),
            parseFloat(MASOFCO2).toFixed(2),
            parseFloat(MASSOFCARGO).toFixed(2),
            parseFloat(EEOI).toFixed(2),
            parseFloat(displacementValue).toFixed(2),
            parseFloat(robColTotal).toFixed(2),
            noonReportDataTabelLastRow.id,
            noonReportDataTabelLastRow.reportdatetime,
            "supply",
          ],

          [
            noonReportDataTabelLastRow.voyage,
            noonReportDataTabelLastRow.vesselid,
            parseFloat(trimM).toFixed(2),
            parseFloat(deadweight).toFixed(2),
            parseFloat(transportWorkDown).toFixed(2),
            parseFloat(transportWorkDownCII).toFixed(2),
            parseFloat(CII).toFixed(2),
            parseFloat(noonReportDataTabelLastRow.distrun).toFixed(2),
            parseFloat(MASOFCO2).toFixed(2),
            parseFloat(MASSOFCARGO).toFixed(2),
            parseFloat(EEOI).toFixed(2),
            parseFloat(displacementValue).toFixed(2),
            parseFloat(robColTotal).toFixed(2),
            noonReportDataTabelLastRow.id,
            noonReportDataTabelLastRow.reportdatetime,
            "demand",
          ],
        ];
      }
    }
  } catch (error) {
    console.log(error);
  }
};

exports.saveDataInCIIEEOIDataInOneTime = async function (values) {
  try {
    const query = format(
      `INSERT INTO ${CIIEEOIDATATABLE} (voyageno, vesselid, trimm, deadweight, transportworkdone, transportworkdoneCII,attainedcii, distrun, masofco2, massofcargo, eeoi, displacementValue, robColTotal, noonreportid, ReportDateTime, type) VALUES %L`,
      values
    );
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, []);
    if (dbResponse) {
      return true;
    } else {
      console.error(
        "Error Occurred While select  Record In CIIEEOICalData Table"
      );
      return false;
    }
  } catch (error) {
    console.error(error);
  }
};

exports.saveDataInCIIEEOIAvgDataInOneTime = async function (values) {
  try {
    const query = format(
      `INSERT INTO ${CIIEEOIDATATABLEAVG}
    (voyageno, vesselid, deadweight_cal, transportworkdone_cal, transportworkdoneCII_cal,attainedcii_cal,
        distrun_sum,masofco2_cal,massofcargo_cal,eeoi_cal,noonreportid, type) VALUES %L`,
      values
    );
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, []);
    if (dbResponse) {
      return true;
    } else {
      console.error(
        "Error Occurred While select  Record In CIIEEOIDATATABLEAVG Table"
      );
      return false;
    }
  } catch (error) {
    console.error(error);
  }
};

exports.saveDataInCIIEEOIDataInOneTime1 = async function (values) {
  try {
    for (let index = 0; index < values.length; index++) {
      const element = values[index];
      const d = `INSERT INTO ${CIIEEOIDATATABLE}
        (voyageno,vesselid,trimm,deadweight,transportworkdone,transportworkdoneCII,attainedcii,
        distrun,masofco2,massofcargo,eeoi,noonreportid) 
         VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id;`;
      const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

      const dbResponse = await DataAccessAdaptor.executeQueryAsync(d, element);
      if (dbResponse) {
      } else {
        console.log(element);
        console.error(
          "Error Occurred While select  Record In CIIEEOICalData Table"
        );
        return {};
      }
    }
  } catch (error) {
    console.error(error);
  }
};

 async function getHfoValuesForMassOfCargoCal (vesselId, voyageno) {
  try {
    let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `select max(robhfo) as robhfo ,max(robulsgo) as robulsgo,max(robfw) as robfw  from ${MRV_NOON_REPORT} where voyage='${voyageno}' and vesselid=${vesselId}`;
    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);

    if (dbResponse) {
      if (dbResponse.rows.length > 0) {
        return dbResponse.rows;
      }
    } else {
      return {};
    }
  } catch (error) {
    console.error(error);
  }
};

exports.fetchHydrostaticData = async function () {
  const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
  const selectQuery = `SELECT * FROM ${HYDROSTATIC}`;
  const dbResponse = await DataAccessAdaptor.executeQueryAsync(
    selectQuery,
    null
  );
  if (dbResponse.rows.length > 0) {
    return dbResponse.rows;
  } else {
    return {};
  }
};

exports.getCIIEEOIvalues = async (vesselId = "") => {
  const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
  const selectQuery = `SELECT * FROM ${CIIEEOIDATATABLE} WHERE vesselid = ${vesselId}`;
  const dbResponse = await DataAccessAdaptor.executeQueryAsync(
    selectQuery,
    null
  );
  if (dbResponse.rows.length > 0) {
    return dbResponse.rows;
  } else {
    return {};
  }
};

exports.getCiiEeoiAvgValues = async (vesselId, voyage, type) => {
  const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
  const selectQuery = `SELECT * FROM ${CIIEEOIDATATABLEAVG} WHERE voyageno='${voyage}' AND vesselid='${vesselId}' AND type='${type}'`;
  const dbResponse = await DataAccessAdaptor.executeQueryAsync(
    selectQuery,
    null
  );
  if (dbResponse.rows.length > 0) {
    return dbResponse.rows;
  } else {
    return {};
  }
};

exports.getEEOIValuesForGraph = async (vesselId = "", noonReportId) => {
  const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
  const selectQuery = `SELECT eeoi, massofcargo, distrun, voyageno as voyage, reportdatetime, noonreportid  FROM ${CIIEEOIDATATABLE} WHERE vesselid = ${vesselId} AND type = 'demand'`;
  const dbResponse = await DataAccessAdaptor.executeQueryAsync(
    selectQuery,
    null
  );
  if (dbResponse.rows.length > 0) {
    return dbResponse.rows;
  } else {
    return {};
  }
};

exports.getCIIValuesForGraph = async (vesselId) => {};

exports.getEEOIValuesForVoyagesGraph = async (vesselId) => {
  const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
  const selectQuery = `SELECT eeoi_cal as eeoi, massofcargo_cal as massofcargo, distrun_sum as distrun, voyageno as voyage  FROM ${CIIEEOIDATATABLEAVG} WHERE vesselid = ${vesselId} AND type = 'demand' `;
  const dbResponse = await DataAccessAdaptor.executeQueryAsync(
    selectQuery,
    null
  );
  if (dbResponse.rows.length > 0) {
    return dbResponse.rows;
  } else {
    return {};
  }
};
