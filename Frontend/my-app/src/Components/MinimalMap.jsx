import React, { Component } from 'react';
const GOOGLE_API_KEY = "AIzaSyBIX9afcpqhWoJBu_3ZKe6gNZimOiDcZTM";
class MinimalMap extends Component {
  constructor(props) {
    super(props);
    this.mapRef = React.createRef();
    this.map = null;
    this.overlay = null;
    this.defaultZoom = 15; // Keep default zoom for cases where zoom is not provided
    // *** Store polygon references ***
    this.polygons = [];
  }



  // Dynamically load the Google Maps API
  loadGoogleMapsScript() {
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
  }

  // Extract and validate project coordinates
 
  getProjectCenter() {
    const { selectedProject } = this.props;
    let center = null;
    if (selectedProject && selectedProject.coordinates) {
      const parts = selectedProject.coordinates.split(',');
      if (parts.length === 2) {
        const lat = parseFloat(parts[0].trim());
        const lng = parseFloat(parts[1].trim());
        if (!isNaN(lat) && !isNaN(lng) && isFinite(lat) && isFinite(lng)) {
          center = { lat, lng };
        } else {
          console.error("Parsed coordinates are invalid.");
        }
      } else {
        console.error("Invalid coordinates format. Expected 'lat,lng'.");
      }
    } else {
      console.warn("No project coordinates provided.");
    }
    console.log("Computed center:", center);
    return center;
  }

  // Initialize the map using the provided center and zoom level
  initializeMap(center, zoom) {
    if (!center) {
      console.error("Cannot initialize map without valid coordinates.");
      return;
    }

    this.map = new window.google.maps.Map(this.mapRef.current, {
      center: center,
      zoom: zoom,
      mapTypeId: 'satellite'
    });
    console.log("Map initialized with center:", center, "and zoom:", zoom);
  }

  async loadTileJSON(tileUrl) {
    try {
      const response = await fetch(tileUrl);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      console.log("Fetched TileJSON:", data);
      return data;
    } catch (error) {
      console.error("Error fetching TileJSON:", error);
      return null;
    }
  }
  
  

  // New method: Add a ground overlay using TileUrtileUrl data
  addGroundOverlay(tileUrl) {
    if (!this.map || !tileUrl) {
      console.error("Cannot add overlay without a valid map or tile UrtileUrl.");
      return;
    }
    // Extract and validate bounds from TileJSON
  const boundsArr = tileUrl.bounds; // [west, south, east, north]
  if (!boundsArr || boundsArr.length !== 4) {
    console.error("Invalid bounds in TileJSON:", boundsArr);
    return;
  }
  const west = parseFloat(boundsArr[0]);
  const south = parseFloat(boundsArr[1]);
  const east = parseFloat(boundsArr[2]);
  const north = parseFloat(boundsArr[3]);
  if (isNaN(west) || isNaN(south) || isNaN(east) || isNaN(north)) {
    console.error("Bounds contain invalid numbers:", boundsArr);
    return;
  }
  
  
  const sw = new window.google.maps.LatLng(south, west);
  const ne = new window.google.maps.LatLng(north, east);
  const overlayBounds = new window.google.maps.LatLngBounds(sw, ne);
    // Determine the image URL.
    // If tileUrl.tiles[0] still has placeholders, you need to substitute them.
    // For example, if you want to use the zoom level provided in tileUrl.center[2]:
    let overlayUrl = tileUrl.tiles[0]; // e.g. "http://localhost:8080/data/Khalkhambh_tile/{z}/{x}/{y}.png"
    if (overlayUrl.indexOf("{z}") !== -1) {
      // Use the provided center zoom or minzoom (adjust as needed)
      const zoomLevel = tileUrl.center && tileUrl.center[2] ? tileUrl.center[2] : tileUrl.minzoom;
      // Compute tile coordinates for the center.
      // Standard Slippy Map conversion:
      const centerLng = tileUrl.center[0];
      const centerLat = tileUrl.center[1];
      const n = Math.pow(2, zoomLevel);
      const xTile = Math.floor((centerLng + 180) / 360 * n);
      const latRad = centerLat * Math.PI / 180;
      const yTile = Math.floor((1 - Math.log(Math.tan(latRad) + 1/Math.cos(latRad)) / Math.PI) / 2 * n);
      overlayUrl = overlayUrl
        .replace("{z}", zoomLevel)
        .replace("{x}", xTile)
        .replace("{y}", yTile);
    }

    console.log("GroundOverlay URL:", overlayUrl);
    console.log("GroundOverlay bounds:", overlayBounds);

    // Create the ground overlay
    const groundOverlay = new window.google.maps.GroundOverlay(overlayUrl, overlayBounds, { opacity: 1 });
    groundOverlay.setMap(this.map);
    // Save reference if you need to remove it later
    this.groundOverlay = groundOverlay;
  }

