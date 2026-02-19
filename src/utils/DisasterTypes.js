import droughtIcon from "@iconify-icons/mdi/water-off-outline";
import dustHazeIcon from "@iconify-icons/bi/cloud-haze-fill";
import fireIcon from '@iconify-icons/icomoon-free/fire';
import floodIcon from "@iconify-icons/bi/water";
import stormIcon from "@iconify-icons/bi/tropical-storm";
import volcanoIcon from "@iconify-icons/maki/volcano-11";
import waterColorIcon from "@iconify/icons-mdi/water-alert";
import landslideIcon from "@iconify-icons/openmoji/landslide";
import icebergIcon from "@iconify-icons/openmoji/iceberg";
import earthquakeIcon from "@iconify-icons/wi/earthquake";
import snowIcon from "@iconify-icons/bi/snow";
import temperatureIcon from "@iconify-icons/bi/thermometer-high";

function DisasterTypes(name, id, iconType, iconClass ) {
  this.name = name;
  this.id = id;
  this.iconType = iconType;
  this.iconClass = iconClass;
}

// Updated to use EONET v3 string-based category IDs
const drought = new DisasterTypes("Drought", "drought", droughtIcon, "location-icon drought");
const dustHaze = new DisasterTypes("Dust and Haze", "dustHaze", dustHazeIcon, "location-icon dust");
const wildfires = new DisasterTypes("Wildfires", "wildfires", fireIcon, "location-icon fire");
const floods = new DisasterTypes("Floods", "floods", floodIcon, "location-icon flood");
const severeStorms = new DisasterTypes("Severe Storms", "severeStorms", stormIcon, "location-icon storm");
const volcanoes = new DisasterTypes("Volcanoes", "volcanoes", volcanoIcon, "location-icon volcano");
const waterColor = new DisasterTypes("Water Color", "waterColor", waterColorIcon, "location-icon water-color");
const landslides = new DisasterTypes("Landslides", "landslides", landslideIcon, "location-icon");
const seaLakeIce = new DisasterTypes("Sea, Lake Ice", "seaLakeIce", icebergIcon, "location-icon");
const earthquakes = new DisasterTypes("Earthquakes", "earthquakes", earthquakeIcon, "location-icon earthquake");
const snow = new DisasterTypes("Snow", "snow", snowIcon, "location-icon snow");
const tempExtremes = new DisasterTypes("Extreme Temp", "tempExtremes", temperatureIcon, "location-icon temperature");

let disasterTypes = [
  drought,
  dustHaze,
  wildfires,
  floods,
  severeStorms,
  volcanoes,
  waterColor,
  landslides,
  seaLakeIce,
  earthquakes,
  snow,
  tempExtremes,
];

export default disasterTypes;