const admin = require("firebase-admin");
const functions = require("firebase-functions/v1");
const express = require("express");
const cors = require("cors");

admin.initializeApp();

const {SecretManagerServiceClient} = require("@google-cloud/secret-manager");
const secretManagerClient = new SecretManagerServiceClient();

const CLIENT_ID = "57923";

let secretVersion;
function getSecret() {
  if (!secretVersion) {
    secretVersion = secretManagerClient.accessSecretVersion({
      name: "projects/runtheglobe/secrets/strava-client-secret/versions/latest",
    });
  }
  return secretVersion;
}

const app = express();
app.use(express.json());
app.use(cors());

app.post("/", async (req, res) => {
  try {
    console.log("Request body", req.body);

    const [accessResponse] = await getSecret();
    const clientSecret = accessResponse.payload.data.toString("utf8");

    const body = {
      client_id: CLIENT_ID,
      client_secret: clientSecret,
    };

    if (req.body.code) {
      console.log("Logging in");
      body.code = req.body.code;
      body.grant_type = "authorization_code";
    } else if (req.body.refresh_token) {
      console.log("Refreshing");
      body.refresh_token = req.body.refresh_token;
      body.grant_type = "refresh_token";
    } else {
      throw ".code or .refresh_token required!";
    }
    const options = {
      method: "POST",
      body: JSON.stringify(body),
      headers: {"Content-Type": "application/json"},
    };

    const proxy = await fetch("https://www.strava.com/oauth/token", options);
    const json = await proxy.json();

    if (req.body.code && json.athlete && json.athlete.id) {
      const fireToken = await admin.auth().createCustomToken(String(json.athlete.id));
      json.fireToken = fireToken;
    }

    res.send(json);
  } catch (e) {
    console.error(e);
    res.status(500).send('"Ruh-ro!"');
  }
});

exports.stravaToken = functions.https.onRequest(app);
