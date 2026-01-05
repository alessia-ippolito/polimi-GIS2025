import 'ol/ol.css';
import 'ol-layerswitcher/dist/ol-layerswitcher.css';

import { Map, View } from 'ol';
import { Tile as TileLayer, Image, Group, Vector as VectorLayer } from 'ol/layer';
import { OSM, ImageWMS, Vector as VectorSource } from 'ol/source';
import { fromLonLat } from 'ol/proj';
import { ScaleLine, FullScreen, MousePosition } from 'ol/control';
import LayerSwitcher from 'ol-layerswitcher';
import { createStringXY } from 'ol/coordinate';
import GeoJSON from 'ol/format/GeoJSON';
import { Style, Fill, Stroke } from 'ol/style';

// helper function for WMS
function createWMSLayer(title, layerName, style = null, visible = false) {
  return new Image({
    title,
    source: new ImageWMS({
      url: 'https://www.gis-geoserver.polimi.it/geoserver/gisgeoserver_01/wms',
      params: {
        'LAYERS': `${layerName}`,
        ...(style && { 'STYLES': style })
      },
    }),
    visible
  });
}

// Layer base
const osm = new TileLayer({ 
  title: 'OpenStreetMap', 
  type: 'base', 
  visible: true, 
  source: new OSM() 
});

const baseMaps = new Group({ 
  title: 'Base Maps', 
  layers: [osm] 
});

// Land Cover
const landCover = new Group({
  title: 'Land Cover',
  layers: [
    createWMSLayer("LC reclassified 2022", "Germany_LC_reclassified_2022", "LC_style")
  ]
});

// Bivariate NO2 Layer (local because not available on WMS, GeoServer limitation)
const colors = {
  11: "#fffffe", 12: "#ffe8ee", 13: "#ffcbd7", 14: "#ffaec0", 15: "#ff88a6",
  21: "#ddfffd", 22: "#cde6e5", 23: "#c3c6cb", 24: "#bba8b4", 25: "#b08ea6",
  31: "#b9fffc", 32: "#a4dfdd", 33: "#95b6c3", 34: "#8a9cad", 35: "#7d8ba1",
  41: "#7cfdfd", 42: "#64dbdc", 43: "#54b5bd", 44: "#4591a0", 45: "#397e8d",
  51: "#50fffd", 52: "#44d6d4", 53: "#3c9fad", 54: "#32788f", 55: "#2a6682"
};

function no2Style(feature) {
  const classId = feature.get('bivariate');
  
  const fillColor = colors[classId] || '#cccccc';
  
  return new Style({
    fill: new Fill({
      color: fillColor,
      opacity: 0.8
    }),
    stroke: new Stroke({
      color: '#333',
      width: 0.5
    })
  });
}

const no2BivariateLayer = new VectorLayer({
  title: 'NO₂ Bivariate Map 2020',
  source: new VectorSource(),
  style: no2Style,
  visible: false  
});


