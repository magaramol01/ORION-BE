"use strict";

const MRVNoonReportModel = require("../models/mrvNoonReportModel");
const ShipModel = require("../models/shipModel");
const { Util } = require("../utils/util");
const _ = require("lodash");
const dateFormat = require("dateformat");
const MRVStateJson = require("../../../configured_data/Data/mrv");
const ShipController = require("../controllers/shipController");
const UserController = require("../controllers/userController");
const EUPortsController = require("./euPortsController");
const appSettingsModel = require("../models/appSettingsModel");
const CIIStateJsonnew = require("../../../configured_data/Data/CII_new.json");
const {
  getCiiEeoiAvgValues,
  getEEOIValuesForGraph,
  getEEOIValuesForVoyagesGraph,
  saveDataInCIIEEOIDataTable,
  getAllMRVdata,
} = require("../models/mrvNoonReportModel");

let mrvParameterData = {};
let hydrostaticData = {};
let mrvDataForAllVoyageByVesselId = [];

const getVesselMappingName = (vesselName) => {
  const lowerCaseVesselName = vesselName.toLowerCase();
  if (lowerCaseVesselName.includes("indonesia"))
    return "nova-indonesia-express";
  if (lowerCaseVesselName.includes("china")) return "nova-china-express";
  if (lowerCaseVesselName.includes("brazil")) return "nova-brazil-express";
  if (lowerCaseVesselName.includes("nanjing")) return "nova-nanjing-express";
  if (lowerCaseVesselName.includes("canada")) return "nova-canada-express";
  if (
    lowerCaseVesselName.includes("asia") ||
    lowerCaseVesselName.includes("asia liberty")
  )
    return "nova-asia-liberty-express";
  if (lowerCaseVesselName.includes("kalimantan"))
    return "nova-kalimantan-express";
  if (lowerCaseVesselName.includes("batavia")) return "nova-batavia-express";
  if (lowerCaseVesselName.includes("medan")) return "nova-medan-express";
  if (lowerCaseVesselName.includes("tarakan")) return "nova-tarakan-express";
  if (lowerCaseVesselName.includes("sumatera")) return "nova-sumatera-express";
  if (lowerCaseVesselName.includes("xinhui")) return "nova-xinhui-express";
  if (lowerCaseVesselName.includes("kangchenjunga"))
    return "xpress-kanchenjunga";
};

const saveReportData = async function (request) {
  const reportData = request.body;

  if (reportData) {
    for (let i = 0; i < reportData.length; i++) {
      const exactData = reportData[i];

      const exactDataKeys = Object.keys(exactData);
      if (!exactDataKeys || exactDataKeys.length <= 0) {
        console.error("Cannot store empty data !!!");
        continue;
      }

      const liveHFO = exactData.liveHFO;
      if (!liveHFO) {
        exactData["liveHFO"] = 0;
      }
      const liveRealSFO = exactData.liveRealSFO;
      if (!liveRealSFO) {
        exactData["liveRealSFO"] = 0;
      }

      const vesselReportName = exactData.Vessel;
      const vesselMappingName = getVesselMappingName(vesselReportName);
      const vesselId = ShipModel.getShipIdByMappingName(vesselMappingName);

      exactData["vesselId"] = vesselId;

      let dbResponse = await MRVNoonReportModel.saveReportData(exactData);

      if (dbResponse) {
        let mrvDataRes =
          await MRVNoonReportModel.getLastInsertedRecordInMRVNoonReportTabel(
            vesselId
          );
        await MRVNoonReportModel.saveDataInCIIEEOIDataTable(
          mrvDataRes,
          exactData
        );
      }
    }
  }
};

