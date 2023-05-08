"use strict";

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

const map = L.map("mapid");

L.tileLayer("https://{s}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png?apikey={apikey}", {
  attribution:
    '&copy; <a href="https://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  apikey: "0f3c9240e36c48ce9085a96d693d6ab6",
  maxZoom: 22,
}).addTo(map);

map.locate({setView: true, maxZoom: 16});

L.control.scale().addTo(map);

async function addGlobal() {
  const cookieQuery = await getCookieQuery();
  // MAYBE prompt on API request error?
  // MAYBE cache cookie/tiles(?) on browser/remotely(?)

  const heatmapUrl =
    "https://heatmap-external-{s}.strava.com/tiles-auth/run/bluered/{z}/{x}/{y}.png?" + cookieQuery;

  const strava = L.tileLayer(heatmapUrl, {
    maxNativeZoom: 15,
    maxZoom: 22,
  });
  strava.addTo(map);
}
addGlobal();
// MAYBE add strava as an optional layer, wait to prompt?
