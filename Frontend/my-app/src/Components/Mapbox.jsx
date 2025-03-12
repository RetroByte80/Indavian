import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken =
  "pk.eyJ1IjoiYXJ5YW4xMjA5IiwiYSI6ImNtMWc5OXg2bjAxN2EyanMzcjhhem52bjAifQ.2uNvC1rHQhrNc01kmoKZfw";
const BASE_URL = "https://jrx1jscm-8000.inc1.devtunnels.ms";
const Mapbox = ({ ortho_image, markers }) => {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null); // Reference for the map container
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [selectedDefect, setSelectedDefect] = useState(null); // State for selected defect

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
    document.addEventListener("webkitfullscreenchange", handleFullScreenChange); // Safari
    document.addEventListener("msfullscreenchange", handleFullScreenChange); // IE/Edge

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

  useEffect(() => {
    // if (!coordinates) {
    //   console.error('No coordinates provided');
    //   return;
    // }

    // // Split the coordinates string by semicolon and create an array of [lng, lat] pairs
    // const formattedCoordinates = coordinates.split(';').map(coord => {
    //   const [lng, lat] = coord.split(',').map(val => parseFloat(val.trim()));
    //   return [lng, lat];
    // });

    // // Check if we have exactly 4 corner coordinates
    // if (formattedCoordinates.length !== 4) {
    //   console.error('Invalid number of coordinates. Expected 4 corners.');
    //   return;
    // }

    const map = new mapboxgl.Map({
      container: mapContainerRef.current, // The ID of the HTML element to mount the map
      style: "mapbox://styles/mapbox/satellite-v9",
      center:
        markers && markers.length > 0
          ? [markers[0].Longitude, markers[0].Latitude]
          : [0, 0], // Use location to center the map
      zoom: markers && markers.length > 0 ? 16 : 1, // Zoom into the site if there are markers, otherwise world view
    });

    mapRef.current = map; // Store map instance in the ref

    // console.log(`${BASE_URL}/${ortho_image}`);
    // // Add overlay image if imageUrl exists
    // if (ortho_image) {
    //   map.on('load', () => {
    //     map.addSource('overlay', {
    //       type: 'image',
    //       url: `${BASE_URL}/${ortho_image}`, // URL of the image to overlay
    //       coordinates: formattedCoordinates,
    //     });

    //     map.addLayer({
    //       id: 'overlay-layer',
    //       source: 'overlay',
    //       type: 'raster',
    //     });
    //   });
    // }

    // Add custom markers to the map
    // if (Array.isArray(markers) && markers.length > 0) {
    markers.forEach((marker) => {
      // Check if Longitude and Latitude are valid
      if (!marker.Longitude || !marker.Latitude) {
        console.error(`Invalid marker coordinates: ${marker}`);
        return;
      }
      // Create a HTML element for each feature (marker)
      const el = document.createElement("div");
      el.className = "marker"; // Add custom styling class for markers if needed
      el.style.backgroundImage =
        "url(https://cdn-icons-png.flaticon.com/128/25/25615.png)";
      el.style.width = "15px"; // Customize the marker size
      el.style.height = "15px";
      el.style.backgroundSize = "contain";
      el.style.backgroundColor = "transparent"; // Customize marker appearance

      // Add the marker to the map
      new mapboxgl.Marker(el)
        .setLngLat([marker.Longitude, marker.Latitude]) // Marker coordinates
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }) // Add popup for each marker
            .setHTML(
              `<h3>${marker.ClassName}, ${marker.Latitude}, ${marker.Longitude}</h3>` // Customize the popup content
            )
        )
        .addTo(map);
    });

    mapRef.current.addControl(new mapboxgl.FullscreenControl());

    return () => map.remove(); // Clean up the map on component unmount
  }, [ortho_image, markers]);

  return (
    <div
      style={{ position: "relative", height: "100%" }}
      // id="map"
      ref={mapContainerRef}
    >
      {/* <div
        ref={mapContainerRef} // Reference for full-screen functionality
        id="map"
        style={{
          width: isFullScreen ? '100vw' : '100%',
          height: isFullScreen ? '100vh' : '400px',
          position: isFullScreen ? 'fixed' : 'relative',
          top: isFullScreen ? 0 : 'auto',
          left: isFullScreen ? 0 : 'auto',
          zIndex: isFullScreen ? 1000 : 0
        }}
      />

<button
        onClick={toggleFullScreen}
        style={{
          position: 'absolute',
          bottom: '10px',
          right: '10px',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          zIndex: 1001
        }}
      >
        <img
          src={isFullScreen ? 'https://cdn-icons-png.flaticon.com/128/10102/10102564.png' : 'https://cdn-icons-png.flaticon.com/128/17366/17366790.png'}
          alt={isFullScreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          style={{ width: '40px', height: '40px' }} // Adjust size as needed
        />
      </button>

      {/* Show 'X' button only in full-screen */}
      {/* <button
          onClick={toggleFullScreen}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            backgroundColor: '#fff',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            cursor: 'pointer',
            zIndex: 1001,
            fontSize: '18px',
            fontWeight: 'bold'
          }}
        >
            <img
            src="https://cdn-icons-png.flaticon.com/128/10102/10102564.png" // Replace with your exit image URL
            alt="Exit Fullscreen"
            style={{ width: '40px', height: '40px' }} // Adjust size as needed
          />
        </button> */}
      {isFullScreen && (
        <>
          {/* Left Sidebar for defect counts */}
          <div
            style={{
              position: "fixed",
              top: "0",
              left: "0",
              width: "250px",
              height: "100%",
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              color: "#fff",
              padding: "10px",
              zIndex: 1001,
              overflowY: "auto",
            }}
          >
            <h2>Defects</h2>
            <ul>
              {staticDefectData.map((defect, index) => (
                <li key={index} style={{ color: defect.color }}>
                  {defect.type}: {defect.count}
                </li>
              ))}
            </ul>
          </div>

          {/* Right Sidebar for defect details */}
          <div
            style={{
              position: "fixed",
              top: "0",
              right: "0",
              width: "300px",
              height: "100%",
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              color: "#fff",
              padding: "10px",
              zIndex: 1001,
              overflowY: "auto",
            }}
          >
            <h2>Defect Details</h2>
            <p>
              <strong>Name:</strong> {sampleDefectDetails.name}
            </p>
            <p>
              <strong>Location:</strong> {sampleDefectDetails.location}
            </p>
            <p>
              <strong>Severity:</strong> {sampleDefectDetails.severity}
            </p>
            <p>
              <strong>Coordinates:</strong> {sampleDefectDetails.coordinates}
            </p>
            <p>
              <strong>Description:</strong> {sampleDefectDetails.description}
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default Mapbox;