const saveXpressReportData = async function (request) {
  const reportData = request.body;

  if (reportData) {
    for (let i = 0; i < reportData.length; i++) {
      const exactData = reportData[i];

      const exactDataKeys = Object.keys(exactData);
      console.log("NooN Report Data :: ", exactData);
      if (!exactDataKeys || exactDataKeys.length <= 0) {
        console.error("Cannot store empty data !!!");
        continue;
      }
      exactData["Vessel"] = "XPRESS KANGCHENJUNGA";

      const RPM = exactData.RPM;
      if (!RPM) {
        exactData["RPM"] = 0;
      }
      const ME_sp = exactData.ME_sp;
      if (!ME_sp) {
        exactData["ME_sp"] = 0;
      }
      const ME_pm = exactData.ME_pm;
      if (!ME_pm) {
        exactData["ME_pm"] = 0;
      }
      const AE_fo = exactData.AE_fo;
      if (!AE_fo) {
        exactData["AE_fo"] = 0;
      }
      const ME_fmc = exactData.ME_fmc;
      if (!ME_fmc) {
        exactData["ME_fmc"] = 0;
      }
      const BLR_fo = exactData.BLR_fo;
      if (!BLR_fo) {
        exactData["BLR_fo"] = 0;
      }
      const tc1rpm = exactData.tc1rpm;
      if (!tc1rpm) {
        exactData["tc1rpm"] = 0;
      }
      const tc2rpm = exactData.tc2rpm;
      if (!tc2rpm) {
        exactData["tc2rpm"] = 0;
      }
      let ME_ae_add =
        parseFloat(exactData.ME_sp) +
        parseFloat(exactData.ME_pm) +
        parseFloat(exactData.AE_fo);
      let Total_add =
        parseFloat(exactData.ME_sp) +
        parseFloat(exactData.ME_pm) +
        parseFloat(exactData.AE_fo) +
        parseFloat(exactData.BLR_fo);
      exactData["ME_ae"] = ME_ae_add.toFixed(1);
      exactData["Total"] = Total_add.toFixed(1);
      const lastInsertedValue =
        await MRVNoonReportModel.getLastInsertedRecords();
      if (lastInsertedValue == "" || !lastInsertedValue) {
        exactData["ME_vc"] = 0;
      } else {
        exactData["ME_vc"] =
          parseFloat(exactData["ME_fmc"]) - parseFloat(lastInsertedValue);
      }

      const vesselReportName = exactData.Vessel;
      const vesselMappingName = getVesselMappingName(vesselReportName);
      const vesselId = ShipModel.getShipIdByMappingName(vesselMappingName);

      exactData["vesselId"] = vesselId;

      const result = await MRVNoonReportModel.saveXpressReportData(exactData);
      if (result > 0) {
        let mrvObj = {};
        mrvObj["reportdate"] = exactData.ReportDate;
        mrvObj["rpm"] = exactData.RPM;
        mrvObj["me_fmc"] = exactData.ME_fmc;
        mrvObj["me_vc"] = exactData.ME_vc;
        mrvObj["me_sp"] = exactData.ME_sp;
        mrvObj["me_pm"] = exactData.ME_pm;
        mrvObj["ae_fo"] = exactData.AE_fo;
        mrvObj["me_ae"] = exactData.ME_ae;
        mrvObj["blr_fo"] = exactData.BLR_fo;
        mrvObj["total"] = exactData.Total;
        mrvObj["tc1rpm"] = exactData.tc1rpm;
        mrvObj["tc2rpm"] = exactData.tc2rpm;
        mrvObj["created_date"] = exactData.created;
        mrvObj["vesselid"] = exactData.vesselId;
        mrvObj["vessel"] = exactData.Vessel;

        mrvParameterData[exactData.vesselId] = mrvObj;
        console.log(
          "Data received /newConsumeXpressMRVNoonReportData and saved in DB."
        );
      } else {
        console.log("Data Not Inserted Error.");
      }
    }
  }
};

// function which returns eeoi graph data
const getEEOIInLadenCondition = async function (vesselId, mrvData) {
  let EEOIData = new Array();
  const mrvNoonReportIds = mrvData.rows.map((ele) => ele.id);
  const res = await getEEOIValuesForGraph(vesselId);

  const filteredResponsesForIds = [];
  res.forEach((ele) => {
    if (!mrvNoonReportIds.includes(ele.noonreportid)) return;
    filteredResponsesForIds.push(ele);
  });

  for (let i = 0; i < filteredResponsesForIds.length; i++) {
    const initialReportTimestamp =
      filteredResponsesForIds[i].reportdatetime.split("/")[0];
    const parsedReportTimestamp = dateFormat(
      initialReportTimestamp,
      Util.getCommonDateFormat1()
    );

    let eeoiObj = {
      Date: parsedReportTimestamp,
      EEOI: parseFloat(filteredResponsesForIds[i].eeoi),
      EEOI2022: 8.36,
      FOC: 0,
      MASSOFCARGO: parseFloat(filteredResponsesForIds[i].massofcargo),
      Distance: parseInt(filteredResponsesForIds[i].distrun),
      voyage: filteredResponsesForIds[i].voyage,
    };

    EEOIData.push(eeoiObj);
  }
  return EEOIData;
};

// function which return cii graph data
const ciiDataForGraph = async (mrvData) => {
  // const ciiValues = getCIIGraphofAllVoyageLast90Days;
  const { vesselId, Voyage } = mrvData.rows[0];
  const mrvNoonReportIds = mrvData.rows.map((ele) => ele.id);
  const ciiValues = await MRVNoonReportModel.fetchLast90DaysCIIData(
    vesselId,
    2022
  );

  const filteredCiiValues = [];

  ciiValues.forEach((ele) => {
    if (!mrvNoonReportIds.includes(ele.noonreportid)) return;
    filteredCiiValues.push(ele);
  });

  return filteredCiiValues;
};


