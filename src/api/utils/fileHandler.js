'use strict';

/*
* Util class to handle all File read write operations
* */

const fs = require('fs');

const createDir = (dirPath, dirName) => {
    fs.mkdir(dirPath + "/" + dirName, {recursive: true}, (error) => {
        if (error) {
            console.error('An error occurred: ', error);
        } else {
            console.log('Directory created successfully!');
        }
    });
};

const createFile = (filePath, fileName, fileContent) => {
    /*fs.writeFile(filePath + "/" + fileName, fileContent, (error) => {
        if (error) {
            console.error('An error occurred: ', error);
        } else {
            console.log('File created successfully!');
        }
    });*/
    /*fs.open(filePath + "/" + fileName, "wx", function (err, fd) {
        if (err) {
            console.log('An error occurred: ', err);
        } else {
            fs.close(fd, function (err) {
                if (err) {
                    console.log('An error occurred: ', err);
                }
            });
            console.log('File created successfully!');
        }
    });*/
    fs.exists(filePath + "/" + fileName, function (exists) {
        if(!exists) {
            fs.writeFile(filePath + "/" + fileName, JSON.stringify(fileContent), {flag: 'wx'}, (error, data) => {
                if (error) {
                    console.error('An error occurred: ', error);
                } else {
                    console.log('File created successfully!');
                }
            });
        }
    });
};

module.exports = {
    createDir: createDir,
    createFile: createFile
};
