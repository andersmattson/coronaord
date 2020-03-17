const request = require("request");
const fs = require("fs");

let url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR0EpMvH-hxN0CMQm891ZlhY7M_6dX0qRBSrdrz-IVMY-7Uo_XwTbu9fGkNrb_pBRXWQFpdGB2SF_Xg/pub?gid=0&single=true&output=csv";

request( url, function(error, response, body){
    let words = body.split('\r\n');
    let json = "var allWords = " + JSON.stringify(words);
    fs.writeFileSync("dist/words.js", json );
});