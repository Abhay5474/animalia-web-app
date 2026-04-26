import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';

// Fix leaflet default icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function DynamicMap({ center, zoom = 13, markers = [], route = null, style={ height: '300px', width: '100%', borderRadius: '12px', zIndex: 1 } }) {
  if (!center) return null;
  return (
    <MapContainer center={center} zoom={zoom} style={style}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
      {markers.map((m, i) => (
        <Marker key={i} position={m.position} icon={m.isRed ? redIcon : new L.Icon.Default()}>
          {m.popup && <Popup>{m.popup}</Popup>}
        </Marker>
      ))}
      {route && <Polyline positions={route} color="red" dashArray="5, 10" />}
    </MapContainer>
  );
}
