function addOSM(layerControl, name, color, query) {
  // language docs: https://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL
  // By default, ways are a list of nodeID. Instead build a minimal geometry:
  //   `out ids noids;` gives *only* the object type.
  //   `geom` includes {lat, lon} on way nodes
  // Interactive query testing: https://overpass-turbo.eu/

  var layer = new L.OverPassLayer({
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
  addOSM(layerControl, "NoWalk", "red", `(
    (
      nwr[access~"no|private"][foot!~"yes"]({{bbox}});
      nwr[foot~"no|private"]({{bbox}});
      nwr[highway~"motorway|motorway_link|bus_guideway|trunk_link"]({{bbox}});
    );
    - nwr[leisure="swimming_pool"]({{bbox}});
  );`);

  addOSM(layerControl, "CarefulWalk", "goldenrod", `(
    way[sidewalk=no]({{bbox}});
    nwr[amenity=school]({{bbox}});
  );`);

  addOSM(layerControl, "Drinking", "blue", `
    node["amenity"="drinking_water"]({{bbox}});`);
}

// TODO Add FixMe with  "nwr[fixme]({{bbox}});out qt;"