fetch("../layer/Germany_no2_2020_bivariate.geojson")
  .then(response => {
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(geojsonData => {
   
    const features = new GeoJSON().readFeatures(geojsonData, {
      dataProjection: 'EPSG:4326',  // Proiezione del file GeoJSON
      featureProjection: 'EPSG:3857' // Proiezione della mappa
    });
    
    no2BivariateLayer.getSource().addFeatures(features);
    
    // Zoom sull'extent del layer
    const extent = no2BivariateLayer.getSource().getExtent();

  });


// Pollutant Groups
const nox = new Group({
  title: 'NO₂ (Nitrogen Dioxide)',
  layers: [
    createWMSLayer('NO₂ Concentration Map 2020', 'gisgeoserver_01:GERMANY_no2_concentration_map_2020', 'LC_style'),
    createWMSLayer('NO₂ Average 2022', 'gisgeoserver_01:GERMANY_average_no2_2022'),
    createWMSLayer('NO₂ AAD Map 2017-2021', 'gisgeoserver_01:GERMANY_no2_2017_2021_AAD_map_2022', 'GERMANY_no2_2017_2021_AAD_2022'),
    no2BivariateLayer, // Local layer bivariate NO2
    createWMSLayer('CAMS NO₂ December 2022', 'gisgeoserver_01:GERMANY_CAMS_no2_2022_12')
  ]
});

const pm25 = new Group({
  title: 'PM2.5 (Fine Particulate Matter)',
  layers: [
    createWMSLayer('PM2.5 Concentration 2020', 'gisgeoserver_01:Germany_pm2p5_concentration_2020'),
    createWMSLayer('PM2.5 Average 2022', 'gisgeoserver_01:Germany_average_pm2p5_2022'),
    createWMSLayer('PM2.5 AAD Map 2017-2021', 'gisgeoserver_01:Germany_pm2p5_2017_2021_AAD_map _2022', 'Germany_pm2p5 _2017-2021_AAD_map _2022'),
    createWMSLayer('PM2.5 Bivariate Map 2020', 'gisgeoserver_01:Germany_pm2p5_2020_bivariate'),
    createWMSLayer('CAMS PM2.5 December 2022', 'gisgeoserver_01:Germany_CAMS_pm2p5_2022_12')
  ]
});

const pm10 = new Group({
  title: 'PM10 (Coarse Particulate Matter)',
  layers: [
    createWMSLayer('PM10 Concentration 2020', 'gisgeoserver_01:Germany_pm10_concentration_2020'),
    createWMSLayer('PM10 Average 2022', 'gisgeoserver_01:Germany_average_pm10_2022'),
    createWMSLayer('PM10 AAD Map 2017-2021', 'gisgeoserver_01:Germany_pm10_2017_2021_AAD_map_2022', 'Germany_pm2p5 _2017-2021_AAD_map _2022'),
    createWMSLayer('PM10 Bivariate Map 2020', 'gisgeoserver_01:Germany_pm10_2020_bivariate'),
    createWMSLayer('CAMS PM10 December 2022', 'gisgeoserver_01:Germany_CAMS_pm10_2022_12')
  ]
});

// Map initialization
const map = new Map({
  target: 'map',
  view: new View({ 
    center: fromLonLat([10.4, 51.1]), 
    zoom: 5 
  })
});

// Conntrols 
map.addControl(new ScaleLine());
map.addControl(new FullScreen());
map.addControl(new MousePosition({
  coordinateFormat: createStringXY(4),
  projection: 'EPSG:4326',
  className: 'custom-control',
  placeholder: '0.0000, 0.0000'
}));

const layerSwitcher = new LayerSwitcher({
  activationMode: 'click',
  startActive: false,
  tipLabel: 'Legenda',
  groupSelectStyle: 'none'
});
map.addControl(layerSwitcher);


[baseMaps, landCover, nox, pm25, pm10].forEach(group => map.addLayer(group));

//  radio button for groups
function enableRadioBehavior(group) {
  group.getLayers().forEach(lyr => {
    lyr.on('change:visible', () => {
      if (lyr.getVisible()) {
        group.getLayers().forEach(other => {
          if (other !== lyr && other.getVisible()) {
            other.setVisible(false);
          }
        });
      }
    });
  });
}

// radio global behavior across groups
function enableGlobalRadioBehavior(groups) {
  groups.forEach(group => {
    group.getLayers().forEach(layer => {
      layer.on('change:visible', () => {
        if (layer.getVisible()) {
          groups.forEach(otherGroup => {
            otherGroup.getLayers().forEach(otherLayer => {
              if (otherLayer !== layer && otherLayer.getVisible()) {
                otherLayer.setVisible(false);
              }
            });
          });
        }
      });
    });
  });
}

const pollutantGroups = [nox, pm25, pm10];
pollutantGroups.forEach(enableRadioBehavior);
enableGlobalRadioBehavior(pollutantGroups);

// Ensure map resizes properly after initial load
setTimeout(() => {
  map.updateSize();
}, 100);

// Legend for Bivariate Maps
const legendDiv = document.createElement('div');
legendDiv.id = 'bivariate-legend';
legendDiv.style.cssText = `
  position: absolute;
  bottom: 30px;
  left: 10px;
  background: white;
  padding: 10px;
  border-radius: 5px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  display: none;
  z-index: 1000;
`;

legendDiv.innerHTML = `
  <h4 style="margin: 0 0 10px 0; font-size: 14px;">Bivariate Legend</h4>
  <img src="../images/pm2p5_images/legend_bivariate_5x5.png" alt="Legend" style="max-width: 200px; display: block;" />
`;

document.body.appendChild(legendDiv);

function updateBivariateLegend() {
  const legend = document.getElementById('bivariate-legend');
  const isAnyVisible = no2BivariateLayer.getVisible() || 
                       pm25BivariateLayer.getVisible() || 
                       pm10BivariateLayer.getVisible();
  legend.style.display = isAnyVisible ? 'block' : 'none';
}

no2BivariateLayer.on('change:visible', function() {
  updateBivariateLegend();
});
const pm25BivariateLayer = pm25.getLayers().getArray()[3];

pm25BivariateLayer.on('change:visible', function() {
  updateBivariateLegend();
});

const pm10BivariateLayer = pm10.getLayers().getArray()[3];

pm10BivariateLayer.on('change:visible', function() {
  updateBivariateLegend();
});

// Legend for AAD Maps
const aadLegendDiv = document.createElement('div');
aadLegendDiv.id = 'aad-legend';
aadLegendDiv.style.cssText = `
  position: absolute;
  bottom: 30px;
  left: 10px;
  background: white;
  padding: 10px;
  border-radius: 5px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  display: none;
  z-index: 1000;
`;

aadLegendDiv.innerHTML = `
  <h4 style="margin: 0 0 10px 0; font-size: 14px;">AAD 2017-2021 Legend</h4>
  <img id="aad-legend-img" src="" alt="AAD Legend" style="max-width: 200px; display: block;" />
`;

document.body.appendChild(aadLegendDiv);

const no2AadLayer = nox.getLayers().getArray()[2];
const pm25AadLayer = pm25.getLayers().getArray()[2];
const pm10AadLayer = pm10.getLayers().getArray()[2];

function updateAadLegend() {
  const legend = document.getElementById('aad-legend');
  const legendImg = document.getElementById('aad-legend-img');
  
  if (no2AadLayer.getVisible()) {
    legendImg.src = '../images/legend_no2.jpg';
    legend.style.display = 'block';
  } else if (pm25AadLayer.getVisible()) {
    legendImg.src = '../images/legend_pm25.jpg';
    legend.style.display = 'block';
  } else if (pm10AadLayer.getVisible()) {
    legendImg.src = '../images/legend_pm10.jpg';
    legend.style.display = 'block';
  } else {
    legend.style.display = 'none';
  }
}

no2AadLayer.on('change:visible', function() {
  updateAadLegend();
});

pm25AadLayer.on('change:visible', function() {
  updateAadLegend();
});

pm10AadLayer.on('change:visible', function() {
  updateAadLegend();
});