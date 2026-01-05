import { Map, View } from 'ol';
import { Tile as TileLayer, Image, Group, Vector as VectorLayer } from 'ol/layer';
import { OSM, ImageWMS, Vector as VectorSource } from 'ol/source';
import { fromLonLat } from 'ol/proj';
import { ScaleLine, FullScreen, MousePosition } from 'ol/control';
import LayerSwitcher from 'ol-layerswitcher';
import { createStringXY } from 'ol/coordinate';
import GeoJSON from 'ol/format/GeoJSON';
import { Style, Fill, Stroke } from 'ol/style';
//import { createCustomLayerSwitcher } from './customLayerSwitcher.js';

// helper function for WMS
function createWMSLayer(title, layerName, style = null, visible = false) {
  const layer = new Image({
    source: new ImageWMS({
      url: 'https://www.gis-geoserver.polimi.it/geoserver/gisgeoserver_01/wms',
      params: {
        'LAYERS': `${layerName}`,
        ...(style && { 'STYLES': style })
      },
    }),
    visible
  });
  // Ensure title property is explicitly set for ol-layerswitcher
  layer.set('title', title);
  return layer;
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


fetch(window.DATA_PATHS.geojson)
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
    createWMSLayer('NO₂ Concentration Map 2020', 'gisgeoserver_01:GERMANY_no2_concentration_map_2020'),
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
    createWMSLayer('PM2.5 Bivariate Map 2020', 'gisgeoserver_01:Germany_pm2p5_2020_bivariate' ),
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

[baseMaps, landCover, nox, pm25, pm10].forEach(group => map.addLayer(group));
// Ensure each group and its child layers have titles (required by ol-layerswitcher)
/*function ensureTitles(groups) {
  groups.forEach(group => {
    if (!group.get('title')) group.set('title', 'Group');
    if (group.getLayers) {
      group.getLayers().getArray().forEach((lyr, idx) => {
        if (!lyr.get('title')) {
          lyr.set('title', `Layer ${idx}`);
        }
      });
    }
  });
}

ensureTitles([baseMaps, landCover, nox, pm25, pm10]);*/
// Guard call to optional custom layer switcher if file not provided
if (typeof createCustomLayerSwitcher === 'function') {
  createCustomLayerSwitcher(map);
}
const pollutantGroups = [nox, pm25, pm10, landCover];
// Apply radio behaviour: only one layer per pollutant group visible at a time
enableRadioBehavior(nox);
enableRadioBehavior(pm25);
enableRadioBehavior(pm10);
// And globally among pollutant groups (only one pollutant layer visible across groups)
enableGlobalRadioBehavior(pollutantGroups);

const layerSwitcher = new LayerSwitcher({
  activationMode: 'click',
  startActive: false,
  tipLabel: 'Legenda',
  groupSelectStyle: 'children'

});
map.addControl(layerSwitcher);


// Forza il LayerSwitcher a renderizzare dopo che tutti i layer sono stati aggiunti
/*setTimeout(() => {
  layerSwitcher.renderPanel();
  map.updateSize();

  // Debug: log LayerSwitcher and map/group/layer titles so we can inspect what the switcher should render
  console.log('LayerSwitcher control:', layerSwitcher);
  map.getLayers().getArray().forEach((g, i) => {
    console.log(`Group ${i}:`, g.get('title'));
    console.log('  has getLayers?', typeof g.getLayers === 'function');
    if (g.getLayers) {
      const childLayers = g.getLayers().getArray();
      console.log('  child count:', childLayers.length);
      childLayers.forEach((l, j) => {
        console.log(`    Layer ${j}:`, l.get('title'), 'visible:', l.getVisible(), 'child? ', typeof l.getLayers === 'function');
      });
    }
  });

  // Also log the LayerSwitcher DOM panel HTML to check if child layers are rendered but hidden by CSS
  const panel = document.querySelector('.layer-switcher .panel');
  console.log('LayerSwitcher panel DOM found:', !!panel);
  console.log('LayerSwitcher panel HTML:', panel ? panel.innerHTML : '(no panel element)');

}, 500);*/

// Fallback: if ol-layerswitcher doesn't render child layers, build a simple custom switcher
setTimeout(() => {
  const panel = document.querySelector('.layer-switcher .panel');
  const hasOnlyGroups = panel && panel.querySelectorAll('li.layer').length && !panel.querySelector('li.group');
  if (hasOnlyGroups) {
    console.warn('ol-layerswitcher did not render child layers — building fallback switcher');
    // remove the original ol-layerswitcher control and DOM to avoid duplicate UI
    try {
      const olSwitcherEl = document.querySelector('.layer-switcher');
      if (olSwitcherEl) olSwitcherEl.remove();
    } catch (e) {
      console.warn('Could not remove ol-layerswitcher DOM element', e);
    }
    try { map.removeControl(layerSwitcher); } catch (e) { /* ignore */ }
    const container = document.createElement('div');
    container.className = 'custom-layer-switcher';
    container.style.cssText = 'position:absolute;top:3.5em;right:0.5em;background:#fff;border:1px solid #ddd;padding:8px;border-radius:4px;max-height:60vh;overflow:auto;z-index:3002;';

    const ul = document.createElement('ul');
    ul.style.listStyle = 'none';
    ul.style.margin = '0';
    ul.style.padding = '0';

    map.getLayers().getArray().forEach(group => {
      const liGroup = document.createElement('li');
      liGroup.style.marginBottom = '6px';
      const gTitle = group.get('title') || 'Group';
      const groupLabel = document.createElement('div');
      groupLabel.style.fontWeight = '600';
      groupLabel.textContent = gTitle;
      liGroup.appendChild(groupLabel);

      if (group.getLayers) {
        const children = group.getLayers().getArray();
        const childUl = document.createElement('ul');
        childUl.style.listStyle = 'none';
        childUl.style.paddingLeft = '12px';
        children.forEach((lyr, idx) => {
          const childLi = document.createElement('li');
          childLi.style.margin = '4px 0';
          const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.checked = !!lyr.getVisible();
            cb.id = `custom-switch-${gTitle.replace(/\s+/g,'_')}-${idx}`;
            cb.addEventListener('change', () => {
              // If this group is in pollutantGroups, enforce radio behavior
              const radioTitles = pollutantGroups.map(g => g.get('title'));
              if (radioTitles.includes(gTitle)) {
                // uncheck/disable other layers in this group
                children.forEach((otherL, otherIdx) => {
                  const otherId = `custom-switch-${gTitle.replace(/\s+/g,'_')}-${otherIdx}`;
                  const otherCb = document.getElementById(otherId);
                  if (otherIdx !== idx) {
                    otherL.setVisible(false);
                    if (otherCb) otherCb.checked = false;
                  }
                });
                // set this one according to checkbox
                lyr.setVisible(cb.checked);
              } else {
                lyr.setVisible(cb.checked);
              }
              // update global radio behavior across pollutant groups: if a pollutant layer became visible
              if (lyr.getVisible()) {
                pollutantGroups.forEach(pg => {
                  if (pg !== group) {
                    pg.getLayers().getArray().forEach(otherLayer => {
                      if (otherLayer.getVisible()) otherLayer.setVisible(false);
                    });
                  }
                });
                // also uncheck checkboxes of other pollutant groups
                pollutantGroups.forEach(pg => {
                  const title = pg.get('title');
                  if (title !== gTitle) {
                    pg.getLayers().getArray().forEach((otherLayer, otherIdx) => {
                      const otherId = `custom-switch-${title.replace(/\s+/g,'_')}-${otherIdx}`;
                      const otherCb = document.getElementById(otherId);
                      if (otherCb) otherCb.checked = false;
                    });
                  }
                });
              }
            });
          const lbl = document.createElement('label');
          lbl.htmlFor = cb.id;
          lbl.style.marginLeft = '6px';
          lbl.textContent = lyr.get('title') || `Layer ${idx}`;
          childLi.appendChild(cb);
          childLi.appendChild(lbl);
          childUl.appendChild(childLi);
        });
        liGroup.appendChild(childUl);
      }

      ul.appendChild(liGroup);
    });

    // add a close button
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.textContent = '✕';
    closeBtn.title = 'Close';
    closeBtn.style.cssText = 'position:absolute;top:4px;right:6px;border:none;background:transparent;font-size:14px;cursor:pointer;';
    closeBtn.addEventListener('click', () => {
      container.style.display = 'none';
      // create or show reopen button
      let reopen = document.getElementById('custom-switcher-reopen-btn');
      if (!reopen) {
        reopen = document.createElement('button');
        reopen.id = 'custom-switcher-reopen-btn';
        reopen.textContent = 'Layers';
        reopen.title = 'Show layers';
        reopen.style.cssText = 'position:absolute;top:3.5em;right:0.5em;background:#00087c;color:#fff;border-radius:4px;padding:6px 8px;border:none;cursor:pointer;z-index:2000;';
        document.body.appendChild(reopen);
      } else {
        reopen.style.display = 'block';
      }
    });

    container.appendChild(closeBtn);
    container.appendChild(ul);
    // start closed by default
    container.style.display = 'none';
    document.body.appendChild(container);

    // create reopen button visible by default
    let reopen = document.getElementById('custom-switcher-reopen-btn');
    if (!reopen) {
      reopen = document.createElement('button');
      reopen.id = 'custom-switcher-reopen-btn';
      reopen.textContent = 'Layers';
      reopen.title = 'Show layers';
      reopen.style.cssText = 'position:absolute;top:3.5em;right:0.5em;background:#00087c;color:#fff;border-radius:4px;padding:6px 8px;border:none;cursor:pointer;z-index:2000;';
      document.body.appendChild(reopen);
    } else {
      reopen.style.display = 'block';
    }
    reopen.addEventListener('click', () => {
      container.style.display = 'block';
      reopen.style.display = 'none';
    });
  }
}, 700);


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

// Ensure map resizes properly after initial load
setTimeout(() => {
  map.updateSize();
}, 100);

// Legend for Bivariate Maps
const legendDiv = document.createElement('div');
legendDiv.id = 'bivariate-legend';
legendDiv.style.cssText = `
  position: absolute;
  bottom: 40px;
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
  bottom: 40px;
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
