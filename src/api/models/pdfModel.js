'use strict';

const DataAccessAdaptorSingleton = require("../adaptors/dataAccessAdaptorSingleton");
const { REPORT_TABLE_DATA } = require("../utils/tables");
let { Util } = require("../utils/util");
const fs = require('fs');
const path = require('path');
const dateFormat = require('dateformat');


//  create pdf_data table==>
exports.createTable = async function () {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const query = `create table "${REPORT_TABLE_DATA}"
    (
        id serial
        constraint ${REPORT_TABLE_DATA}_pk
        primary key,
        year integer,
        month varchar,
        vesselname varchar,
        filename varchar,
        filepath varchar,
        uploadedby varchar,
        startDate varchar,
        endDate varchar,
        monthly_weekly varchar,
        timestamp timestamp without time zone 
      );`
    const dbResponse = await DataAccessAdaptor.executeQueryAsync(query, null);
    if (dbResponse) {
        console.log("PDF file Report Table Created Successfully!!!");
    } else {
        console.error("Error Creating PDf file Report Table!!!");
    }
}




//  insert Pdf file Report data queries==>


exports.uploadReportData = async function (request, resp) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const insertQuery = `INSERT INTO "${REPORT_TABLE_DATA}" (year,month,vesselname,filename,filepath,uploadedby,startdate,enddate,monthly_weekly,timestamp) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`;
    let timestamp
    const values = [
        request.body.year,
        request.body.month,       
        request.body.vesselname,
        request.file.originalname,
        request.file.filename,
        request.body.uploadedBy, 
        dateFormat(request.body.startdate,"yyyy-mm-dd"),
        dateFormat(request.body.endDate,"yyyy-mm-dd"),
        request.body.monthly,
        timestamp=Util.getNewDate()
    ];
    const dbResponse = await DataAccessAdaptor.executeQueryAsync(insertQuery, values)
    if (dbResponse) {
        console.log("Record saved Succesfully ");
        return dbResponse;

    } else {
        console.error("Error Occurred While Inserting Pdf Report In Table");
    }
};


exports.downloadReportData = async function (request, resp) {
    fs.readdir(path.resolve(__dirname, "../PDFFiles/", 'AllFiles'),
        (err, files) => {
            if (err) throw err;
            for (let file of files) {
                console.log(file);
                const filepath = request.query.filepath;
                if (file === filepath) {
                    const response = (filepath)
                        return response;
                }
               
            }
        }
    );
    // Path at which image will get downloaded
    //const filePath = '';

}


//  get all Pdf File Report from database==>
exports.getAllPdfdata = async function () {

    if (!Util)
        Util = require("../utils/util").Util;

    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const selectQuery = `SELECT id,  "year", "month", "vesselname", "filename" ,"startdate","endDate","monthly_weekly" from ${REPORT_TABLE_DATA};`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(selectQuery, null);

    if (dbResponse) {
        console.log("Fetched All Pdf Data from Pdf Report Table");
        return dbResponse.rows;
    } else {
        console.error("Error Occurred While fetching data from Pdf Table");
        return [];
    }
};




//  get one Pdf File Report from database==>

exports.getPdfById = async function (request, resp) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const selectQuery = `SELECT id, "year", "month", "vesselname", "filename" from ${PDF_file}
     where id = ${PdfID};`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(selectQuery, null);

    if (dbResponse) {
        console.log("Fetched PdfById from Pdf Table")
        return dbResponse.rows;
    } else {
        console.error("Error Occurred While fetching PdfById from Pdf Table");
        return null;
    }
};




// delete pdf file Report  ===>
exports.deleteReportData = async (request) => {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const deleteQuery = `DELETE from ${REPORT_TABLE_DATA} where id = ${request.query.id}`;

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(deleteQuery, null);

    if (dbResponse) {
        console.log("Deleting Pdf Data By ID from Pdf Table")
        return dbResponse.rows[0];
    } else {
        console.error("Error Occurred While Deleting Pdf Data By ID from Pdf Table");
        return {};
    }
};

//  Update Pdf file Report ===>
exports.updatePdfById = async (request) => {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
    const updateQuery = `UPDATE from ${REPORT_TABLE_DATA} where id = ${request.query.id}`;


    const dbResponse = await DataAccessAdaptor.executeQueryAsync(updateQuery, null);


    let queryBuilder = "";

    queryBuilder = queryBuilder.substring(0, queryBuilder.length);

    if (dbResponse) {
        console.log("Updated PdfById from Pdf Table")
        return dbResponse.rows[0];
    } else {
        console.error("Error Occurred While Updating PdfById from Pdf Table");
        return {};
    }
};

exports.getOriginalData = async function (id, vesselname) {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const updateQuery = `SELECT originaldata FROM  ${PDF_file} where id = $1  and vesselname = $2;`;

    const values = [id, vesselname]

    const dbResponse = await DataAccessAdaptor.executeQueryAsync(updateQuery, values);

    if (dbResponse) {
        console.log("all pdf data is update successfully");
        return dbResponse.rows[0];
    } else {
        console.error("Error Occurred While get pdf file Records from pdf Table");
        return false;
    }
};


exports.getAllPdfReportData = async function () {
    const DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();

    const Query = `SELECT * FROM  "${REPORT_TABLE_DATA}" order by id desc`;
    const dbResponse = await DataAccessAdaptor.executeQueryAsync(Query);
    if (dbResponse) {
        console.log("All Report data Fetch  successfully");
        return dbResponse.rows;

    } else {
        console.error("Error Occurred While get pdf file Records from pdf Table");
        return false;
    }
};



exports.syncAllPdfsData = async function () {
    allPdfReportData = null;
    allPdfReportData = await this.getAllPdfData();
};
