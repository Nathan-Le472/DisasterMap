import { Icon } from "@iconify/react";
import closeCircle from "@iconify-icons/mdi/close-circle";

const LocationInfoBox = ({ info, setOpenInfoBox }) => {
  let latitude = info.lat.toFixed(2);
  let longitude = info.lng.toFixed(2);
  // change latitude to S or N
  if (latitude < 0) {
    latitude = latitude * -1 + " °S";
  } else {
    latitude = latitude + " °N";
  }
  // change longitude to W or E
  if (longitude < 0) {
    longitude = longitude * -1 + " °W";
  } else {
    longitude = longitude + " °E";
  }

  return (
    <div className="location-info">
      <Icon
        icon={closeCircle}
        onClick={() => setOpenInfoBox(false)}
        className="close-icon"
      />
      <h2>
        <strong>{info.title}</strong>
      </h2>
      <ul>
        <li>
          ID: <span className="location-box-info">{info.id}</span>
        </li>
        <li>
          LATITUDE: <span className="location-box-info">{latitude}</span>
        </li>
        <li>
          LONGITUDE: <span className="location-box-info">{longitude}</span>
        </li>
        
      </ul>
      <a href={info.learn} target="_blank" rel="noreferrer">
          Find out more
        </a>
    </div>
  );
};

export default LocationInfoBox;