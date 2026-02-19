import { useState, useEffect } from "react";
import GoogleMapReact from "google-map-react";
import LocationMarker from "./LocationMarker";
import LocationInfoBox from "./LocationInfoBox";
import DisasterSelector from "./DisasterSelector";
import disasterTypes from "../utils/DisasterTypes";

const Map = ({ eventData, center, zoom }) => {
  const [locationInfo, setLocationInfo] = useState(null);
  const [openInfoBox, setOpenInfoBox] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(zoom);
  
  // Filter states (moved from App.js)
  const [selectedTypes, setSelectedTypes] = useState([]); // Array of selected disaster type IDs
  const [showAll, setShowAll] = useState(true); // Whether "All Disasters" is checked

  // Get all possible disaster type IDs
  const allDisasterIds = disasterTypes.map(disaster => disaster.id);

  // Override drag behavior to prevent movement outside bounds
  useEffect(() => {
    const overrideDragBehavior = () => {
      const selector = document.querySelector('.disaster-selector');
      const mapContainer = document.querySelector('.map-container');
      
      if (!selector || !mapContainer) return;
      
      const MIN_TOP = 60;
      const MARGIN = 10;
      
      // Store original mouse event handlers
      let isDragging = false;
      let dragOffset = { x: 0, y: 0 };
      
      // Remove existing event listeners and add our own
      const header = selector.querySelector('.selector-header');
      if (!header) return;
      
      // Our custom drag handler that respects boundaries
      const handleMouseDown = (e) => {
        if (e.target.closest('.minimize-button')) return;
        
        e.preventDefault();
        isDragging = true;
        
        const rect = selector.getBoundingClientRect();
        dragOffset = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        };
        
        document.body.style.userSelect = 'none';
      };
      
      const handleMouseMove = (e) => {
        if (!isDragging) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        const mapRect = mapContainer.getBoundingClientRect();
        const filterRect = selector.getBoundingClientRect();
        
        // Calculate new position
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        // Calculate bounds relative to viewport
        const minTop = MIN_TOP;
        const maxTop = mapRect.height + mapRect.top - filterRect.height - MARGIN;
        const minLeft = mapRect.left + MARGIN;
        const maxLeft = mapRect.left + mapRect.width - filterRect.width - MARGIN;
        
        // Constrain to bounds BEFORE setting position
        const constrainedX = Math.max(minLeft, Math.min(newX, maxLeft));
        const constrainedY = Math.max(minTop, Math.min(newY, maxTop));
        
        // Only update position if it's within bounds
        selector.style.left = constrainedX + 'px';
        selector.style.top = constrainedY + 'px';
      };
      
      const handleMouseUp = () => {
        isDragging = false;
        document.body.style.userSelect = '';
      };
      
      // Replace the original drag handlers
      header.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      // Cleanup function
      return () => {
        header.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    };
    
    const timer = setTimeout(overrideDragBehavior, 600);
    return () => clearTimeout(timer);
  }, []);

  // Determine which types to show on the map
  const getVisibleTypes = () => {
    if (showAll) {
      // Show all disasters except those explicitly excluded
      return allDisasterIds.filter(id => !selectedTypes.includes(id));
    } else {
      // Show only selected disasters
      return selectedTypes;
    }
  };

  // Handle "All Disasters" checkbox
  const handleAllToggle = (checked) => {
    setShowAll(checked);
    if (checked) {
      // When enabling "All", clear the selected types (no exclusions)
      setSelectedTypes([]);
    } else {
      // When disabling "All", start with no individual selections
      setSelectedTypes([]);
    }
  };

  // Handle individual disaster type checkbox
  const handleTypeToggle = (disasterId, checked) => {
    if (showAll) {
      // In "show all" mode, we're managing exclusions
      if (checked) {
        // Remove from exclusions (show this disaster)
        setSelectedTypes(prev => prev.filter(id => id !== disasterId));
      } else {
        // Add to exclusions (hide this disaster)
        setSelectedTypes(prev => [...prev, disasterId]);
      }
    } else {
      // In individual selection mode
      if (checked) {
        // Add to selections
        setSelectedTypes(prev => [...prev, disasterId]);
      } else {
        // Remove from selections
        setSelectedTypes(prev => prev.filter(id => id !== disasterId));
      }
    }
  };

  // Check if a specific disaster type should be checked
  const isTypeChecked = (disasterId) => {
    if (showAll) {
      // In "show all" mode, checked means NOT excluded
      return !selectedTypes.includes(disasterId);
    } else {
      // In individual mode, checked means selected
      return selectedTypes.includes(disasterId);
    }
  };

  // Get visible types for filtering
  const visibleTypes = getVisibleTypes();

  // Improved clustering with minimum representation
  const clusterMarkers = (events, zoomLevel) => {
    if (zoomLevel >= 8) {
      // Show all markers when zoomed in
      return events;
    }

    // Create a grid-based approach to ensure minimum representation
    const gridSize = zoomLevel >= 6 ? 2 : zoomLevel >= 4 ? 4 : 6; // Larger grid = more clustering
    const grid = {};
    
    // First pass: assign events to grid cells
    events.forEach(event => {
      if (!event.geometry || event.geometry.length === 0) return;
      
      const currentGeometry = event.geometry[event.geometry.length - 1];
      if (!currentGeometry.coordinates || 
          !currentGeometry.coordinates[0] || 
          !currentGeometry.coordinates[1]) return;

      const lat = currentGeometry.coordinates[1];
      const lng = currentGeometry.coordinates[0];
      
      // Create grid cell key
      const gridLat = Math.floor(lat * gridSize) / gridSize;
      const gridLng = Math.floor(lng * gridSize) / gridSize;
      const gridKey = `${gridLat},${gridLng}`;
      
      if (!grid[gridKey]) {
        grid[gridKey] = [];
      }
      grid[gridKey].push(event);
    });

    // Second pass: create markers ensuring minimum representation
    const clusteredEvents = [];
    
    Object.entries(grid).forEach(([gridKey, gridEvents]) => {
      if (gridEvents.length === 0) return;
      
      // For sparse areas (≤3 events), show individual markers
      if (gridEvents.length <= 3) {
        clusteredEvents.push(...gridEvents);
        return;
      }
      
      // For dense areas, create clusters but ensure at least 2 markers per grid cell
      const minMarkersPerCell = 2;
      const eventsPerCluster = Math.max(2, Math.floor(gridEvents.length / minMarkersPerCell));
      
      for (let i = 0; i < gridEvents.length; i += eventsPerCluster) {
        const clusterEvents = gridEvents.slice(i, i + eventsPerCluster);
        
        if (clusterEvents.length === 1) {
          // Single event, show as is
          clusteredEvents.push(clusterEvents[0]);
        } else {
          // Multiple events, create cluster
          const totalLat = clusterEvents.reduce((sum, e) => sum + e.geometry[e.geometry.length - 1].coordinates[1], 0);
          const totalLng = clusterEvents.reduce((sum, e) => sum + e.geometry[e.geometry.length - 1].coordinates[0], 0);
          
          clusteredEvents.push({
            ...clusterEvents[0], // Use first event as base
            count: clusterEvents.length,
            geometry: [{
              coordinates: [
                totalLng / clusterEvents.length,  // Average longitude
                totalLat / clusterEvents.length   // Average latitude
              ]
            }],
            events: clusterEvents,
            title: clusterEvents.length > 1 ? 
              `${clusterEvents.length} ${clusterEvents[0].categories[0].title || 'Disasters'}` : 
              clusterEvents[0].title
          });
        }
      }
    });

    return clusteredEvents;
  };

  // Improved marker limiting with regional balance
  const limitMarkers = (events, zoomLevel) => {
    const maxMarkers = zoomLevel >= 10 ? 3000 : 
                      zoomLevel >= 8 ? 1500 : 
                      zoomLevel >= 6 ? 800 : 400;
    
    if (events.length <= maxMarkers) return events;
    
    // Instead of just taking the most recent, ensure geographic distribution
    // Create regions and take proportional samples from each
    const regions = {};
    const regionSize = 10; // degrees
    
    events.forEach(event => {
      const lat = event.geometry[event.geometry.length - 1].coordinates[1];
      const lng = event.geometry[event.geometry.length - 1].coordinates[0];
      const regionKey = `${Math.floor(lat / regionSize)},${Math.floor(lng / regionSize)}`;
      
      if (!regions[regionKey]) {
        regions[regionKey] = [];
      }
      regions[regionKey].push(event);
    });
    
    // Calculate how many markers each region should contribute
    const regionKeys = Object.keys(regions);
    const markersPerRegion = Math.floor(maxMarkers / regionKeys.length);
    const remainder = maxMarkers % regionKeys.length;
    
    const balancedEvents = [];
    
    regionKeys.forEach((regionKey, index) => {
      const regionEvents = regions[regionKey];
      const markersFromThisRegion = markersPerRegion + (index < remainder ? 1 : 0);
      
      // Sort by recency and take the required number
      const sortedEvents = regionEvents
        .sort((a, b) => new Date(b.geometry[b.geometry.length - 1].date || 0) - 
                       new Date(a.geometry[a.geometry.length - 1].date || 0));
      
      balancedEvents.push(...sortedEvents.slice(0, Math.min(markersFromThisRegion, regionEvents.length)));
    });
    
    return balancedEvents;
  };

  // Handle map changes
  const handleMapChange = ({ zoom: newZoom }) => {
    setCurrentZoom(newZoom);
  };

  // Filter and process events
  const filteredEvents = eventData.filter(ev => {
    if (!ev.geometry || ev.geometry.length === 0 || !ev.categories || ev.categories.length === 0) {
      return false;
    }
    
    const categoryId = ev.categories[0].id;
    return visibleTypes.includes(categoryId);
  });

  // Apply clustering and limiting
  const clusteredEvents = clusterMarkers(filteredEvents, currentZoom);
  const limitedEvents = limitMarkers(clusteredEvents, currentZoom);


  // Create markers
  const markers = limitedEvents.map(ev => {
    const currentGeometry = ev.geometry[ev.geometry.length - 1];
    const longitude = currentGeometry.coordinates[0];
    const latitude = currentGeometry.coordinates[1];
    const categoryId = ev.categories[0].id;

    return (
      <LocationMarker
        key={`${ev.id}-${ev.count || 1}`}
        evId={categoryId}
        lat={latitude}
        lng={longitude}
        title={ev.count > 1 ? `${ev.count} ${ev.title || 'Disasters'}` : ev.title}
        count={ev.count}
        onClick={() => {
          setOpenInfoBox(true);
          setLocationInfo({
            id: ev.id,
            title: ev.count > 1 ? `${ev.count} disasters in this area` : ev.title,
            lat: latitude,
            lng: longitude,
            learn: ev.sources?.[0]?.url || '#',
            count: ev.count,
            events: ev.events || [ev]
          });
        }}
      />
    );
  });

  // Show location info box
  const locationBox = locationInfo && openInfoBox ? (
    <LocationInfoBox
      info={locationInfo}
      openInfoBox={openInfoBox}
      setOpenInfoBox={setOpenInfoBox}
    />
  ) : null;
  
  return (
    <div className="map">
      {/* Disaster Selector - now only shows when map is loaded */}
      <DisasterSelector 
        showAll={showAll}
        selectedTypes={selectedTypes}
        onAllToggle={handleAllToggle}
        onTypeToggle={handleTypeToggle}
        isTypeChecked={isTypeChecked}
        eventData={eventData}
      />
      
      <GoogleMapReact
        bootstrapURLKeys={{ key: process.env.REACT_APP_API_KEY }}
        defaultCenter={center}
        defaultZoom={zoom}
        className="google-map"
        onChange={handleMapChange}
        options={{
          restriction: {
            latLngBounds: {
              north: 85,
              south: -85,
              west: -180,
              east: 180
            },
            strictBounds: false
          },
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          gestureHandling: 'greedy'
        }}
      >
        {markers}
      </GoogleMapReact>
      {locationBox}
    </div>
  );
};

Map.defaultProps = {
  center: {
    lat: 38.9072,
    lng: -77.0369,
  },
  zoom: 5,
};

export default Map;