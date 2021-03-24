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
async function getStravaToken() {
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

async function getUserDoc() {
  const token = await getStravaToken();
  return firestore.collection("users").doc(token.firebaseUser);
}

async function getActivities() {
  const userDoc = await getUserDoc();
  const userSnapshot = await userDoc.get();
  return []; // TODO need to load from strava -> firestore!
}

async function getStoredCookie() {
  const userDoc = await getUserDoc();
  const userSnapshot = await userDoc.get();
  if (!userSnapshot.exists) return;
  const data = userSnapshot.data();
  if (!data.stravaCookie) return;

  const [last, cookie, extra] = data.stravaCookie.split(":");
  if (!last || !cookie || !Number(last) || extra) return;

  const lastweek = Date.now() - 7 * 24 * 60 * 60 * 1000;
  if (Number(last) < lastweek) return;

  return cookie;
}

// TODO need an account delete function for firebase strava data
async function getCookieQuery() {
  let cookieQuery = await getStoredCookie();
  if (!cookieQuery) {
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

    const promise = new Promise(res => {
      button.onclick = _ => {
        dialog.close();
        res(input.value);
      };
    });

    dialog.showModal();
    /** @type {string} */
    const cookie = await promise;

    const withoutColon = cookie.split(": ").pop();

    const prefix = "CloudFront-";
    cookieQuery = withoutColon
      .split("; ")
      .filter(s => s.startsWith(prefix))
      .map(s => s.substr(prefix.length))
      .join("&");
      
    const userDoc = await getUserDoc();
    userDoc.update({stravaCookie: `${Date.now()}:${cookieQuery}`});
  }
  return cookieQuery;
}

async function tokenExchange(code) {
  const options = {
    method: "POST",
    body: JSON.stringify({
      token: code,
    }),
    headers: {"Content-Type": "application/json"},
  };

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

  const oauth = await tokenExchange(code);

  if (oauth.errors) throw errorDialog(oauth.message);

  if (!oauth.fireToken) throw errorDialog("Google sign-in didn't work");

  const firebaseUser = await firebase.auth().signInWithCustomToken(oauth.fireToken);
  delete oauth.fireToken;
  oauth.firebaseUser = firebaseUser.user.uid;

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