  // Draw polygons from selectedSurvey.polygonData
  drawPolygons() {
    // Remove old polygons
    this.polygons.forEach((poly) => poly.setMap(null));
    this.polygons = [];

    const { selectedSurvey } = this.props;
    if (!this.map || !selectedSurvey?.polygonData) return;

    // Create new polygons
    selectedSurvey.polygonData.forEach((defect) => {
      // Each 'defect' might look like { Defect, polygonPath, center }
      const polygon = new window.google.maps.Polygon({
        paths: defect.polygonPath,
        strokeColor: "#FF0000",
        strokeOpacity: 1.0,
        strokeWeight: 2,
        fillColor: "#FF0000",
        fillOpacity: 0.3,
      });
      polygon.setMap(this.map);
      this.polygons.push(polygon);

      // (Optional) Add a marker at the center
      // new window.google.maps.Marker({
      //   position: defect.center,
      //   map: this.map,
      //   title: defect.Defect,
      // });
    });
  }


  componentDidMount() {
    this.loadGoogleMapsScript()
      .then(() => {
        const center = this.getProjectCenter();
        if (center) {
          const zoom = this.defaultZoom;
          this.initializeMap(center, zoom);
        } else {
          console.error("No valid coordinates available to initialize the map.");
        }
      })
      .catch((error) => {
        console.error("Error loading Google Maps API:", error);
      });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.selectedProject !== this.props.selectedProject && this.map) {
      const center = this.getProjectCenter();
      if (center) {
        const zoom = this.defaultZoom;
        console.log("Re-centering map to:", center, "with zoom:", zoom);
        this.map.setCenter(center);
        this.map.setZoom(zoom);
        // Trigger resize event to ensure proper rendering
        window.google.maps.event.trigger(this.map, 'resize');
        this.map.setCenter(center); // Re-center again after resize
  
        // If a survey is selected, fetch its TileJSON and add the overlay
        if (this.props.selectedSurvey?.tileUrl) {
          this.loadTileJSON(this.props.selectedSurvey.tileUrl)
            .then(tileJson => {
              if (tileJson) {
                // Remove previous overlay if necessary
                if (this.groundOverlay) {
                  this.groundOverlay.setMap(null);
                }
                this.addGroundOverlay(tileJson);
              }
            })
            .catch(error => console.error("Error loading TileJSON:", error));
        }
      } else {
        console.error("No valid coordinates available to re-center the map.");
      }
    }
  
    // If the selected survey changes, update the overlay
    if (prevProps.selectedSurvey !== this.props.selectedSurvey && this.map) {
      console.log("Selected survey:", this.props.selectedSurvey);
      if (this.props.selectedSurvey?.tileUrl) {
        this.loadTileJSON(this.props.selectedSurvey.tileUrl)
          .then(tileJson => {
            if (tileJson) {
              if (this.groundOverlay) {
                this.groundOverlay.setMap(null);
              }
              this.addGroundOverlay(tileJson);
            }
          })
          .catch(error => console.error("Error loading TileJSON:", error));
      } else {
        console.warn("No tile URL available to add overlay.");
      }
    }
     // 3) If polygonData changed, re-draw polygons
     const oldPolygons = prevProps.selectedSurvey?.polygonData;
     const newPolygons = this.props.selectedSurvey?.polygonData;
     if (oldPolygons !== newPolygons) {
       this.drawPolygons();
     }
  }
  
  render() {
    const center = this.getProjectCenter();

    // Render a placeholder if no valid coordinates are available
    if (!center) {
      return (
        <div style={{ width: "100%", height: "650px", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <p>No valid project coordinates available.</p>
        </div>
      );
    }

    return (
      <div ref={this.mapRef} style={{ width: "100%", height: "650px" }} />
    );
  }
}

export default MinimalMap;