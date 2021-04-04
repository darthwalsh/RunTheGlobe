"use strict";

const urlQuery = new URLSearchParams(window.location.search);
const DEV_ENV =
  ["localhost", "127.0.0.1", ""].includes(window.location.hostname) && !urlQuery.has("PROD_ENV");
if (DEV_ENV) {
  const favicon = document.querySelector("link[rel~='icon']");
  if (favicon) {
    favicon.href =
      "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2016%2016'%3E%3Ctext%20x='0'%20y='14'%3E🚀%3C/text%3E%3C/svg%3E";
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

async function addGlobalHeatmap(layerControl) {
  const cookieQuery = await getCookieQuery();
  // MAYBE prompt on API request error?
  // TODO cache cookie/tiles(?) on browser/remotely(?)

  const heatmapUrl =
    "https://heatmap-external-{s}.strava.com/tiles-auth/run/bluered/{z}/{x}/{y}.png?" + cookieQuery;

  const layer = L.tileLayer(heatmapUrl, {
    maxNativeZoom: 15,
    maxZoom: 22,
  });
  layerControl.addOverlay(layer.addTo(map), "Global Heatmap");
}

async function addRoutesLayer(layerControl) {
  const routes = await getRoutes();
  const layer = L.layerGroup(routes.map(getRoutePolyline));
  layerControl.addOverlay(layer.addTo(map), "Routes");
}

function getRoutePolyline(route) {
  return L.polyline(L.PolylineUtil.decode(route.map.summary_polyline, 5), {
    color: "DarkViolet",
  }).on("click", e => {
    const div = document.createElement("div");
    const a = create(div, "a", {
      href: `https://www.strava.com/routes/${route.id_str}`,
      target: "_blank",
    });
    a.textContent = route.name;

    map.openPopup(L.popup().setLatLng(e.latlng).setContent(a));
  });
}

function getLazyNotesLayer() {
  const layer = L.geoJSON();
  layer.on("add", fillNotes);
  return layer;
}

async function fillNotes(e) {
  const layer = e.target;
  if (layer.getLayers().length) return;

  const geoJSON = await getNotes();
  layer.addData(geoJSON);

  const icon = new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
  layer.eachLayer(m => m.setIcon(icon));

  layer.on("click", noteOnClick);
}

function noteOnClick(e) {
  const marker = e.sourceTarget;
  const {id} = marker.feature.properties;
  window.open(`https://www.openstreetmap.org/note/${id}`, "_blank");
}

let map;
async function main() {
  map = L.map("mapid");

  const cycleLayer = L.tileLayer(
    "https://{s}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png?apikey={apikey}",
    {
      attribution:
        '&copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      apikey: "0f3c9240e36c48ce9085a96d693d6ab6",
      maxZoom: 22,
    }
  );

  const notesLayer = getLazyNotesLayer();

  // Add defaults layer to map directly
  const baseMaps = {
    "Thunderforest Cycle": cycleLayer.addTo(map),
  };
  const overlayMaps = {
    "OSM Notes": notesLayer,
  };
  const layerControl = L.control.layers(baseMaps, overlayMaps).addTo(map);
  addGlobalHeatmap(layerControl);
  addRoutesLayer(layerControl);

  if (DEV_ENV) {
    map.setView({lon: -122.53, lat: 38.03}, 16);
  } else {
    map.locate({setView: true, maxZoom: 16});
  }

  L.control.scale().addTo(map);
}

async function errorDialog(error) {
  const dialog = create(document.body, "dialog");
  dialog.append("ERROR!");
  const pre = create(dialog, "pre");
  pre.textContent = error;

  const {origin, pathname} = window.location;
  const a = create(dialog, "a", {href: origin + pathname});
  a.textContent = "Go back";

  dialog.showModal();
  await new Promise(() => {
    /* wait forever */
  });
}

if (urlQuery.has("error") || urlQuery.has("code")) {
  mainStravaRedirect();
} else {
  main();
}

// MAYBE add strava as an optional layer, wait to prompt?
