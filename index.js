// Example express application adding the parse-server module to expose Parse
// compatible API routes.
var request = require("request");
var express = require("express");
var ParseServer = require("parse-server").ParseServer;
var path = require("path");
var bodyParser = require("body-parser");
require('./.env');
var databaseUri = process.env.DATABASE_URI;

if (!databaseUri) {
  console.log("DATABASE_URI not specified");
}

var api = new ParseServer({
  databaseURI: databaseUri,
  cloud: process.env.CLOUD_CODE_MAIN || __dirname + "/cloud/main.js",
  appId: process.env.APP_ID || "myAppId",
  masterKey: process.env.MASTER_KEY,
  serverURL: process.env.SERVER_URL,
  javascriptKey: process.env.JAVASCRIPT_KEY,
  restAPIKey: process.env.REST_API_KEY,
  dotNetKey: process.env.DOT_NET_KEY,
  clientKey: process.env.CLIENT_KEY,
  liveQuery: {
    classNames: ["Posts", "Comments"] // List of classes to support for query subscriptions
  },
  oauth: {
    janraincapture: {
      janrain_capture_host: process.env.JANRAIN_CAPTURE_HOST
    }
  }
});

var app = express();

// Serve static assets from the /public folder
app.use("/public", express.static(path.join(__dirname, "/public")));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

const getRequestParts = req => {
  const { body, params, query } = req;
  return {
    body,
    params,
    query
  };
};
// extract the input data, and do the part before processing CRUD with Parse
const preProcess = req => {
  const { params, body, query } = getRequestParts(req);
  const entity =
    params.entity ||
    (body.params && body.params.entity) ||
    process.env.DEFAULT_ENTITY;
  const { db, what, data, criteria } = Object.assign(
    {},
    body || {},
    params || {}
  );
  return { db, what, data, criteria, entity };
};

// do the CRUD with Parse (network call)
const doCrud = instructions => {
  const { db, data, entity, criteria, method } = instructions;
  console.log(instructions);
  let options = null;
  
  if (method.toLowerCase() === 'get') {
    options = {
      method,
      url: `${process.env.SERVER_URL}/classes/${entity}`,
      headers: {
        "x-parse-application-id": process.env.APP_ID,
        "x-parse-javascript-key": process.env.JAVASCRIPT_KEY,
        "content-type": "application/x-www-form-urlencoded"
      },
      // body: data,
      form: {where: JSON.stringify(criteria)}
    };
  } else if (method.toLowerCase() === 'post') {
    options = {
      method,
      url: `${process.env.SERVER_URL}/classes/${entity}`,
      headers: {
        "x-parse-application-id": process.env.APP_ID,
        "x-parse-javascript-key": process.env.JAVASCRIPT_KEY,
        "content-type": "application/json"
      },
      body: data,
      json: true
    };
  } else if (method.toLowerCase() === 'delete') {
    options = {
      method,
      url: `${process.env.SERVER_URL}/classes/${entity}`,
      headers: {
        "x-parse-application-id": process.env.APP_ID,
        "x-parse-javascript-key": process.env.JAVASCRIPT_KEY,
        // "content-type": "application/x-www-form-urlencoded"
      },
      // body: data,
      body: {where: JSON.stringify(criteria)}
    };
  } else if (method.toLowerCase() === 'put') {
    options = {
      method,
      url: `${process.env.SERVER_URL}/classes/${entity}`,
      headers: {
        "x-parse-application-id": process.env.APP_ID,
        "x-parse-javascript-key": process.env.JAVASCRIPT_KEY,
        "content-type": "application/x-www-form-urlencoded"
      },
      // body: data,
      form: {where: JSON.stringify(criteria)}
    };
  }
  console.log(options);
  return new Promise((resolve, reject) => {
    request(options, function(error, response, body) {
      // console.log(response)
      resolve(error ? { error, success: false } : { body });
    });
  });
};

// main execute handler
app.put("/api/v1/execute", (req, res) => {
  const response = preProcess(req, res);
  res.json(response);
});

// all operations handler
app.all("/api/v1/:entity", async (req, res) => {
  const instructions = preProcess(req, res);
  const response = await doCrud({...instructions, method: req.method});
  res.json(response);
});

// Serve the Parse API on the /parse URL prefix
var mountPath = process.env.PARSE_MOUNT || "/parse";
app.use(mountPath, api);
app.use(mountPath + "/1", api); // handle old SDK calls too

// var kue = require('kue')
// var redisUrl = process.env.REDIS_URL
// kue.createQueue({ redis: redisUrl })
// app.use('/kue', kue.app) // For the kue dashboard
// var kueUiExpress = require('kue-ui-express');
// kueUiExpress(app, '/kue-ui/', '/api');

// Parse Server plays nicely with the rest of your web routes
app.get("/", function(req, res) {
  res
    .status(200)
    .send(
      'The server is up! Go to <a href="/test">/test</a> to make sure everything is working<br><br><br><hr><p><a href="https://gomix.com/#!/remix/parse-server/bd480ea2-8578-4c05-8924-41328b922d16"><img src="https://gomix.com/images/background-light/remix-on-gomix.svg"></a></p><p><a href="https://gomix.com/#!/project/parse-server">View Code</a></p>'
    );
});

// There will be a test page available on the /test path of your server url
// Remove this before launching your app
app.get("/test", function(req, res) {
  res.sendFile(path.join(__dirname, "/public/test.html"));
});

var port = process.env.PORT || 3000;
var httpServer = require("http").createServer(app);
httpServer.listen(port, function() {
  console.log("parse-server-example running on port " + port);
});

// This will enable the Live Query real-time server
ParseServer.createLiveQueryServer(httpServer);

// var kue = require('kue')
// var redisUrl = process.env.REDIS_URL
// var jobs = kue.createQueue({ redis: redisUrl })

var Parse = require("parse/node");
Parse.initialize(process.env.MASTER_KEY);
Parse.serverURL = process.env.SERVER_URL;

// /**
//  * Process the job for ending a round after 24h
// */
// jobs.process('roundExpired', function (job, done) {
//     // Your parse related code and when finished (in save callback for instance):
//        done()
// })
