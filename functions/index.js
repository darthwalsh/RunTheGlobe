const admin = require('firebase-admin');
const functions = require("firebase-functions");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fetch = require("node-fetch");

admin.initializeApp();

const {SecretManagerServiceClient} = require("@google-cloud/secret-manager");
const secretManagerClient = new SecretManagerServiceClient();

const CLIENT_ID = "57923";

const secretVersion = secretManagerClient.accessSecretVersion({
  name: "projects/runtheglobe/secrets/strava-client-secret/versions/latest",
});

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.post("/", async (req, res) => {
  try {
    const token = req.body.token;

    const [accessResponse] = await secretVersion;
    const clientSecret = accessResponse.payload.data.toString("utf8");

    const options = {
      method: "POST",
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: clientSecret,
        code: token,
      }),
      headers: {"Content-Type": "application/json"},
    };

    const proxy = await fetch("https://www.strava.com/oauth/token", options);
    const json = await proxy.json();

    if (json.athlete && json.athlete.id) {
      const fireToken = await admin.auth().createCustomToken(String(json.athlete.id));
      json.fireToken = fireToken;
    }

    res.send(json);
  } catch (e) {
    console.error(e);
    res.status(500).send("Ruh-ro!");
  }
});

exports.stravaToken = functions.https.onRequest(app);
