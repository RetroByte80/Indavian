import React, { useEffect, useRef, useState } from "react";
// Ensure AdvancedMarkerElement is available

const BASE_URL = "https://jrx1jscm-8000.inc1.devtunnels.ms";

// Add static markers data
const staticMarkers = [
  {
    ClassName: "Multi-cell Hotspot",
    Latitude: 23.37492528018796,
    Longitude: 72.05125790050874,
  },
  {
    ClassName: "Hotspot",
    Latitude: 23.37492527956181,
    Longitude: 72.05125790172825,
  },
  {
    ClassName: "Hotspot",
    Latitude: 23.37492528053346,
    Longitude: 72.0512579015852,
  },
  {
    ClassName: "Hotspot",
    Latitude: 23.37492528056873,
    Longitude: 72.05125789985863,
  },
  {
    ClassName: "Hotspot",
    Latitude: 23.37492528056727,
    Longitude: 72.05125789992631,
  },
  {
    ClassName: "Hotspot",
    Latitude: 23.37492528073827,
    Longitude: 72.05125789999819,
  },
  {
    ClassName: "Hotspot",
    Latitude: 23.37492528056461,
    Longitude: 72.05125789999441,
  },
  {
    ClassName: "Hotspot",
    Latitude: 23.3749252807381,
    Longitude: 72.05125789993029,
  },
  {
    ClassName: "Hotspot",
    Latitude: 23.37492528053054,
    Longitude: 72.05125790175255,
  },
  {
    ClassName: "Hotspot",
    Latitude: 23.37492528053725,
    Longitude: 72.0512579013327,
  },
  {
    ClassName: "Hotspot",
    Latitude: 23.37492528052055,
    Longitude: 72.05125790254283,
  },
  {
    ClassName: "Hotspot",
    Latitude: 23.37492528073683,
    Longitude: 72.05125790006925,
  },
  {
    ClassName: "Hotspot",
    Latitude: 23.37492528053624,
    Longitude: 72.05125790141659,
  },
  {
    ClassName: "Hotspot",
    Latitude: 23.37492528054129,
    Longitude: 72.05125790116573,
  },
  {
    ClassName: "Hotspot",
    Latitude: 23.3749252807242,
    Longitude: 72.05125790141842,
  },
  {
    ClassName: "Hotspot",
    Latitude: 23.37492528056291,
    Longitude: 72.05125790006512,
  },
  {
    ClassName: "Hotspot",
    Latitude: 23.37492528072826,
    Longitude: 72.05125790108491,
  },
  {
    ClassName: "Hotspot",
    Latitude: 23.37492528072538,
    Longitude: 72.05125790133484,
  },
  {
    ClassName: "Hotspot",
    Latitude: 23.37492528141744,
    Longitude: 72.05125790222858,
  },
  {
    ClassName: "Hotspot",
    Latitude: 23.37492528090532,
    Longitude: 72.05125790158748,
  },
  {
    ClassName: "Hotspot",
    Latitude: 23.37492528127445,
    Longitude: 72.05125790109432,
  },
  {
    ClassName: "Hotspot",
    Latitude: 23.37492527961772,
    Longitude: 72.0512579004352,
  },
  {
    ClassName: "Hotspot",
    Latitude: 23.37492528159518,
    Longitude: 72.05125790032348,
  },
  {
    ClassName: "Hotspot",
    Latitude: 23.37492528019555,
    Longitude: 72.05125790043141,
  },
  {
    ClassName: "Hotspot",
    Latitude: 23.37492528053185,
    Longitude: 72.05125790166827,
  },
  {
    ClassName: "Hotspot",
    Latitude: 23.3749252815564,
    Longitude: 72.05125790258599,
  },
  {
    ClassName: "Hotspot",
    Latitude: 23.37492528015993,
    Longitude: 72.05125790166238,
  },
  {
    ClassName: "Hotspot",
    Latitude: 23.3749252797607,
    Longitude: 72.05125790265312,
  },
  {
    ClassName: "Hotspot",
    Latitude: 23.3749252814339,
    Longitude: 72.05125790191435,
  },
  {
    ClassName: "Hotspot",
    Latitude: 23.3749252807285,
    Longitude: 72.05125790059473,
  },
  {
    ClassName: "Hotspot",
    Latitude: 23.37492527956606,
    Longitude: 72.05125790197005,
  },
  {
    ClassName: "Hotspot",
    Latitude: 23.37492528019033,
    Longitude: 72.05125790058656,
  },
];

