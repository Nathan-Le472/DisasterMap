import { useState, useRef, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import exclamationIcon from "@iconify-icons/bi/exclamation-triangle-fill";
import chevronUpIcon from "@iconify-icons/bi/chevron-up";
import chevronDownIcon from "@iconify-icons/bi/chevron-down";
import disasterTypes from "../utils/DisasterTypes";

const DisasterSelector = ({ 
  showAll, 
  selectedTypes, 
  onAllToggle, 
  onTypeToggle, 
  isTypeChecked,
  eventData = []
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 20, y: 60 });
  const selectorRef = useRef(null);

  // Count disasters by type
  const getDisasterCounts = () => {
    const counts = {};
    let totalCount = 0;

    // Initialize counts for all disaster types
    disasterTypes.forEach(disaster => {
      counts[disaster.id] = 0;
    });

    // Count disasters from eventData
    eventData.forEach(event => {
      if (event.geometry && event.geometry.length > 0 && event.categories && event.categories.length > 0) {
        const categoryId = event.categories[0].id;
        if (counts.hasOwnProperty(categoryId)) {
          counts[categoryId]++;
        }
        totalCount++;
      }
    });

    return { ...counts, total: totalCount };
  };

  const disasterCounts = getDisasterCounts();
  
  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const handleAllChange = (e) => {
    onAllToggle(e.target.checked);
  };

  const handleTypeChange = (disasterId) => (e) => {
    onTypeToggle(disasterId, e.target.checked);
  };

  // Drag functionality
  const handleMouseDown = (e) => {
    // Don't start dragging if clicking on the minimize button or its children
    if (e.target.closest('.minimize-button')) {
      return;
    }
    
    // Only allow dragging from the header area
    if (e.target.closest('.selector-header')) {
      e.preventDefault();
      setIsDragging(true);
      const rect = selectorRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      document.body.style.userSelect = 'none'; // Prevent text selection
    }
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // Keep within viewport bounds
    const maxX = window.innerWidth - 320; // selector width
    const maxY = window.innerHeight - 100; // minimum visible height
    
    const boundedX = Math.max(0, Math.min(newX, maxX));
    const boundedY = Math.max(60, Math.min(newY, maxY));
    
    // Use requestAnimationFrame for smooth movement
    requestAnimationFrame(() => {
      setPosition({
        x: boundedX,
        y: boundedY
      });
    });
  }, [isDragging, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.body.style.userSelect = ''; // Restore text selection
  }, []);

  // Add global mouse event listeners when dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove, { 
        passive: false,
        capture: true 
      });
      document.addEventListener('mouseup', handleMouseUp, { 
        passive: false,
        capture: true 
      });
      
      // Prevent scrolling and other interactions while dragging
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove, { capture: true });
        document.removeEventListener('mouseup', handleMouseUp, { capture: true });
        document.body.style.overflow = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div 
      ref={selectorRef}
      className={`disaster-selector ${isMinimized ? 'minimized' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
    >
      {/* Header with minimize button */}
      <div 
        className="selector-header"
        onMouseDown={handleMouseDown}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <h3>Filter Disasters</h3>
        <button 
          className="minimize-button" 
          onClick={handleMinimize}
          aria-label={isMinimized ? "Expand" : "Minimize"}
          style={{ cursor: 'pointer' }}
        >
          <Icon icon={isMinimized ? chevronDownIcon : chevronUpIcon} />
        </button>
      </div>

      {/* Filter options - hidden when minimized */}
      <div className="selector-content">
        {/* All Disasters checkbox */}
        <div className="filter-option all-disasters">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showAll}
              onChange={handleAllChange}
              className="checkbox-input"
            />
            <span className="checkbox-custom"></span>
            <span className="checkbox-text">
              <span className="disaster-name">All Disasters</span>
              <span className="disaster-count">({disasterCounts.total})</span>
              <Icon icon={exclamationIcon} className="disaster-icon all" />
            </span>
          </label>
        </div>

        {/* Individual disaster type checkboxes */}
        <div className="individual-disasters">
          <div className="disasters-grid">
            {disasterTypes.map(disaster => (
              <div key={disaster.id} className="filter-option">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={isTypeChecked(disaster.id)}
                    onChange={handleTypeChange(disaster.id)}
                    className="checkbox-input"
                  />
                  <span className="checkbox-custom"></span>
                  <span className="checkbox-text">
                    <span className="disaster-name">{disaster.name}</span>
                    <span className="disaster-count">({disasterCounts[disaster.id] || 0})</span>
                    <Icon icon={disaster.iconType} className={disaster.iconClass} />
                  </span>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Clear all button */}
        <div className="selector-actions">
          <button 
            className="clear-button"
            onClick={() => {
              onAllToggle(false);
            }}
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
};

export default DisasterSelector;