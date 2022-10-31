'use strict';

const CryptoJS = require("crypto-js");
const sha512 = require('js-sha512');

const getEncryptedPassword = function (password, key) {
    const sha512Encrypted = sha512.sha512(key);
    return getAESEncryptedPassword(password, sha512Encrypted.substring(0, 16),
        sha512Encrypted.substring(sha512Encrypted.length - 16, sha512Encrypted.length))
};

const getAESEncryptedPassword = function (password, secretKey, ivParamSpec) {
    const rkEncryptionKey = CryptoJS.enc.Utf8.parse(secretKey);
    const rkEncryptionIv = CryptoJS.enc.Utf8.parse(ivParamSpec);
    const encrypted = CryptoJS.AES.encrypt(password.toString(), rkEncryptionKey,
        {mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7, iv: rkEncryptionIv});

    return encrypted.ciphertext.toString(CryptoJS.enc.Base64);
};

module.exports = {
    getEncryptedPassword: getEncryptedPassword
};
