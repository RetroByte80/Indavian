import React, { useEffect, useRef } from 'react';

const Maps = ({ markers = [], selectedProject, selectedSurvey }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const overlayRef = useRef(null);
  const GOOGLE_API_KEY = "AIzaSyBIX9afcpqhWoJBu_3ZKe6gNZimOiDcZTM"; // Replace with your API key

    // Fallback coordinates for India
    const defaultCenter = { lat: 20.5937, lng: 78.9629 };
    const defaultZoom = 5; // Adjust as needed

  // Function to load the Google Maps API dynamically.
  const loadGoogleMapsScript = () => {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.maps) {
        resolve(window.google.maps);
      } else {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve(window.google.maps);
        script.onerror = reject;
        document.body.appendChild(script);
      }
    });
  };

   // Initialize the map.
   useEffect(() => {
    loadGoogleMapsScript()
      .then(() => {
        if (!mapRef.current) return;
        // Check if selectedProject has valid coordinates; if not, use default (India)
        const lat =
          selectedProject && selectedProject.lat
            ? parseFloat(selectedProject.lat)
            : null;
        const lng =
          selectedProject && selectedProject.lng
            ? parseFloat(selectedProject.lng)
            : null;
        const initialCenter =
          lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)
            ? { lat, lng }
            : defaultCenter;
        const initialZoom =
          selectedProject && selectedProject.zoom ? selectedProject.zoom : defaultZoom;
        mapInstance.current = new window.google.maps.Map(mapRef.current, {
          center: initialCenter,
          zoom: initialZoom,
          mapTypeId: 'Satellite'
        });
        console.log("Map initialized:", mapInstance.current);

        // Force a resize after a short delay to ensure the container is fully rendered.
        setTimeout(() => {
          window.google.maps.event.trigger(mapInstance.current, 'resize');
          // Optionally re-center after resize.
          mapInstance.current.setCenter(initialCenter);
        }, 500);
      
      })
      .catch((error) => {
        console.error("Error loading Google Maps API:", error);
      });
  }, [selectedProject]);

  // Update markers whenever the markers prop changes.
  useEffect(() => {
    if (!mapInstance.current) return;
    // Remove existing markers.
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
    // Add new markers.
    markers.forEach(m => {
      if (m.Latitude && m.Longitude) {
        const marker = new window.google.maps.Marker({
          position: { lat: m.Latitude, lng: m.Longitude },
          map: mapInstance.current,
          title: m.ClassName || ''
        });
        markersRef.current.push(marker);
      }
    });
  }, [markers]);

  // Update the MBTiles overlay when selectedSurvey changes.
  useEffect(() => {
    if (!mapInstance.current) return;
    // Remove any existing overlay.
    if (overlayRef.current) {
      mapInstance.current.overlayMapTypes.removeAt(0);
      overlayRef.current = null;
    }
    // If a survey is selected and provides a tileUrl template, add the overlay.
    if (selectedSurvey && selectedSurvey.tileUrl) {
      const orthomosaicOverlay = new window.google.maps.ImageMapType({
        getTileUrl: (coord, zoom) => {
          let url = selectedSurvey.tileUrl;
          url = url.replace(/\{z\}/g, zoom)
                   .replace(/\{x\}/g, coord.x)
                   .replace(/\{y\}/g, coord.y);
          return url;
        },
        tileSize: new window.google.maps.Size(256, 256),
        maxZoom: 18,    // Default max zoom.
        minZoom: 0,
        opacity: 0.7,   // Default opacity.
        name: 'Orthomosaic Overlay'
      });
      mapInstance.current.overlayMapTypes.insertAt(0, orthomosaicOverlay);
      overlayRef.current = orthomosaicOverlay;
    }
  }, [selectedSurvey]);

   // Recenter the map when selectedProject changes.
   useEffect(() => {
    if (mapInstance.current && selectedProject) {
      const lat =
        selectedProject && selectedProject.lat
          ? parseFloat(selectedProject.lat)
          : null;
      const lng =
        selectedProject && selectedProject.lng
          ? parseFloat(selectedProject.lng)
          : null;
      const newCenter =
        lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)
          ? { lat, lng }
          : defaultCenter;
      mapInstance.current.panTo(newCenter);
      const newZoom =
        selectedProject && selectedProject.zoom ? selectedProject.zoom : defaultZoom;
      mapInstance.current.setZoom(newZoom);
    }
  }, [selectedProject]);

  return (
    <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
  );
};

export default Maps;