const GoogleMap = ({ ortho_image, markers }) => {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null); // Reference for the map container
  const drawingManagerRef = useRef(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [measurementTool, setMeasurementTool] = useState(null);
  const [currentMarkers, setCurrentMarkers] = useState([]);
  const overlaysRef = useRef([]);
  const infoWindowsRef = useRef([]);

  const GOOGLE_API_KEY = "AIzaSyBIX9afcpqhWoJBu_3ZKe6gNZimOiDcZTM"; // Replace with your API key

  const defaultCenter = { lat: 0, lng: 0 }; // Default to world view
  const defaultZoom = 2;

  // Function to clear all measurements
  const clearMeasurements = () => {
    if (overlaysRef.current) {
      overlaysRef.current.forEach((overlay) => {
        if (overlay) overlay.setMap(null);
      });
    }
    if (infoWindowsRef.current) {
      infoWindowsRef.current.forEach((infoWindow) => {
        if (infoWindow) infoWindow.close();
      });
    }
    overlaysRef.current = [];
    infoWindowsRef.current = [];
  };

  // Function to remove single measurement
  const removeMeasurement = (overlay, infoWindow) => {
    if (overlay) overlay.setMap(null);
    if (infoWindow) infoWindow.close();
    overlaysRef.current = overlaysRef.current.filter((o) => o !== overlay);
    infoWindowsRef.current = infoWindowsRef.current.filter(
      (w) => w !== infoWindow
    );
  };

  // Function to calculate and display measurements
  const calculateMeasurement = (overlay) => {
    let infoWindow = new window.google.maps.InfoWindow();
    let content = "";

    // Check for overlay type from the event
    const overlayType = overlay.type || overlay.overlay?.type;

    if (
      overlayType === "polyline" ||
      overlay instanceof window.google.maps.Polyline
    ) {
      const path = overlay.getPath();
      let distance = 0;

      for (let i = 0; i < path.getLength() - 1; i++) {
        const point1 = path.getAt(i);
        const point2 = path.getAt(i + 1);
        distance +=
          window.google.maps.geometry.spherical.computeDistanceBetween(
            point1,
            point2
          );
      }

      const distanceInM = (distance / 1000).toFixed(2);
      content = `Distance: ${distanceInM} m`;

      infoWindow.setPosition(path.getAt(path.getLength() - 1));
    } else if (
      overlay.type === window.google.maps.drawing.OverlayType.POLYGON
    ) {
      const path = overlay.getPath();
      const area = window.google.maps.geometry.spherical.computeArea(path);
      const areaInSqM = area.toFixed(2); // Now directly in square meters
      const bounds = new window.google.maps.LatLngBounds();
      path.forEach((point) => bounds.extend(point));
      content = `Area: ${areaInSqM} m²`; // Note the unit is now m²
      infoWindow.setPosition(bounds.getCenter());
    }

    // Create content element
    const contentDiv = document.createElement("div");
    contentDiv.innerHTML = `
      <div style="padding: 10px;">
        <p style="margin: 0 0 10px 0;">${content}</p>
        <button 
          style="
            background-color: #ff4444;
            color: white;
            border: none;
            padding: 5px 10px;
            cursor: pointer;
            border-radius: 4px;
          "
          class="remove-measurement-btn"
        >
          Remove
        </button>
      </div>
    `;

    infoWindow.setContent(contentDiv);
    infoWindow.setMap(mapRef.current);
    infoWindow.open(mapRef.current, overlay);

    // Add click event listener after the info window is opened
    window.google.maps.event.addListenerOnce(infoWindow, "domready", () => {
      const removeButton = infoWindow
        .getContent()
        .querySelector(".remove-measurement-btn");
      if (removeButton) {
        removeButton.addEventListener("click", () => {
          removeMeasurement(overlay, infoWindow);
        });
      }
    });

    // Store references
    overlaysRef.current.push(overlay);
    infoWindowsRef.current.push(infoWindow);

    // Add click listener to show info window if it's closed
    window.google.maps.event.addListener(overlay, "click", () => {
      infoWindow.open(mapRef.current, overlay);
    });
  };

  const staticDefectData = [
    { type: "Multi-cell Hotspot", count: 12, color: "red" },
    { type: "Hotspot", count: 8, color: "yellow" },
    { type: "Short circuit", count: 5, color: "orange" },
  ];

  const sampleDefectDetails = {
    name: "Crack #12",
    location: "B1-C02",
    severity: "High",
    coordinates: "Lat: 12.34, Lng: 56.78",
    description: "This defect is a large crack in the panel...",
  };

  useEffect(() => {
    const handleFullScreenChange = () => {
      const isFullscreenNow = Boolean(
        document.fullscreenElement ||
          document.webkitFullscreenElement ||
          document.msFullscreenElement
      );
      setIsFullScreen(isFullscreenNow);
    };

    document.addEventListener("fullscreenchange", handleFullScreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullScreenChange);
    document.addEventListener("msfullscreenchange", handleFullScreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullScreenChange
      );
      document.removeEventListener(
        "msfullscreenchange",
        handleFullScreenChange
      );
    };
  }, []);

  const toggleFullScreen = () => {
    if (!isFullScreen) {
      if (mapContainerRef.current.requestFullscreen) {
        mapContainerRef.current.requestFullscreen();
      } else if (mapContainerRef.current.webkitRequestFullscreen) {
        mapContainerRef.current.webkitRequestFullscreen();
      } else if (mapContainerRef.current.msRequestFullscreen) {
        mapContainerRef.current.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };

  const setMarkerRef = (marker, key) => {
    setCurrentMarkers((prevMarkers) => {
      if (marker && prevMarkers[key]) return prevMarkers; // Prevent adding duplicate markers
      if (!marker && !prevMarkers[key]) return prevMarkers; // Prevent removing non-existent marker

      const newMarkers = { ...prevMarkers };
      if (marker) {
        newMarkers[key] = marker; // Add or update the marker
      } else {
        delete newMarkers[key]; // Remove the marker
      }
      return newMarkers;
    });
  };

  useEffect(() => {
    // Dynamically load the Google Maps script
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places,drawing,geometry`;
    script.async = true;
    script.onload = () => {
      // Initialize the map once the script is loaded
      const initialPosition =
        markers && markers.length > 0
          ? { lat: markers[0].Latitude, lng: markers[0].Longitude }
          : { lat: 0, lng: 0 }; // Default to 0,0 if no markers are provided

      const mapInstance = new window.google.maps.Map(mapContainerRef.current, {
        center: initialPosition,
        zoom: markers && markers.length > 0 ? 10 : 2, // Zoom into site if there are markers
        mapTypeId: "satellite",
      });

      // Store map reference
      mapRef.current = mapInstance;

      // Create the clear measurements button
      const clearButton = document.createElement("button");
      clearButton.textContent = "Clear All Measurements";
      clearButton.className = "custom-map-button";
      clearButton.style.cssText = `
         background-color: white;
         border: 2px solid #ccc;
         border-radius: 3px;
         box-shadow: 0 2px 6px rgba(0,0,0,.3);
         color: rgb(25,25,25);
         cursor: pointer;
         font-family: Roboto,Arial,sans-serif;
         font-size: 16px;
         margin: 10px;
         padding: 8px 16px;
       `;
      clearButton.addEventListener("click", clearMeasurements);

      mapInstance.controls[window.google.maps.ControlPosition.TOP_RIGHT].push(
        clearButton
      );

      // Initialize drawing manager
      const drawingManager = new window.google.maps.drawing.DrawingManager({
        drawingControl: true,
        drawingControlOptions: {
          position: window.google.maps.ControlPosition.TOP_CENTER,
          drawingModes: [
            window.google.maps.drawing.OverlayType.POLYLINE,
            window.google.maps.drawing.OverlayType.POLYGON,
          ],
        },
        polylineOptions: {
          strokeColor: "#FF0000",
          strokeWeight: 2,
          clickable: true,
        },
        polygonOptions: {
          strokeColor: "#FF0000",
          strokeWeight: 2,
          fillColor: "#FF0000",
          fillOpacity: 0.35,
          clickable: true,
        },
      });

      // Store drawing manager reference
      drawingManagerRef.current = drawingManager;
      drawingManager.setMap(mapInstance);
      setMeasurementTool(drawingManager);

      // Add event listener for when a shape is completed
      window.google.maps.event.addListener(
        drawingManager,
        "overlaycomplete",
        (event) => {
          const overlay = event.overlay;
          overlay.type = event.type.toLowerCase(); // Add type property to overlay
          calculateMeasurement(overlay);
        }
      );

      const bounds = new window.google.maps.LatLngBounds();

      // Store marker instances and add them to the map in bulk
      const markerInstances = markers
        .map((marker, index) => {
          // Ensure Latitude and Longitude are numbers
          const markerLatitude = parseFloat(marker.Latitude);
          const markerLongitude = parseFloat(marker.Longitude);
          // console.log(`Marker ${index + 1}: Latitude - ${marker.Latitude}, Longitude - ${marker.Longitude}`);

          if (isNaN(markerLatitude) || isNaN(markerLongitude)) {
            console.error(`Invalid marker coordinates: ${marker}`);
            return null; // Skip invalid markers
          }

          const markerInstance = new window.google.maps.Marker({
            position: { lat: markerLatitude, lng: markerLongitude },
            map: mapInstance,
            title: marker.ClassName,
          });

          const infowindow = new window.google.maps.InfoWindow({
            content: `<h3>${marker.ClassName},\n ${marker.Latitude}, ${marker.Longitude}</h3>`,
          });

          markerInstance.addListener("click", () => {
            infowindow.open(mapInstance, markerInstance);
          });
          bounds.extend(markerInstance.getPosition());
          return markerInstance; // Return marker for bulk addition
        })
        .filter((marker) => marker !== null); // Remove any null markers

      // Fit map bounds to show all markers
      // Fit map bounds to show all markers
      if (markerInstances.length > 0) {
        mapInstance.fitBounds(bounds);
        setMarkerRef(markerInstances);
      } else {
        // If no markers, reset to default view
        mapInstance.setCenter(defaultCenter);
        mapInstance.setZoom(defaultZoom);
      }
    };
    document.head.appendChild(script);
    // Store map reference
    // Store map reference

    return () => {
      if (mapRef.current) {
        mapRef.current = null;
      }
      if (drawingManagerRef.current) {
        drawingManagerRef.current.setMap(null);
      }
      clearMeasurements();
    };
  }, [ortho_image, markers]);

  return (
    <div
      style={{ position: "relative", height: "100%" }}
      ref={mapContainerRef}
    ></div>
  );
};

export default GoogleMap;
