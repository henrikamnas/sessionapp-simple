"use strict";

const https = require('https');
const fs = require('fs');
const path = require('path');

const express = require('express');
const cookieParser = require('cookie-parser');
const qsocks = require('qsocks');


// Requires administrative priviliges to access this folder
const CERTIFICATE_PATH = 'C:\\ProgramData\\Qlik\\Sense\\Repository\\Exported Certificates\\localhost'

// Template App GUID and Cookie Name
const TEMPLATE_GUID = '35c2c247-d279-45ae-943d-641641833d5b';
const COOKIE_NAME = 'X-Qlik-Session'

// Config for qsocks to connect to QES
const baseconfig = {
    host: 'localhost',
    isSecure: true,
    origin: 'https://localhost',
    debug: true,
    prefix: '/',
    rejectUnauthorized: false // Don't reject self-signed certificates
};


const app = express();
app.use(cookieParser());

app.get('/', function(req, res) { 
  
    if(req.cookies[COOKIE_NAME]) {

        // Generate a dummy guid that will be used for engine session.
        const appId = generateUUID();

        // Copy config and hi-jack users session
        var config = Object.assign({}, baseconfig);
        config.appname = appId;
        config.headers = {
            'Cookie': COOKIE_NAME + '=' + req.cookies[COOKIE_NAME]
        };

        // Connect to QIX and create a session app.
        qsocks.Connect(config).then(global => {
            return global.createSessionAppFromApp(TEMPLATE_GUID).then(app => {
                return app.doReload()
            });
        })
        .then(() => {
            res.send(appId);
        })
        .catch(err => console.log)

    } else {
        res.send('Shit hit the fan :(')
    };

});

// Start server and listen to port 3000
https.createServer({
    key: fs.readFileSync( path.join(CERTIFICATE_PATH, 'server_key.pem') ),
    cert: fs.readFileSync( path.join(CERTIFICATE_PATH, 'server.pem') ),
}, app).listen(3000)


function generateUUID() {
  var d = new Date().getTime();
  var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
  });
  return uuid;
};