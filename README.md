Air Quality Mapping: Land Cover Correlation and Population Exposure

## Project Overview

This project harnesses free and open geospatial data from the Copernicus programme to study historical trends of air pollutants in relation to environmental variables and evaluate exceedance above recommended health guidelines in Germany.

**Academic Year:** 2024/25  
**Institution:** Politecnico di Milano  
**Course:** Geographic Information Systems 

## Features

- **Interactive Pollutant Analysis**: Comprehensive analysis of NO₂, PM2.5, and PM10 concentrations
- **Bivariate Mapping**: Correlation analysis between pollution levels and population density
- **Temporal Analysis**: Time series analysis with temporal slider controls (2013-2022)
- **Population Exposure Assessment**: Evaluation against EU and WHO health guidelines
- **Interactive WebGIS**: Dynamic visualization with layer switching and transparency controls

## Technical Stack

- **Frontend**: HTML5, CSS3, JavaScript
- **Mapping Library**: OpenLayers v8.2.0
- **Web Map Server**: GeoServer
- **Data Processing**: QGIS
- **Styling Framework**: Custom CSS with responsive design
- **Chart Generation**: DataPlotly

## Project Structure

```
├── index.html                 # Main landing page
├── public/                    # Built or served static site
│   ├── pages/                 # Individual pollutant analysis pages
|   |   ├── webgis/            # Interactive WebGIS application (entry: index.html)
│   │   ├── no2.html           # Nitrogen Dioxide analysis
│   │   ├── pm25.html          # PM2.5 analysis
│   │   └── pm10.html          # PM10 analysis
│   ├── layer/                 # GeoJSON and vector layers (served)
│   |── data/                  # Data and assets served with the site
|   └── images/                # Images and visualizations
├── assets/                    # Source static assets
│   ├── css/                   # Stylesheets (custom + vendor overrides)
│   ├── js/                    # JavaScript modules
└── README.md
```
## Data Sources

- **Air Quality Data**: Copernicus Atmosphere Monitoring Service (CAMS)
- **Land Cover Data**: ESA Climate Change Initiative (CCI)
- **Population Data**: WorldPop
- **Study Period**: 2013-2022
- **Study Area**: Germany

## Methodology

1. **Data Acquisition**: Downloaded CAMS NetCDF files, ESA CCI land cover maps, and WorldPop population data
2. **Temporal Aggregation**: Processed hourly data to monthly and annual averages using QGIS
3. **Spatial Analysis**: Conducted zonal statistics, land cover reclassification, and bivariate mapping
4. **Population Exposure Assessment**: Evaluated exposure against health guidelines
5. **Trend Analysis**: Analyzed time series data for long-term trends
6. **Visualization**: Created interactive maps and charts for effective communication

## License

© 2025 GIS Lab Project. All rights reserved.

**Template**: [HTML5 UP](http://html5up.net)  
**Data**: [Copernicus CAMS](https://atmosphere.copernicus.eu/)

## Acknowledgments

- Politecnico di Milano - Geographic Information Systems Lab
- Copernicus Programme for providing open geospatial data
- HTML5 UP for the website template
- OpenLayers community for the mapping framework


