# Live Tracking - Map Integration Guide

## Map Library Options

### 1. Google Maps (Recommended for production)
**Pros:**
- Most accurate, widely used
- Real-time traffic
- Detailed street data
- Notifications when close

**Cons:**
- Requires API key
- Costs money ($0.007 per request)
- Setup complexity

### 2. Mapbox (Best visual quality)
**Pros:**
- Beautiful maps
- Excellent mobile support
- Good free tier (50,000 requests/month)
- Great documentation

**Cons:**
- API key required
- Slightly more complex setup

### 3. Leaflet + OpenStreetMap (Free & Simple)
**Pros:**
- Completely free
- Open source
- Lightweight
- No API key needed
- Great for learning

**Cons:**
- Less detailed than Google Maps
- No traffic data
- Slower tiles

---

## Implementation: Leaflet + OpenStreetMap (Recommended for MVP)

### Step 1: Install packages
```bash
npm install react-leaflet leaflet
```

### Step 2: Update WasherEmergencyWashTracking.jsx

Replace the map placeholder section:

```jsx
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';

// Fix default marker icon
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

L.Marker.prototype.setIcon(DefaultIcon);

// Custom washer marker (blue)
const WasherIcon = L.icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxOCIgZmlsbD0iIzMzNjZjYyIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
  tooltipAnchor: [0, -15],
});

// In your component, replace the map placeholder div:

{currentLocation ? (
  <MapContainer
    center={[currentLocation.latitude, currentLocation.longitude]}
    zoom={15}
    scrollWheelZoom={true}
    style={{ height: '400px', width: '100%' }}
  >
    <TileLayer
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    />
    
    {/* Washer current location */}
    <Marker
      position={[currentLocation.latitude, currentLocation.longitude]}
      icon={WasherIcon}
    >
      <Popup>
        <div>
          <p className="font-bold text-blue-600">Your Current Location</p>
          <p className="text-xs">Lat: {currentLocation.latitude.toFixed(6)}</p>
          <p className="text-xs">Lon: {currentLocation.longitude.toFixed(6)}</p>
          {currentLocation.accuracy && (
            <p className="text-xs text-gray-600">Accuracy: {currentLocation.accuracy.toFixed(1)}m</p>
          )}
        </div>
      </Popup>
      <Tooltip>📍 Your location</Tooltip>
    </Marker>
    
    {/* Customer destination */}
    {request && (
      <Marker position={[request.latitude || 23.1234, request.longitude || 72.5678]}>
        <Popup>
          <div>
            <p className="font-bold text-green-600">Customer Location</p>
            <p className="text-xs">{request.address}</p>
          </div>
        </Popup>
        <Tooltip>🏠 Customer location</Tooltip>
      </Marker>
    )}
  </MapContainer>
) : (
  <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
    <p className="text-gray-600">Enable location to see map</p>
  </div>
)}
```

### Step 3: Update CustomerEmergencyWashLiveTracking.jsx

```jsx
import { MapContainer, TileLayer, Marker, Popup, Tooltip, Polyline } from 'react-leaflet';
import L from 'leaflet';

const WasherIcon = L.icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxOCIgZmlsbD0iIzMzNjZjYyIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

// In your component:

{tracking && tracking.status === 'on_the_way' ? (
  <MapContainer
    center={[tracking.latitude, tracking.longitude]}
    zoom={15}
    scrollWheelZoom={true}
    style={{ height: '400px', width: '100%' }}
  >
    <TileLayer
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    />
    
    {/* Washer current location (moving) */}
    <Marker
      position={[tracking.latitude, tracking.longitude]}
      icon={WasherIcon}
    >
      <Popup>
        <div>
          <p className="font-bold text-blue-600">Washer Location</p>
          <p className="text-xs">Distance: {getDistance(request.latitude, request.longitude, tracking.latitude, tracking.longitude).toFixed(2)} km</p>
          {tracking.speed && (
            <p className="text-xs">Speed: {(tracking.speed * 3.6).toFixed(1)} km/h</p>
          )}
        </div>
      </Popup>
      <Tooltip>🚗 Washer (live)</Tooltip>
    </Marker>
    
    {/* Customer location (fixed) */}
    <Marker position={[request.latitude || 23.1234, request.longitude || 72.5678]}>
      <Popup>
        <div>
          <p className="font-bold text-green-600">Your Location</p>
          <p className="text-xs">{request.address}</p>
        </div>
      </Popup>
      <Tooltip>🏠 Your location</Tooltip>
    </Marker>
    
    {/* Draw line between washer and customer */}
    <Polyline
      positions={[
        [tracking.latitude, tracking.longitude],
        [request.latitude || 23.1234, request.longitude || 72.5678]
      ]}
      color="blue"
      weight={2}
      opacity={0.7}
      dashArray="5, 5"
    />
  </MapContainer>
) : (
  <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
    <p className="text-gray-600">Map appears when washer starts tracking</p>
  </div>
)}
```

