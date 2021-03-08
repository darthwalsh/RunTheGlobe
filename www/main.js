"use strict";

const STRAVA_CLIENT_ID = 57923;

const urlQuery = new URLSearchParams(window.location.search);
const DEV_ENV = ["localhost", "127.0.0.1", ""].includes(window.location.hostname) && !urlQuery.has("PROD_ENV");
if (DEV_ENV) {
  const favicon = document.querySelector("link[rel~='icon']");
  if (favicon) {
    favicon.href = "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2016%2016'%3E%3Ctext%20x='0'%20y='14'%3E🚀%3C/text%3E%3C/svg%3E";
  }
}

function $(id) {
  return document.getElementById(id);
}
/**
 * @param {HTMLElement | string} parent
 * @param {string} name
 * @param {Object.<string, string>} attributes
 */
function create(parent, name, attributes = {}) {
  const node = document.createElement(name);
  if (typeof parent === "string") {
    $(parent).appendChild(node);
  } else {
    parent.appendChild(node);
  }
  for (const prop in attributes) {
    node.setAttribute(prop, attributes[prop]);
  }
  return node;
}

const accessTokenKey = "STRAVA_ACCESS_TOKEN_KEY";
async function getStravaToken() {
  let stored = localStorage.getItem(accessTokenKey);
  if (!stored) {
    const dialog = create(document.body, "dialog");
    dialog.append("Sign in needed! We'll use this account to load your activities, and sync your data");
    create(dialog, "br");

    const query = new URLSearchParams({
      client_id: STRAVA_CLIENT_ID,
      redirect_uri: window.location.href,
      response_type: "code",
      scope: "activity:read"
    })
    const url = 'https://www.strava.com/oauth/authorize?' + query;
    const a = create(
      dialog,
      "a",
      {href: url}
    );
    a.textContent = "Sign in at strava.com";
    dialog.showModal();
    await new Promise(() => { /* wait forever */ });
  }
  return stored;
}

const cookieKey = "STRAVA_COOKIE_KEY";
function getStoredCookie() {
  let stored = localStorage.getItem(cookieKey);
  if (!stored) return;

  const [last, cookie, extra] = stored.split(":");
  if (!last || !cookie || !Number(last) || extra) return;

  const lastweek = Date.now() - 7 * 24 * 60 * 60 * 1000;
  if (Number(last) < lastweek) return;

  return cookie;
}

// TODO need an account delete function for firebase strava data
async function getCookieQuery() {
  let cookieQuery = getStoredCookie();
  if (!cookieQuery) {
    /** @type {HTMLDialogElement} */
    const dialog = create(document.body, "dialog");
    dialog.append("Go to ");
    const a = create(
      dialog,
      "a",
      {href: "https://www.strava.com/heatmap", target: "_blank"}
    );
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

    localStorage.setItem(cookieKey, `${Date.now()}:${cookieQuery}`);
  }
  return cookieQuery;
}

async function addGlobal() {
  const cookieQuery = await getCookieQuery();
  // MAYBE prompt on API request error?
  // TODO cache cookie/tiles(?) on browser/remotely(?)

  const heatmapUrl =
    "https://heatmap-external-{s}.strava.com/tiles-auth/run/bluered/{z}/{x}/{y}.png?" + cookieQuery;

  return L.tileLayer(heatmapUrl, {
    maxNativeZoom: 15,
    maxZoom: 22,
  });
}

async function main() {
  const map = L.map("mapid");

  L.tileLayer("https://{s}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png?apikey={apikey}", {
    attribution:
      '&copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    apikey: "0f3c9240e36c48ce9085a96d693d6ab6",
    maxZoom: 22,
  }).addTo(map);

  if (DEV_ENV) {
    map.setView({lon: -122.53, lat: 38.03}, 16);
  } else {
    map.locate({setView: true, maxZoom: 16});
  }

  L.control.scale().addTo(map);

  await getStravaToken();

  const strava = await addGlobal();
  strava.addTo(map);
}

async function mainStravaRedirect() {
  let error = urlQuery.get("error");
  if (!error && !urlQuery.get("scope").includes("activity:read")) {
    error = "Permission to read activities needed!"
  }

  if (error) {
    const dialog = create(document.body, "dialog");
    dialog.append("ERROR!");
    const pre = create(dialog, "pre");
    pre.textContent = error;

    const {origin, pathname} = window.location;
    const a = create(
      dialog,
      "a",
      {href: origin + pathname}
    );
    a.textContent = "Go back";

    dialog.showModal();
    await new Promise(() => { /* wait forever */ });
  }
  const code = urlQuery.get("code");
  
  alert("TODO token exchange not done: " + code); 

  //main();
}

if (urlQuery.has("error") || urlQuery.has("code")) {
  mainStravaRedirect();
} else {
  main();
}

// MAYBE add strava as an optional layer, wait to prompt?
