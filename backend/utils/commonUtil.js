const CryptoJS = require("crypto-js");

const generateMD5Hash = (fileName) => {
    return CryptoJS.MD5(fileName).toString();
};

module.exports = { generateMD5Hash };