const getAndPrepareMRVReportData = async function (
  mrvData,
  flag,
  mrvDataAllVoyageByvesselIdData,
  type = "demand"
) {
  const CFHFO = 3.114;
  const CFVLSF = 3.206;
  const CFULSG = 3.206;
  const vesselId = mrvDataAllVoyageByvesselIdData.rows[0].vesselId;

  const rowsWithoutDuplicateTimestamp = _.uniqBy(mrvData.rows, (e) => e.timestamp.toString());
  mrvData.rows = rowsWithoutDuplicateTimestamp;
  const mrvDataLength = mrvData.rows.length;

  let sumOfTotalVLSFO = 0;
  let sumOfTotalVLSGO = 0;
  let sumOfTotalULSGO = 0;
  let sumOfDistRun = 0;
  let cargo = "N.A.";

  let atSeaTotalHFOConsumption = 0;
  let atBerthTotalHFOConsumption = 0;
  let atSeaTotalMGOConsumption = 0;
  let atBerthTotalMGOConsumption = 0;
  let calculatedTimeAtSeaInH = 0;
  let calculatedTimeAtBerthInH = 0;
  let fuelConsumptionBarChartDataArr = [];
  let sourcePort;
  let destinationPort;
  let isSourceEUPort;
  let isDestinationEUPort;
  let departureLTTime;
  let departureTimeZone;
  let arrivalLTTime;
  let arrivalTimeZone;
  //---------------------------23-03-2022-Dev:-Yogesh Chavan------------------------------
  //---------------------------New Fuel data values         ------------------------------
  let sumOfAVS = 0;
  let sumOfMAS = 0;
  let AVSAvg = 0;
  let MASAvg = 0;
  //----------------------------------End-------------------------------------------------
  //--------------------------------Additional last row---------------------------
  let sumOfMERPM = 0;
  let sumOfSlip = 0;
  let sumOfWind = 0;
  let sumOfDouglasSeaState = 0;
  let sumOfSeaHeight = 0;
  let sumOfSwell = 0;
  let MERPMAvg = 0;
  let SlipAvg = 0;
  let WindAvg = 0;
  let DouglasSeaStateAvg = 0;
  let SeaHeightAvg = 0;
  let SwellAvg = 0;
  //--------------------End----------------------------------------
  //--------------------Cargo Cacl---------------------------------
  let meanDraftValue = 0;
  let lowerDraftValue = 0;
  let higherDraftValue = 0;
  let hydrostaticcsvdata = JSON.parse(hydrostaticData[1].hydrostaticcsvdata);
  let displacementValue = 0;
  let draftfwd = 0;
  let draftaft = 0;
  let robhfo = 0;
  let robvlsfo = 0;
  let robvlsgo = 0;
  let robulsgo = 0;
  let robmecyl = 0;
  let roblsmecyl = 0;
  let robmecc = 0;
  let robaecc = 0;
  let robfw = 0;
  // let tempCargo = 0;

  const mrvDataForCargo = mrvData.rows[0];

  robhfo = mrvDataForCargo.robhfo;
  robvlsfo = mrvDataForCargo.robvlsfo;
  robvlsgo = mrvDataForCargo.robvlsgo;
  robulsgo = mrvDataForCargo.robulsgo;
  robmecyl = parseFloat(mrvDataForCargo.robmecyl) / 1000;
  roblsmecyl = parseFloat(mrvDataForCargo.roblsmecyl) / 1000;
  robmecc = parseFloat(mrvDataForCargo.robmecc) / 1000;
  robaecc = parseFloat(mrvDataForCargo.robaecc) / 1000;
  robfw = mrvDataForCargo.robfw;
  draftfwd = mrvDataForCargo.draftfwd;
  draftaft = mrvDataForCargo.draftaft;
  let robColTotal =
    parseFloat(mrvDataForCargo.robhfo) +
    parseFloat(mrvDataForCargo.robvlsfo) +
    parseFloat(mrvDataForCargo.robvlsgo) +
    parseFloat(mrvDataForCargo.robulsgo) +
    parseFloat(mrvDataForCargo.robmecyl) / 1000 +
    parseFloat(mrvDataForCargo.roblsmecyl) / 1000 +
    parseFloat(mrvDataForCargo.robmecc) / 1000 +
    parseFloat(mrvDataForCargo.robaecc) / 1000 +
    parseFloat(mrvDataForCargo.robfw);

  meanDraftValue = parseFloat(
    (
      (parseFloat(mrvDataForCargo.draftfwd) +
        parseFloat(mrvDataForCargo.draftaft)) /
      2
    ).toFixed(4)
  );
  // check if meandraft value is not perfectly divisible by
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
    lowerDraftValue = parseFloat(
      (Math.floor((meanDraftValue * 100) / 5) * 0.05).toFixed(2)
    );

    higherDraftValue = parseFloat(
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

  cargo = parseFloat((displacementValue - 14285 - robColTotal).toFixed(2));

  for (let i = 0; i < mrvDataLength; i++) {
    let record = mrvData.rows[i];
    const totalHFO = parseFloat(record.TOTALHFO);
    const totalVLSFO = parseFloat(record.TOTALVLSFO);
    const totalVLSGO = parseFloat(record.TOTALVLSGO);
    const totalULSGO = parseFloat(record.TOTALULSGO);
    const distRun = parseFloat(record.distRun);
    const streamingTime = parseFloat(record.SteamingTime);
    const totalMGO = totalVLSFO + totalVLSGO + totalULSGO;
    const reportTimestamp = record.ReportDateTime;

    const initialReportTimestamp = reportTimestamp.split("/")[0];
    const tempinitialReportTimestampTZ = reportTimestamp
      .split("/")[1]
      .toString()
      .trim()
      .split(" ");
    const initialReportTimestampTZ =
      tempinitialReportTimestampTZ[2] + " " + tempinitialReportTimestampTZ[3]; // reportTimestamp.split("/")[1].split("UTC");
    const parsedReportTimestamp = dateFormat(
      initialReportTimestamp,
      Util.getCommonDateFormat1()
    );

    if (totalHFO) {
      atSeaTotalHFOConsumption += totalHFO;
    }
    if (totalMGO) {
      atSeaTotalMGOConsumption += totalMGO;
    }
    if (streamingTime) {
      calculatedTimeAtSeaInH += streamingTime;
    }

    sumOfTotalVLSFO += totalVLSFO;
    sumOfTotalVLSGO += totalVLSGO;
    sumOfTotalULSGO += totalULSGO;
    sumOfDistRun += distRun;

    fuelConsumptionBarChartDataArr.push({
      timestamp: parsedReportTimestamp,
      totalHFO: totalHFO,
      totalMGO: totalMGO,
      timestampValue: new Date(parsedReportTimestamp).getTime(),
    });

    if (i === 0) {
      sourcePort = record.Scr;
      departureLTTime = parsedReportTimestamp;
      departureTimeZone = initialReportTimestampTZ;
      const lastIndex = sourcePort.lastIndexOf(",");
      const port = sourcePort.substring(0, lastIndex).trim();
      const country = sourcePort.substring(lastIndex + 1).trim();
      isSourceEUPort = EUPortsController.isEUPort(country, port);
      isSourceEUPort = isSourceEUPort ? "Yes" : "No";
    }

    if (i === mrvDataLength - 1) {
      destinationPort = record.Destination;
      arrivalLTTime = parsedReportTimestamp;
      arrivalTimeZone = initialReportTimestampTZ;
      const lastIndex = destinationPort.lastIndexOf(",");
      const port = destinationPort.substring(0, lastIndex).trim();
      const country = destinationPort.substring(lastIndex + 1).trim();
      isDestinationEUPort = EUPortsController.isEUPort(country, port);
      isDestinationEUPort = isDestinationEUPort ? "Yes" : "No";
    }

    //-----------------------------New-Fuel Data----------------------
    const AVS = parseFloat(record.avs);
    sumOfAVS += AVS;
    const MAS = parseFloat(record.mas);
    sumOfMAS += MAS;

    //---------------------------------Additional last row-------------------
    const MERPM = parseFloat(record.merpm);
    sumOfMERPM += MERPM;
    const SLIP = parseFloat(record.slip);
    sumOfSlip += SLIP;
    const WIND = parseFloat(record.wind);
    sumOfWind += WIND;
    const DOUGLASSEASTATE = parseFloat(record.douglasseastate);
    sumOfDouglasSeaState += DOUGLASSEASTATE;
    const SEAHEIGHT = parseFloat(record.seaheight);
    sumOfSeaHeight += SEAHEIGHT;
    const SWELL = parseFloat(record.swell);
    sumOfSwell += SWELL;
  }

  const sumOfTotalHFO = atSeaTotalHFOConsumption + atBerthTotalHFOConsumption;
  const sumOfTotalMGO = atSeaTotalMGOConsumption + atBerthTotalMGOConsumption;

  const calculatedFuelInKgNm =
    ((sumOfTotalHFO + sumOfTotalMGO) * 1000) / sumOfDistRun;
  const calculatedFuelIngPerNm =
    cargo === "N.A." ? "N.A." : (calculatedFuelInKgNm * 1000) / cargo;

  let co2InKgNm = 0;

  co2InKgNm =
    sumOfTotalHFO * CFHFO + sumOfTotalVLSFO * CFVLSF + sumOfTotalULSGO * CFULSG;

  AVSAvg = sumOfAVS / mrvDataLength;
  MASAvg = sumOfMAS / mrvDataLength;

  //------------------------------- New Additional Values ---------------------
  MERPMAvg = sumOfMERPM / mrvDataLength;
  SlipAvg = sumOfSlip / mrvDataLength;
  WindAvg = sumOfWind / mrvDataLength;
  DouglasSeaStateAvg = sumOfDouglasSeaState / mrvDataLength;
  SeaHeightAvg = sumOfSeaHeight / mrvDataLength;
  SwellAvg = sumOfSwell / mrvDataLength;

  //--------------------------------EEOI All Values graph-----------------------

  if (mrvDataAllVoyageByvesselIdData != undefined && flag === "All") {
    mrvDataForAllVoyageByVesselId = await getEEOIInLadenCondition(
      vesselId,
      mrvData
    );
  }

  let EEOIDataInLadenConditionBeforeAvg = await getEEOIInLadenCondition(
    vesselId,
    mrvData
  );

  let mrvReportData = new Map();
  mrvReportData.set("totalConsumptionHeavyFuelOil", sumOfTotalHFO);
  mrvReportData.set("totalConsumptionVeryLowSulphurFuelOil", sumOfTotalVLSFO);
  mrvReportData.set("totalConsumptionVeryLowSulphurGasOil", sumOfTotalVLSGO);
  mrvReportData.set("totalConsumptionULSGO", sumOfTotalULSGO);
  mrvReportData.set("calculatedFuelInKgNm", calculatedFuelInKgNm);
  mrvReportData.set("calculatedFuelInNmTn", calculatedFuelIngPerNm);
  mrvReportData.set("calculatedCO2InKgNm", co2InKgNm);
  mrvReportData.set(
    "consumptionHFOMGOBarGraphData",
    fuelConsumptionBarChartDataArr
  );
  mrvReportData.set("departurePort", sourcePort);
  mrvReportData.set("arrivalPort", destinationPort);
  mrvReportData.set("departureEUPort", isSourceEUPort);
  mrvReportData.set("arrivalEUPort", isDestinationEUPort);
  // added as of now static as values are not available
  mrvReportData.set("sulphurContentHFO", 1.84);
  mrvReportData.set("sulphurContentVLSFO", 0.08);
  mrvReportData.set("densityHFO", 0.978);
  mrvReportData.set("densityMGO", 0.853);
  mrvReportData.set("atSeaCargoOnBoard", cargo);
  mrvReportData.set("consumptionAtBerthHFO", atBerthTotalHFOConsumption);
  mrvReportData.set("consumptionAtSeaHFO", atSeaTotalHFOConsumption);
  mrvReportData.set("consumptionAtBerthMGO", atBerthTotalMGOConsumption);
  mrvReportData.set("consumptionAtSeaMGO", atSeaTotalMGOConsumption);
  mrvReportData.set("consumptionDistanceOverGround", sumOfDistRun);
  mrvReportData.set("calculatedTimeAtSeaInH", calculatedTimeAtSeaInH);
  mrvReportData.set("calculatedTimeAtBerthInH", calculatedTimeAtBerthInH);
  mrvReportData.set(
    "departureLTTime",
    dateFormat(departureLTTime, Util.getDDMMMYYYY())
  );
  mrvReportData.set("departureTimeZone", departureTimeZone);
  mrvReportData.set(
    "arrivalLTTime",
    dateFormat(arrivalLTTime, Util.getDDMMMYYYY())
  );
  mrvReportData.set("arrivalTimeZone", arrivalTimeZone);

  //---------------------------------Cargo Releted Value-------------------------
  mrvReportData.set("meanDraftValue", meanDraftValue);
  mrvReportData.set("displacementValue", displacementValue);
  mrvReportData.set("draftfwd", draftfwd);
  mrvReportData.set("draftaft", draftaft);
  mrvReportData.set("robhfo", robhfo);
  mrvReportData.set("robvlsfo", robvlsfo);
  mrvReportData.set("robvlsgo", robvlsgo);
  mrvReportData.set("robulsgo", robulsgo);
  mrvReportData.set("robmecyl", robmecyl);
  mrvReportData.set("roblsmecyl", roblsmecyl);
  mrvReportData.set("robmecc", robmecc);
  mrvReportData.set("robaecc", robaecc);
  mrvReportData.set("robfw", robfw);

  //---------------------------------Fuel data -------------------------
  mrvReportData.set("avsavg", AVSAvg);
  mrvReportData.set("avgmas", MASAvg);

  //------------------------Additional row values-------------------------

  mrvReportData.set("merpmavg", MERPMAvg);
  mrvReportData.set("slipavg", SlipAvg);
  mrvReportData.set("windavg", WindAvg);
  mrvReportData.set("douglasseastateavg", DouglasSeaStateAvg);
  mrvReportData.set("seaheightavg", SeaHeightAvg);
  mrvReportData.set("swellavg", SwellAvg);

  const ciigraphData = await ciiDataForGraph(mrvData);
  // ------------ CII graph data --------------//
  mrvReportData.set("ciigraphbydate", ciigraphData);
  mrvReportData.set("ciigraphbyvoyage", ciigraphData);

  //-------------------EEOI graph data -----------------------------
  mrvReportData.set("EEOI_As_Per_Date", EEOIDataInLadenConditionBeforeAvg);
  mrvReportData.set(
    "EEOI_Laden_Condition_Date",
    EEOIDataInLadenConditionBeforeAvg
  );
  mrvReportData.set(
    "EEOI_Laden_In_Condition",
    EEOIDataInLadenConditionBeforeAvg
  );

  const calculatedCo2 = ciigraphData
    .filter((ele) => ele.type === type)
    .map((ele) => parseFloat(ele.co2))
    .reduce((a, b) => a + b, 0);

  const calculatedTransportWorkCII = ciigraphData
    .filter((ele) => ele.type === type)
    .map((ele) => parseFloat(ele.transportworkdonecii))
    .reduce((a, b) => a + b, 0);

  const calculatedCii =
    ciigraphData
      .filter((ele) => ele.type === type)
      .map((ele) => parseFloat(ele.attainedcii))
      .reduce((a, b) => a + b, 0) /
    (ciigraphData.length * 0.5);

  const calculatedEEOI =
    EEOIDataInLadenConditionBeforeAvg.map((ele) => parseFloat(ele.EEOI)).reduce(
      (a, b) => a + b,
      0
    ) / EEOIDataInLadenConditionBeforeAvg.length;

  mrvReportData.set("attainedCII", calculatedCii);
  mrvReportData.set("transportWorkDoneCII", calculatedTransportWorkCII);
  mrvReportData.set("totalCO2", calculatedCo2);
  mrvReportData.set("calculatedEEOICO2", calculatedEEOI);

  const getCIIRating = (attainedcii_cal) => {
    const attainedCII = parseFloat(attainedcii_cal);
    if (attainedCII <= 3.76) return "A";
    else if (3.76 <= attainedCII && attainedCII <= 4.11) return "B";
    else if (4.11 <= attainedCII && attainedCII <= 4.64) return "C";
    else if (4.64 <= attainedCII && attainedCII <= 5.16) return "D";
    else if (attainedCII >= 5.16) return "E";
  };

  const ciiRating = getCIIRating(calculatedCii);
  mrvReportData.set("ciiRating", ciiRating);

  return mrvReportData;
};

const getMRVState = async function (request) {
  const shipsData = await UserController.getAllShips(request);
  const allShipData = await ShipController.getAllData();
  let vesselId = request.query.vesselId;

  if (!vesselId || shipsData.length > 0) {
    vesselId = Util.getDefaultVesselId(shipsData);
  }

  vesselId = parseInt(vesselId);
  let mrvReportData = new Map();
  let voyagesFilterArr = [];
  let latestVoyage;
  let latestVoyageScr;
  let latestVoyageDestination;

  const voyagesData = await MRVNoonReportModel.getVoyages(vesselId);
  const latestVoyageLaden = voyagesData.rows.find((voyage) =>
    voyage.Voyage.includes("L")
  );

  for (let i = 0; i < voyagesData.rows.length; i++) {
    let record = voyagesData.rows[i];
    prepareVoyageData(record, voyagesFilterArr);
    if (latestVoyageLaden.Voyage === record.Voyage) {
      voyagesFilterArr[i]["isLatest"] = true;
      latestVoyage = record.Voyage;
      latestVoyageScr = record.Scr;
      latestVoyageDestination = record.Destination;
    }
  }

  if (voyagesFilterArr.length > 0) {
    const mrvDataForFirstCarousel = await MRVNoonReportModel.getMRVReportData(
      vesselId
    );

    const mrvData = await MRVNoonReportModel.getMRVReportDataByVoyage(
      vesselId,
      latestVoyage,
      latestVoyageScr,
      latestVoyageDestination
    );

    mrvReportData = await getAndPrepareMRVReportData(
      mrvData,
      "All",
      mrvDataForFirstCarousel
    );

    mrvReportData.set("voyagesFilter", voyagesFilterArr);
  }

  const mrvStateJsonCopy = _.cloneDeep(MRVStateJson);
  fillMrvReportData(mrvStateJsonCopy, mrvReportData, vesselId);

  return {
    fleetDashboardVesselFilter: Util.getFleetFilterData(
      appSettingsModel.getAppSettingsJsonData().fleetDashboardVesselFilter,
      allShipData
    ),
    mrvStateJson: mrvStateJsonCopy,
    shipNameData: shipsData,
    allShipData: allShipData,
    modbusTrackerData: {
      isMachineryDataReceived: true,
      isNMEADataReceived: true,
    },
  };
};

const getMRVStateByVoyage = async function (request, isCII) {
  const vesselId = parseInt(request.query.vesselId);
  const voyageStr = request.query.voyage;
  const ciiType = request.query.type;

  const voyageStrArr = voyageStr.split(" From [ ");

  const voyageId = voyageStrArr[0];
  const source = voyageStrArr[1].split(" ] To [ ")[0];
  const destination = voyageStrArr[1].split(" ] To [ ")[1].split(" ]")[0];
  const mrvDataForFirstCarousel = await MRVNoonReportModel.getMRVReportData(
    vesselId
  );

  const mrvData = await MRVNoonReportModel.getMRVReportDataByVoyage(
    vesselId,
    voyageId,
    source,
    destination
  );

  const mrvReportData = await getAndPrepareMRVReportData(
    mrvData,
    "ByVoyage",
    mrvDataForFirstCarousel,
    ciiType
  );

  let resultStateJson;
  if (isCII) resultStateJson = _.cloneDeep(CIIStateJsonnew);
  else resultStateJson = _.cloneDeep(MRVStateJson);
  fillMrvReportData(resultStateJson, mrvReportData, parseInt(vesselId));

  return {
    mrvStateJson: resultStateJson,
  };
};

const getMRVStateByDate = async function (request, isCII) {
  const vesselId = request.query.vesselId;
  const fromDate = request.query.fromDate;
  const toDate = request.query.toDate;
  const ciiType = request.query.type;

  const mrvDataForFirstCarousel = await MRVNoonReportModel.getMRVReportData(
    vesselId
  );
  
  const mrvData = await MRVNoonReportModel.getMRVReportDataByTime(
    vesselId,
    fromDate,
    toDate
  );

  const mrvReportData = await getAndPrepareMRVReportData(
    mrvData,
    "byDate",
    mrvDataForFirstCarousel,
    ciiType
  );

  let resultStateJson;

  if (isCII) resultStateJson = _.cloneDeep(CIIStateJsonnew);
  else resultStateJson = _.cloneDeep(MRVStateJson);

  fillMrvReportData(resultStateJson, mrvReportData, parseInt(vesselId));

  return {
    mrvStateJson: resultStateJson,
  };
};

const fillMrvReportData = function (jsonObj, mrvReportData, vesselId) {
  for (let key in jsonObj) {
    if (!jsonObj.hasOwnProperty(key)) {
      continue;
    }

    let currentObj = jsonObj[key];

    if (key === "widgetData") {
      jsonObj["widgetData"]["modbusParameterIdentifier"] = _.cloneDeep(
        currentObj.value
      ).replace("mapping_@_", "");
    }

    if (currentObj !== null && typeof currentObj == "object") {
      // going one step down in the object tree
      fillMrvReportData(jsonObj[key], mrvReportData, vesselId);
    } else {
      if (
        typeof currentObj === "string" &&
        currentObj.startsWith("mapping_@_")
      ) {
        const liveParameterMappingKey = currentObj.replace("mapping_@_", "");
        if (mrvReportData.has(liveParameterMappingKey)) {
          let val = mrvReportData.get(liveParameterMappingKey);
          let valWithScaling = Util.getScaledValue(
            val,
            vesselId,
            liveParameterMappingKey
          );

          jsonObj[key] = valWithScaling ? valWithScaling : "\u00a0\u00a0";
        } else {
          jsonObj[key] = "\u00a0\u00a0";
        }
      }
    }
  }
};

const getAllVesselsVoyageDetails = async function () {
  return await MRVNoonReportModel.getAllVesselsVoyageDetails();
};

const getMRVStateByDateAndVoyage = async function (request, isCII) {
  const vesselId = parseInt(request.query.vesselId);
  const fromDate = request.query.fromDate;
  const toDate = request.query.toDate;
  const vovageName = request.query.voyageName;

  let mrvReportData = new Map();
  let voyagesFilterArr = [];

  const voyagesData = await MRVNoonReportModel.getMRVReportDataByTime(
    vesselId,
    fromDate,
    toDate
  );

  const mrvData = await MRVNoonReportModel.getMRVReportDataByTimeAndVoyage(
    vesselId,
    fromDate,
    toDate,
    vovageName
  );

  mrvReportData = await getAndPrepareMRVReportData(
    mrvData,
    "byVoyage",
    voyagesData
  );

  mrvReportData.set("voyagesFilter", voyagesFilterArr);
  let resultStateJson;
  if (isCII) resultStateJson = _.cloneDeep(CIIStateJsonnew);
  else resultStateJson = _.cloneDeep(MRVStateJson);

  fillMrvReportData(resultStateJson, mrvReportData, parseInt(vesselId));

  return {
    mrvStateJson: resultStateJson,
  };
};

function parseMillisecondsIntoReadableTime(milliseconds) {
  const hours = milliseconds / (1000 * 60 * 60);
  const absoluteHours = Math.floor(hours);
  const h = absoluteHours > 9 ? absoluteHours : "0" + absoluteHours;

  //Get remainder from hours and convert to minutes
  const minutes = (hours - absoluteHours) * 60;
  const absoluteMinutes = Math.floor(minutes);
  const m = absoluteMinutes > 9 ? absoluteMinutes : "0" + absoluteMinutes;

  //Get remainder from minutes and convert to seconds
  const seconds = (minutes - absoluteMinutes) * 60;
  const absoluteSeconds = Math.floor(seconds);
  const s = absoluteSeconds > 9 ? absoluteSeconds : "0" + absoluteSeconds;

  return h + ":" + m + ":" + s;
}

function prepareVoyageData(record, voyagesFilterArr) {
  let voyageId = record.Voyage;
  if (voyageId) {
    voyageId = voyageId.replace("/From", "").trim();

    // const voyageStr = voyageId + " From [ " + record.Scr + " ] to [ " + record.Destination + " ] " + record.ETANextPort;
    const departureTime = dateFormat(
      record.first_value.split("/")[0],
      Util.getDDMMMYYYY()
    );
    const arrivalTime = dateFormat(
      record.last_value.split("/")[0],
      Util.getDDMMMYYYY()
    );
    const voyageStr =
      voyageId +
      " From [ " +
      record.Scr.trim() +
      " ]" +
      " To [ " +
      record.Destination.trim() +
      " ]";
    const voyageStrDisp =
      voyageId +
      " From [ " +
      record.Scr.trim() +
      " ]" +
      departureTime +
      " To [ " +
      record.Destination.trim() +
      " ]" +
      arrivalTime;
    if (!voyagesFilterArr.some((item) => item.label === voyageStr)) {
      voyagesFilterArr.push({
        voyageId: voyageId,
        label: voyageStrDisp,
        value: voyageStrDisp,
        forQuery: voyageStr,
        isLatest: false,
        reportDateTime: record.to_timestampreportdatetime,
      });
    }
  }
}

const loadMrvDataInMemory = async function () {
  const result = await MRVNoonReportModel.fetchLatestMrvNoonData();

  if (Object.keys(mrvParameterData).length === 0) {
    if (Object.keys(result).length > 0) {
      result.map((data) => {
        mrvParameterData[data.vesselid] = data;
      });
    }
  }
};

const getMrvData = function (vesselId) {
  if (mrvParameterData.hasOwnProperty(vesselId)) {
    return mrvParameterData[vesselId];
  } else {
    return {};
  }
};

// Dev :- Yogesh Chavan Date:-08-03-2022
// load and store in getHydrostaticData memory
const loadHydrostaticInMemory = async function () {
  const result = await MRVNoonReportModel.fetchHydrostaticData();

  if (Object.keys(hydrostaticData).length === 0) {
    if (Object.keys(result).length > 0) {
      result.map((data) => {
        hydrostaticData[data.vesselid] = data;
      });
    }
  }
};

const getHydrostaticData = function (vesselId) {
  if (hydrostaticData.hasOwnProperty(vesselId)) {
    return hydrostaticData[vesselId];
  } else {
    return {};
  }
};


const saveDataInCIIEOOITabel3 = async function (request) {
  try {
    const allMRVRows = await getAllMRVdata();
    for (let i = 0; i < allMRVRows.length; i++) {
      const saveResponse = await saveDataInCIIEEOIDataTable(allMRVRows[i]);
    }
  } catch (error) {
    console.log("error in populateing ciieeoi tables--->", error);
  }
};



async function getCIIGraphofAllVoyageLast90Days(request) {
  const vesselID = request.query.vesselId;
  const year = request.query.year;
  // const type = request.query.type;
  const result = await MRVNoonReportModel.fetchLast90DaysCIIData(
    vesselID,
    year
    // type
  );
  // const ciiStateJsonByType =
  if (result.length > 0) {
    let ciiReportData = new Map();
    return (ciiReportData.ciigraphdata = result);
    // return result;
  }
}

//SSH-53 Voyage Baner
const getVoageDetailsForDashboard = async function (request) {
  const vessel = request.query.vessel;
  const mrvDataByVesselID =
    await MRVNoonReportModel.getVoyageDetailsByVesselIdForDashboard(vessel);
  return {
    mrvlatestDataJson: mrvDataByVesselID.rows[0],
  };
};

const getAllVoyageBannerData = async function (request) {
  let response = {};
  const MRVBannerData = await MRVNoonReportModel.getAllMRVBannerData();
  let MRVBannerDataCopy = _.cloneDeep(MRVBannerData);
  if (MRVBannerData.length > 0) {
    response = MRVBannerDataCopy;
  } else {
    response = {
      isSuccess: false,
      msg: "There are no MRVBanner Records available",
    };
  }
  return response;
};

const deleteVoyageNumberById = async function (request) {
  let response = {};
  const VoyageBannerID = request.body.id;
  if (!VoyageBannerID)
    throw new Error("Cannot proceed empty voyage banner ID!");

  const result = await MRVNoonReportModel.deleteVBDataById(VoyageBannerID);
  if (result.voyage) {
    await MRVNoonReportModel.syncAllVoaygeNumberData();
    response = response = {
      isSuccess: true,
      msg: "The Data voyage banner Data is Successfully Deleted By ID",
    };
  } else {
    response = {
      isSuccess: false,
      msg: "The Data You Are Trying To Get, Does Not Exist",
    };
  }
  return response;
};

const insertMrvBannerData = async function (request) {
  const mrvbannerdata = request.body;
  let response = {};
  if (!mrvbannerdata)
    throw new Error("Cannot proceed empty mrvbannerdat details!");

  mrvbannerdata["userId"] = request.session.user.id;
  const result = await MRVNoonReportModel.saveMrvBannerData(mrvbannerdata);
  if (result.id) {
    await MRVNoonReportModel.syncAllVoaygeNumberData();
    const auditTrailInfo = Util.getAuditTrailInfo(
      "insertMrvBannerData",
      "voaygebannerdata",
      mrvbannerdata.voyage
    );
    AudiTrailModel.saveAuditTrail({
      userId: request.session.user.id,
      ipAddress: request.ip,
      action: auditTrailInfo.actionMsg,
      description: auditTrailInfo.descMsg,
    });
    response = {
      isSuccess: true,
      msg: "Mrv data insert successfully",
    };
  } else {
    response = {
      isSuccess: false,
      msg: "Error Occurred while inserting mrvbannerdata",
    };
  }
  return response;
};

const getById = async function (request) {
  const VBID = request.body.id;
  let response = {};
  if (!VBID) throw new Error("Cannot proceed empty Ship ID!");

  let VBData = await MRVNoonReportModel.getVBDataById(VBID);
  if (VBData.length > 0) {
    VBData[0].isSuccess = true;
    response = VBData;
  } else {
    response = {
      isSuccess: false,
      msg: "The Data You Are Trying To Get, Does Not Exist",
    };
  }

  return response;
};

const updateById = async function (request) {
  const VoyageBanner = request.body;

  let response;
  if (!VoyageBanner) throw new Error("Cannot proceed empty Voyage Banner ID!");

  // VoyageBanner['userid']=request.session.user.id;
  const VoyageBannerUpdateObj = _.cloneDeep(VoyageBanner);
  const result = await MRVNoonReportModel.updateVBDataById(
    VoyageBannerUpdateObj
  );

  if (result.id) {
    await MRVNoonReportModel.syncAllVoaygeNumberData();
    response = response = {
      isSuccess: true,
      msg: "The Voyage Details are Successfully Updated",
    };
  } else {
    response = {
      isSuccess: false,
      msg: "Voyage Details Could Not Be Updated",
    };
  }
  return response;
};

module.exports = {
  getById: getById,
  updateById: updateById,
  insertMrvBannerData: insertMrvBannerData,
  deleteVoyageNumberById: deleteVoyageNumberById,
  getAllVoyageBannerData: getAllVoyageBannerData,
  saveReportData: saveReportData,
  saveXpressReportData: saveXpressReportData,
  getAndPrepareMRVReportData: getAndPrepareMRVReportData,
  getMRVState: getMRVState,
  getMRVStateByVoyage: getMRVStateByVoyage,
  getMRVStateByDate: getMRVStateByDate,
  getMRVStateByDateAndVoyage: getMRVStateByDateAndVoyage,
  getAllVesselsVoyageDetails: getAllVesselsVoyageDetails,
  fillMrvReportData: fillMrvReportData,
  loadMrvDataInMemory: loadMrvDataInMemory,
  getMrvData: getMrvData,
  getHydrostaticData: getHydrostaticData,
  loadHydrostaticInMemory: loadHydrostaticInMemory,
  // saveDataInCIIEOOITabel: saveDataInCIIEOOITabel,
  saveDataInCIIEOOITabel3: saveDataInCIIEOOITabel3,
  getCIIGraphofAllVoyageLast90Days: getCIIGraphofAllVoyageLast90Days,
  prepareVoyageData: prepareVoyageData,
  getVoageDetailsForDashboard: getVoageDetailsForDashboard,
};
