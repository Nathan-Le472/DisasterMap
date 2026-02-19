import { useState, useEffect } from "react";
import Map from "./components/Map";
import Loader from "./components/Loader";

function App() {
  const [eventData, setEventData] = useState([]);
  const [loading, setLoading] = useState(false);

  // on page load
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          "https://eonet.gsfc.nasa.gov/api/v3/events"
        );
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        
        const { events } = data;

        setEventData(events || []);
      } catch (error) {
        console.error("Error fetching events:", error);
        setEventData([]);
      }
      setLoading(false);
    };

    fetchEvents();
  }, []);

  return (
    <div>
      {/* if loading is false, display Map (with filter), otherwise display Loader */}
      {!loading ? (
        <Map eventData={eventData} />
      ) : (
        <Loader />
      )}
    </div>
  );
}

export default App;