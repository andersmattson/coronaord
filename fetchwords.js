const request = require("request");
const sanitize = require("sanitize-html");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const fs = require("fs");

let url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR0EpMvH-hxN0CMQm891ZlhY7M_6dX0qRBSrdrz-IVMY-7Uo_XwTbu9fGkNrb_pBRXWQFpdGB2SF_Xg/pub?gid=0&single=true&output=csv";

var saolHeaders = {
    'Referer': 'https://svenska.se/tre/'
};

var currentWord;
var words = [];
var wordsObj = {};
var wordsObjPrefix = "var wordsObj = ";
var saolBaseUrl = 'https://svenska.se/tri/f_saol.php?sok=';

request( url, function(error, response, body){
    words = body.split('\r\n');
    let json = "var allWords = " + JSON.stringify(words);

    fs.writeFileSync("dist/words.js", json );
    wordsObj = JSON.parse(fs.readFileSync("dist/saol.js",{ encoding: 'utf8'}).replace(wordsObjPrefix, ""));
    console.log("Fetched spreadsheet");
    nextRequest();
});

let nextRequest = () => {
    if( words.length == 0){
        finishSaolRequests();
        return;
    }
    currentWord = words.pop().replace(/^Corona/i, "");
    
    if ( wordsObj[currentWord] === undefined ){
        console.log("Requesting " + currentWord);
        request({
            url: saolBaseUrl + encodeURIComponent(currentWord),
            headers: saolHeaders
        }, saolCallback );
    } else {
        nextRequest();
    }
};

let saolCallback = (error, response, body) => {
    if( error ){
        console.log("Something went wrong when fetching SAOL definition.");
        finishSaolRequests();
        return
    }

    if( body.indexOf( "i SAOL gav inga svar" ) > -1 ){
        wordsObj[currentWord] = '<span class="nodef">Definitionen hittades inte.</span>';
    } else {
        wordsObj[currentWord] = body;
        console.log("Added " + currentWord);
    }

    nextRequest();
};

let finishSaolRequests = () => {
    fs.writeFileSync("dist/saol.js", wordsObjPrefix + JSON.stringify(wordsObj));

    Object.keys(wordsObj).forEach((key) => {
        let frag = JSDOM.fragment(wordsObj[key].replace(/[\r\t\n]/gi, ""));
        let table = frag.querySelector("table");
        if(table){
            table.parentNode.removeChild(table);
        }
        let spaltnr = frag.querySelector(".spaltnr");
        if(spaltnr){
            spaltnr.parentNode.removeChild(spaltnr);
        }
        wordsObj[key] = sanitize(frag.firstChild.outerHTML, {
            allowedTags: ["div", "span", "a", "i"],
            allowedAttributes: {
                '*': ['class']
            }
        });
    });
    fs.writeFileSync("dist/saol2.js", wordsObjPrefix + JSON.stringify(wordsObj));
};