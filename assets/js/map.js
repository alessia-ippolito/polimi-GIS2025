import 'ol/ol.css';
import 'ol-layerswitcher/dist/ol-layerswitcher.css';

import { Map, View } from 'ol';
import { Tile, Image, Group } from 'ol/layer';
import { OSM, ImageWMS } from 'ol/source';
import { fromLonLat } from 'ol/proj';
import { ScaleLine, FullScreen, MousePosition } from 'ol/control';
import LayerSwitcher from 'ol-layerswitcher';
import { createStringXY } from 'ol/coordinate';

// Funzione helper
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
const osm = new Tile({ title: 'OpenStreetMap', type: 'base', visible: true, source: new OSM() });

const baseMaps = new Group({ title: 'Base Maps', layers: [osm] });

// Gruppi ordinati
const landCover = new Group({
  title: 'Land Cover',
  layers: [ createWMSLayer("LC reclassified 2022", "Germany_LC_reclassified_2022", "LC_style") ]
});

const nox = new Group({
  title: 'NO₂ (Nitrogen Dioxide)',
  layers: [
    createWMSLayer('NO₂ Concentration Map 2020', 'gisgeoserver_01:GERMANY_no2_concentration_map_2020', 'LC_style'),
    createWMSLayer('NO₂ Average 2022', 'gisgeoserver_01:GERMANY_average_no2_2022'),
    createWMSLayer('NO₂ AAD Map 2017-2021', 'gisgeoserver_01:GERMANY_no2_2017_2021_AAD_map_2022', 'GERMANY_no2_2017_2021_AAD_2022'),
    createWMSLayer('NO₂ Bivariate Map 2020', 'gisgeoserver_01:GERMANY_no2_2020_bivariate'),
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

// Mappa
const map = new Map({
  target: 'map',
  view: new View({ center: fromLonLat([10.4, 51.1]), zoom: 5 })
});

// Ensure OpenLayers recalculates size after layout/CSS is applied
// This fixes gaps when the map was initialized before the container reached full size.
function logMapBounds(note = '') {
  try {
    const el = document.getElementById('map');
    const rect = el ? el.getBoundingClientRect() : null;
    console.log('MAP DEBUG', note, {
      mapElementRect: rect,
      docClient: { w: document.documentElement.clientWidth, h: document.documentElement.clientHeight },
      mapSize_ol: map.getSize(),
      mapViewport: map.getViewport ? map.getViewport().getBoundingClientRect() : null
    });
  } catch (e) {
    console.warn('MAP DEBUG: logging failed', e);
  }
}


// Controlli
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
  groupSelectStyle: 'none'  // no checkbox at group level
});
map.addControl(layerSwitcher);

// add layers to map
[baseMaps, landCover, nox, pm25, pm10].forEach(group => map.addLayer(group));

// Funzione per simulare radio-button per gruppo
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
const pollutantGroups = [nox, pm25, pm10];

// Abilita il comportamento "radio" solo per i gruppi desiderati
[nox, pm25, pm10].forEach(enableRadioBehavior);
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

enableGlobalRadioBehavior(pollutantGroups);
