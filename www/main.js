"use strict";

function $(id) {
  return document.getElementById(id);
}
/**
 * @param {HTMLElement} parent
 * @param {string} name
 * @param {Object.<string, string>} attributes
 */
function create(parent, name, attributes = {}) {
  const node = document.createElement(name);
  parent.appendChild(node);
  for (const prop in attributes) {
    node.setAttribute(prop, attributes[prop]);
  }
  return node;
}

const map = L.map("mapid");

L.tileLayer("https://{s}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png?apikey={apikey}", {
  attribution:
    '&copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  apikey: "0f3c9240e36c48ce9085a96d693d6ab6",
  maxZoom: 22,
}).addTo(map);

map.locate({setView: true, maxZoom: 16});

L.control.scale().addTo(map);

const cookies = "?Key-Pair-Id=TODO&Policy=TODO&Signature=TODO";
// TODO prompt for this and store in localstorage, reprompt after 24 hours; v2 prompt on error

const heatmapUrl =
  "https://heatmap-external-{s}.strava.com/tiles-auth/run/bluered/{z}/{x}/{y}.png" +
  cookies;

const strava = L.tileLayer(heatmapUrl, {
  maxNativeZoom: 15,
  maxZoom: 22,
});
strava.addTo(map);

// L.control.layers(null, {strava}).addTo(map);
