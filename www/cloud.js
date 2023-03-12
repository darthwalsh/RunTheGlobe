"use strict";

const STRAVA_CLIENT_ID = 57923;
const TOKEN_EXCHANGE_URL = "https://us-central1-runtheglobe.cloudfunctions.net/stravaToken";

const firebaseConfig = {
  apiKey: "AIzaSyB9o6sZw4ptiRAn7oZaxZAaV4QBW7frvcA",
  projectId: "runtheglobe",
};
firebase.initializeApp(firebaseConfig);
const firestore = firebase.firestore();

const oAuthTokenKey = "STRAVA_OAUTH_TOKEN_KEY";
async function getStravaDetails() {
  let stored = localStorage.getItem(oAuthTokenKey);
  if (!stored) {
    const dialog = create(document.body, "dialog");
    dialog.append(
      "Sign in needed! We'll use this account to load your activities, and sync your data"
    );
    create(dialog, "br");

    const query = new URLSearchParams({
      client_id: STRAVA_CLIENT_ID,
      redirect_uri: window.location.href,
      response_type: "code",
      scope: "activity:read",
    });
    const url = "https://www.strava.com/oauth/authorize?" + query;
    const a = create(dialog, "a", {href: url});
    a.textContent = "Sign in at strava.com";
    dialog.showModal();
    await new Promise(() => {
      /* wait forever */
    });
  }
  return JSON.parse(stored);
}

async function getStravaAccessToken() {
  const {access_token, expires_at, refresh_token, athlete} = await getStravaDetails();

  const fifteenBefore = new Date((expires_at - 15 * 60) * 1000);
  if (new Date() < fifteenBefore) return access_token;

  console.log("Refreshing access token...");
  const oauth = await tokenExchange({refresh_token});
  if (oauth.errors) {
    localStorage.removeItem(oAuthTokenKey);
    throw errorDialog(oauth.message);
  }
  oauth.athlete = athlete; // not returned on refresh
  localStorage.setItem(oAuthTokenKey, JSON.stringify(oauth));
  return oauth.access_token;
}

async function getUserDoc() {
  const details = await getStravaDetails();
  return firestore.collection("users").doc(String(details.athlete.id));
}

async function getActivities() {
  const userDoc = await getUserDoc();
  const userSnapshot = await userDoc.get();
  return []; // TODO need to load from strava -> firestore!
}

async function getRoutes() {
  const token = await getStravaAccessToken();
  const routes = [];

  for (let page = 1; ; page++) {
    const per_page = 30;
    const query = new URLSearchParams({
      page,
      per_page,
    });
    const url = "https://www.strava.com/api/v3/athlete/routes?" + query;

    console.log("Fetching routes from strava API. Page", page);
    const req = await fetch(url, {
      headers: {"Authorization": `Bearer ${token}`},
    });
    const res = await req.json();
    routes.push(...res);
    if (res.length < per_page) {
      break;
    }
  }
  return routes;
}

async function getOSMusername() {
  return "carlwalsh"; //TODO user can set in a config dialog, persist to firestore
}

async function getNotes() {
  const display_name = await getOSMusername();
  const query = new URLSearchParams({
    closed: 0,
    display_name,
  });
  const url = "https://api.openstreetmap.org/api/0.6/notes/search.json?" + query;
  console.log("Fetching notes from OSM API...");
  const req = await fetch(url);
  return await req.json();
}

/** @returns {Promise<string|void>} */
async function getStoredCookie() {
  const userDoc = await getUserDoc();
  const userSnapshot = await userDoc.get();
  if (!userSnapshot.exists) return;
  const data = userSnapshot.data();
  if (!data.stravaCookie) return;

  const [last, cookie, extra] = data.stravaCookie.split(":");
  if (!last || !cookie || !Number(last) || extra) return;

  const lastWeek = Date.now() - 7 * 24 * 60 * 60 * 1000;
  if (Number(last) < lastWeek) return;

  return cookie;
}

// TODO need an account delete function for firebase strava data
/** @returns {Promise<string|void>} */
async function getCookieQuery() {
  let cookieQuery = await getStoredCookie();
  if (cookieQuery) return cookieQuery;

  /** @type {HTMLDialogElement} */
  const dialog = create(document.body, "dialog");
  dialog.append("Go to ");
  const a = create(dialog, "a", {href: "https://www.strava.com/heatmap", target: "_blank"});
  a.textContent = "strava.com/heatmap";
  dialog.append(
    ", open browser devtools, capture a PNG network request, find Cookie request header, paste below:"
  );
  create(dialog, "br");

  /** @type {HTMLInputElement} */
  const input = create(dialog, "input");
  input.placeholder = "ajs_user_id=...";

  const button = create(dialog, "button");
  button.textContent = "Submit";
  const cancelButton = create(dialog, "button");
  cancelButton.textContent = "Cancel";

  const promise = new Promise(res => {
    button.onclick = _ => {
      dialog.close();
      res(input.value);
    };
    cancelButton.onclick = _ => {
      dialog.close();
      res('');
    };
  });

  dialog.showModal();
  /** @type {string} */
  const cookie = await promise;
  if (!cookie) return;

  const withoutColon = cookie.split(": ").pop();

  const prefix = "CloudFront-";
  cookieQuery = withoutColon
    .split("; ")
    .filter(s => s.startsWith(prefix))
    .map(s => s.substr(prefix.length))
    .join("&");

  const userDoc = await getUserDoc();
  userDoc.update({stravaCookie: `${Date.now()}:${cookieQuery}`});
  return cookieQuery;
}

async function tokenExchange(body) {
  const options = {
    method: "POST",
    body: JSON.stringify(body),
    headers: {"Content-Type": "application/json"},
  };

  console.log("Exchanging Strava auth token...");
  const proxy = await fetch(TOKEN_EXCHANGE_URL, options);
  return await proxy.json();
}

async function mainStravaRedirect() {
  const error = urlQuery.get("error");
  if (error) throw errorDialog(error);

  if (!urlQuery.get("scope").includes("activity:read")) {
    throw errorDialog("Permission to read activities needed!");
  }

  const code = urlQuery.get("code");

  console.log("Getting initial token...");
  const oauth = await tokenExchange({code});

  if (oauth.errors) throw errorDialog(oauth.message);

  if (!oauth.fireToken) throw errorDialog("Google sign-in didn't work");

  await firebase.auth().signInWithCustomToken(oauth.fireToken);
  delete oauth.fireToken;
  localStorage.setItem(oAuthTokenKey, JSON.stringify(oauth));

  const userDoc = await getUserDoc();
  const userSnapshot = await userDoc.get();
  if (!userSnapshot.exists) {
    userDoc.set({
      athlete: oauth.athlete, // .athlete contains location/weight which shouldn't be public
    });
  }

  // TODO need a sign-out button, request to /deauthorize -- ALSO firebase sign-out?
  alert("to log out of strava run devtools: localStorage.setItem(oAuthTokenKey)");
  window.history.pushState(null, "", location.href.split("?")[0]);

  main();
}