### Step 4: Add distance calculation utility

Create `frontend/src/utils/geoUtils.js`:

```javascript
/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Washer latitude
 * @param {number} lon1 - Washer longitude
 * @param {number} lat2 - Customer latitude
 * @param {number} lon2 - Customer longitude
 * @returns {number} Distance in kilometers
 */
export function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate estimated time of arrival
 * @param {number} distance - Distance in kilometers
 * @param {number} speed - Speed in m/s
 * @returns {number} ETA in minutes
 */
export function getETA(distance, speed) {
  if (!speed || speed === 0) return null;
  const speedKmh = speed * 3.6; // Convert m/s to km/h
  const hours = distance / speedKmh;
  return Math.round(hours * 60); // Return minutes
}

/**
 * Format coordinates for display
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {string} Formatted coordinate string
 */
export function formatCoordinates(lat, lon) {
  return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
}
```

---

## Implementation: Google Maps

### Step 1: Get API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project
3. Enable Maps JavaScript API & Places API
4. Create API key (Restrict to web applications)
5. Add your domain to allowed origins

### Step 2: Install package
```bash
npm install @react-google-maps/api
```

### Step 3: Use in component

```jsx
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';

const mapContainerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '8px'
};

const mapOptions = {
  zoom: 15,
  mapTypeId: 'roadmap',
  fullscreenControl: true,
};

{tracking && (
  <LoadScript googleMapsApiKey="YOUR_API_KEY">
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={{ lat: tracking.latitude, lng: tracking.longitude }}
      options={mapOptions}
    >
      {/* Washer marker */}
      <Marker
        position={{ lat: tracking.latitude, lng: tracking.longitude }}
        title="Washer Location"
        icon={{
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#3366cc',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
        }}
      />
      
      {/* Customer marker */}
      <Marker
        position={{ lat: request.latitude, lng: request.longitude }}
        title="Your Location"
      />
    </GoogleMap>
  </LoadScript>
)}
```

---

## Implementation: Mapbox

### Step 1: Get access token
1. Sign up at [mapbox.com](https://www.mapbox.com)
2. Get access token from dashboard
3. Set token in environment variable

### Step 2: Install package
```bash
npm install react-map-gl mapbox-gl
```

### Step 3: Use in component

```jsx
import Map, { Marker, Popup } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

{tracking && (
  <Map
    initialViewState={{
      latitude: tracking.latitude,
      longitude: tracking.longitude,
      zoom: 15
    }}
    style={{ width: '100%', height: '400px' }}
    mapStyle="mapbox://styles/mapbox/streets-v12"
    mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
  >
    {/* Washer marker */}
    <Marker
      latitude={tracking.latitude}
      longitude={tracking.longitude}
      anchor="bottom"
      color="blue"
    >
      <Popup>Washer Location</Popup>
    </Marker>
    
    {/* Customer marker */}
    <Marker
      latitude={request.latitude}
      longitude={request.longitude}
      anchor="bottom"
    >
      <Popup>Your Location</Popup>
    </Marker>
  </Map>
)}
```

---

## Comparison Table

| Feature | Leaflet | Google Maps | Mapbox |
|---------|---------|-------------|--------|
| Cost | Free | $0.007/request | Free/month then paid |
| Setup | Easy | Moderate | Moderate |
| Accuracy | Good | Excellent | Good |
| Traffic | No | Yes | Yes |
| Customization | High | Medium | High |
| Mobile Support | Good | Excellent | Excellent |
| Documentation | Good | Excellent | Excellent |
| Learning Curve | Easy | Easy | Moderate |
| Best For | MVP/Learning | Production | Production |

---

## Recommendation

For **MVP (what you have now)**: Use **Leaflet + OpenStreetMap**
- ✅ No API key needed
- ✅ No costs
- ✅ Quick setup
- ✅ Good enough for demo

For **Production**: Use **Google Maps** or **Mapbox**
- ✅ Better accuracy & features
- ✅ Professional UI
- ✅ Traffic data
- ✅ Production support

Start with Leaflet, upgrade to Google Maps later if needed!
