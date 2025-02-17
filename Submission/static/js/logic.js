// Create the 'basemap' tile layer that will be the background of our map.
// Step 1: CREATE THE BASE LAYERS
let street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
})

let topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
});

let satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
  attribution: '&copy; <a href="https://www.esri.com/en-us/arcgis/about-arcgis/overview">Esri</a>, Maxar, Earthstar Geographics, and the GIS community'
});

// Function determines color of the marker
function getColor(depth) {
  let color = "#98ee00";

  // If statement
  if (depth > 90) {
    color = "#ea2c2c";
  } else if (depth > 70) {
     color = "#ea822c";
  } else if (depth > 50) {
    color = "#ee9c00";
  } else if (depth > 30) {
    color = "#eecc00";
  } else if (depth > 10) {
    color = "#d4ee00";
  } else {
    color = "#98ee00";
  }

  return color;
}

//Helper function for radius
function getRadius(mag) {
  return mag * 4;
  }

let queryUrl = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson';
let platesUrl = 'https://raw.githubusercontent.com/fraxen/tectonicplates/refs/heads/master/GeoJSON/PB2002_boundaries.json';
d3.json(queryUrl).then(function (data) {
  d3.json(platesUrl).then(function(plate_data) {


  
  // Step 2: CREATE THE DATA/OVERLAY LAYERS
  console.log(data);

  // Loop through earthquakes
  let markers = []; 
  let heatArray = []; 
  for (let i = 0; i < data.features.length; i++) {
    let row =  data.features[i];
    let location = row.geometry.coordinates;
    if (location) {
      let latitude = location[1];
      let longitude = location[0];
      let depth = location[2];
      let mag = row.properties.mag;
      
      // Create marker
      let marker = L.circleMarker([latitude, longitude], {
        fillOpacity: 0.75,
        color: "grey",
        fillColor: getColor(depth),
        radius: getRadius(mag)
      }).bindPopup(`<h2>${row.properties.title}</h2><hr><h3>Depth: ${depth}m</h3>`);

      markers.push(marker);

      // Heatmap point
      heatArray.push([latitude, longitude]);
    }
  }
    
  // Create the Layer Groups
  let markerLayer = L.layerGroup(markers);

  // Create Heatmap Layer
  let heatLayer = L.heatLayer(heatArray, {
    radius: 50,
    blur: 5
  });

  // Create Tectonic Plate Layer
  let geoLayer = L.geoJson(plate_data, {
    //Static style object
    style: {
      color: "orange",
      weight: 3
      }
  });
  
  // Step 3: CREATE THE LAYER CONTROL
  let baseMaps = {
    Street: street,
    Topography: topo,
    Satellite: satellite
  };

  let overlayMaps = {
    Earthquakes: markerLayer,
    "Tectonic Plates": geoLayer,
    Heatmap: heatLayer
  };


  // Step 4: INITIALIZE THE MAP
  let myMap = L.map("map", {
    center: [30.7, -80.5],
    zoom: 3,
    layers: [street, markerLayer, geoLayer]
  });

  // Step 5: Add the Layer Control, Legend, Annotations as needed
  L.control.layers(baseMaps, overlayMaps).addTo(myMap);

  // Create a legend control object.
  let legend = L.control({
    position: "bottomright"
  });

  // Then add all the details for the legend
  legend.onAdd = function () {
    let div = L.DomUtil.create("div", "info legend");

    let legendInfo = `<h4>Earthquake Depth</h4>
    <i style="background:#98ee00"></i>-10-10<br>
    <i style="background:#d4ee00"></i>10-30<br>
    <i style="background:#eecc00"></i>30-50<br>
    <i style="background:#ee9c00"></i>50-70<br>
    <i style="background:#ea822c"></i>70-90<br>
    <i style="background:#ea2c2c"></i>90+`;

    div.innerHTML = legendInfo;
  
    return div;
  };
  
  // Add the legend to the map
  legend.addTo(myMap);

  });
});
