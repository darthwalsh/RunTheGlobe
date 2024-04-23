function addOSM(layerControl, name, color, query) {
  // language docs: https://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL
  // By default, ways are a list of nodeID. Instead build a minimal geometry:
  //   `out ids noids;` gives *only* the object type.
  //   `geom` includes {lat, lon} on way nodes
  // Interactive query testing: https://overpass-turbo.eu/

  const layer = new L.OverPassLayer({
    query: `${query} out ids noids geom;`,
    onSuccess: function (data) {
      for (const e of data.elements) {
        switch (e.type) {
          case "node":
            this._markers.addLayer(
              L.circle(e, {
                radius: 4,
                weight: 10,
                color,
                fillOpacity: 0.5,
              })
            );
            this._markers.addLayer(
              L.circle(e, {
                radius: 4,
                weight: 4,
                color: "white",
                dashArray: "6",
                fillOpacity: 0,
              })
            );
            break;
          case "way":
            this._markers.addLayer(
              L.polyline(e.geometry, {
                weight: 7,
                color,
                fillOpacity: 0.5,
              })
            );
            this._markers.addLayer(
              L.polyline(e.geometry, {
                weight: 4,
                color: "white",
                dashArray: "6",
                fillOpacity: 0,
              })
            );
            break;
          case "relation":
            break;
          default:
            console.warn("Overpass unexpected type!", e.type);
        }
      }
    },
  });

  layerControl.addOverlay(layer.addTo(map), name);
}

function addOSMlayers(layerControl) {
  addOSM(
    layerControl,
    "NoWalk",
    "red",
    `(
    (
      nwr[access~"no|private"][foot!~"yes|designated|permissive"]({{bbox}});
      nwr[foot~"no|private"]({{bbox}});
      nwr[highway~"motorway|motorway_link|bus_guideway|trunk_link"]({{bbox}});
    );
    - nwr[leisure="swimming_pool"]({{bbox}});
  );`
  );

  addOSM(
    layerControl,
    "CarefulWalk",
    "goldenrod",
    `(
    way[sidewalk=no]({{bbox}});
    nwr[amenity=school]({{bbox}});
  );`
  );

  addOSM(
    layerControl,
    "Drinking",
    "blue",
    `
    node["amenity"="drinking_water"]({{bbox}});`
  );

  // TODO make this layer lazy. Maybe have a couple global functions using some global reference to layerControl: addOverlay vs addOverlayLazy
  addOSM(
    layerControl,
    "NamedRunnable",
    "cyan",
    `
    way['name']
      ['highway']
      ['highway' !~ 'bridleway']
      ['highway' !~ 'bus_guideway']
      ['highway' !~ 'bus_stop']
      ['highway' !~ 'busway']
      ['highway' !~ 'construction']
      ['highway' !~ 'corridor']
      ['highway' !~ 'cycleway']
      ['highway' !~ 'elevator']
      ['highway' !~ 'escape']
      ['highway' !~ 'footway']
      ['highway' !~ 'motorway']
      ['highway' !~ 'motorway_junction']
      ['highway' !~ 'motorway_link']
      ['highway' !~ 'path']
      ['highway' !~ 'platform']
      ['highway' !~ 'proposed']
      ['highway' !~ 'raceway']
      ['highway' !~ 'razed']
      ['highway' !~ 'rest_area']
      ['highway' !~ 'services']
      ['highway' !~ 'steps']
      ['highway' !~ 'trunk']
      ['access' !~ 'customers']
      ['access' !~ 'no']
      ['access' !~ 'private']
      ['aeroway' !~ 'jet_bridge']
      ['amenity' !~ 'weighbridge']
      ['expressway' !~ 'yes']
      ['fee' !~ 'yes']
      ['foot' !~ 'no']
      ['indoor' !~ 'area']
      ['indoor' !~ 'column']
      ['indoor' !~ 'corridor']
      ['indoor' !~ 'door']
      ['indoor' !~ 'level']
      ['indoor' !~ 'room']
      ['indoor' !~ 'wall']
      ['indoor' !~ 'yes']
      ['public_transport' !~ 'platform']
      ['razed' !~ 'highway']
      ['service' !~ 'drive-through']
      ['service' !~ 'driveway']
      ['service' !~ 'parking_aisle']
      ['toll' !~ 'yes']
      ({{bbox}});`
  );

  addFIXMElayers(layerControl);
}

async function addFIXMElayers(layerControl) {
  const name = "MyFIXME";
  const username = await getOSMusername();
  // Only returns nodes that most-recently were edited by me:
  //   https://gis.stackexchange.com/a/160521/173754
  const query = `
    nwr(user:"${username}")[fixme]({{bbox}});
    out tags geom;`;

  const layer = new L.OverPassLayer({
    query,
    onSuccess: function (data) {
      for (const e of data.elements) {
        const {fixme} = e.tags;
        const color = fixme.startsWith("continue") ? "grey" : "black"; // continues, continued...

        let point = null;
        switch (e.type) {
          case "node":
            point = e;
            this._markers.addLayer(
              L.circle(e, {
                radius: 4,
                weight: 10,
                color,
                fillOpacity: 0.5,
              })
            );
            break;
          case "way":
            point = e.geometry[Math.floor(e.geometry.length / 2)];
            this._markers.addLayer(
              L.polyline(e.geometry, {
                weight: 7,
                color,
                fillOpacity: 0.5,
              })
            );
            break;
          case "relation":
            // MAYBE include this but it's complicated and not very useful
            // Would need to to average "bounds": { "minlat": 38.0639337, ...
            // Can't query center (conflicts with geom), but that would probably be right here
            break;
          default:
            console.warn("Overpass unexpected type!", e.type);
        }
        if (!point || !fixme) continue;

        const marker = makeMarker(e, point, fixme, color);
        this._markers.addLayer(marker);
      }
    },
  });

  layerControl.addOverlay(layer.addTo(map), name);
}

function makeMarker(e, point, fixme, color) {
  const icon = makeIcon(color);
  const {id, type} = e;
  return L.marker(point, {icon}).on("click", _ => {
    const div = document.createElement("div");
    const a = create(div, "a", {
      href: `https://www.openstreetmap.org/${type}/${id}`,
      target: "_blank",
    });
    a.textContent = "Open OpenStreetMap";

    const fixmeP = create(div, "p");
    fixmeP.textContent = 'FIXME!';

    const fixP = create(div, "p");
    fixP.textContent = fixme;

    map.openPopup(L.popup().setLatLng(point).setContent(div));
  });
}

