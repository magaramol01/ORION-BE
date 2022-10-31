'use strict';
const { Util } = require("../utils/util");
const PdfModel = require("../models/pdfModel");
const fs = require('fs');
const dateFormat = require('dateformat');

// for upload pdf file
const path = require("path")
// const multer = require("multer")


// CRUD CONTROLLER

// get pdf one file data==> 
const getById = async function (request) {
    const PdfID = request.body.id;
    let response = {};
    if (!PdfID)
        throw new Error('Cannot proceed empty Pdf ID!');

    let PdfData = await PdfModel.getPdfById(PdfID);
    if (PdfData.length > 0) {
        PdfData[0].isSuccess = true;
        response = PdfData;
    } else {
        response = {
            isSuccess: false,
            msg: "The Data You Are Trying To Get, Does Not Exist"
        }
    }

    return response;
};



const uploadReportInfo = async function (request) {
    const response = PdfModel.uploadReportData(request);
    return response
};


// const uploadReportInfo = async function (request) {


//     const uploadData = PdfModel.uploadReportData();

// }; 

// get all PdfReport file data==>

const getReportData = async function (request) {
    let response = await PdfModel.getAllPdfReportData(request);
    // console.log(response)
//    let res=response.map((item)=>{
//   dateFormat(item.startdate, "yyyy-mm-dd")&& dateFormat(item.enddate, "yyyy-mm-dd")
// }
return response;
};
 
const downloadpdfFile = async function (request, response) {
    // let response = await PdfModel.downloadReportData(request);
    // let response ="";
    let path1 = path.resolve(__dirname, "../PDFFiles/", 'AllFiles')
    const filePath = path.join(path1, `${request.query.filepath}`)
    const fileBuffer = await fs.promises.readFile(filePath);
    
    return fileBuffer;
};


const deletepdfFile = async function (request) {

    let response = PdfModel.deleteReportData(request);
    let path1 = path.resolve(__dirname, "../PDFFiles/", 'AllFiles')
    const Path = path.join(path1, `${request.query.filepath}`)
    fs.unlinkSync(Path, function (err) {
        if (err) {
            console.error(err);
        } else {
            console.log("File removed:", Path);
        }
    });
    return response;
};

const updateById = async function (request) {
    const Pdf = request.body;
    let oldfilename = "";
    let response;
    if (!Pdf)
        throw new Error('Cannot proceed empty Pdf ID!');

    if (Pdf.filename) {
        if (Pdf.oldfilename) {
            oldfilename = Pdf.oldfilename;
        }
    }
    Pdf['id'] = request.session.id;
    const pdfUpdateObj = _.cloneDeep(Pdf);
    const result = await PdfModel.updatePdfById(pdfUpdateObj);

    if (result.id) {
        await PdfModel.syncAllPdfsData();
        if (Pdf.filename) {
            const oldfileName = PdfModel.getShipMappingNameById(parseInt(Ship.id));
            delete shipJsonData[oldMappingName];
            pdfData[Pdf.filename] = parseInt(Pdf.id);

        }

    } else {
        response = {
            isSuccess: false,
            msg: "Ship Details Could Not Be Updated"
        }
    }
    return response;
};

//  pdf file upload in folder ======>

// var storage = multer.diskStorage({
//     destination: function (req, file, cb) {

//         // Uploads is the Upload_folder_name
//         cb(null, "uploadsPdf")
//     },
//     filename: function (req, file, cb) {
//       cb(null, file.filename + "-" + Date.now()+".pdf")
//     }
//   })






module.exports = {

    // getById:getById,
    getReportData: getReportData,
    deletepdfFile: deletepdfFile,
    // updateById:updateById,
    downloadpdfFile: downloadpdfFile,
    uploadReportInfo: uploadReportInfo


};