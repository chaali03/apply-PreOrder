"use client";

import { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapPreviewProps {
  latitude: number;
  longitude: number;
  address: string;
}

export default function MapPreview({ latitude, longitude, address }: MapPreviewProps) {
  useEffect(() => {
    // Create map
    const map = L.map('location-map').setView([latitude, longitude], 16);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Fix default marker icon issue with webpack
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });

    // Add marker
    const marker = L.marker([latitude, longitude]).addTo(map);
    marker.bindPopup(`<b>Lokasi Anda</b><br>${address}`).openPopup();

    // Cleanup
    return () => {
      map.remove();
    };
  }, [latitude, longitude, address]);

  return (
    <div style={{
      marginTop: '12px',
      border: '2px solid #FF6B35',
      borderRadius: '8px',
      overflow: 'hidden',
      background: 'white'
    }}>
      <div style={{
        padding: '12px',
        background: '#FFF5F2',
        borderBottom: '2px solid #FF6B35',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a' }}>
          Preview Lokasi
        </span>
      </div>
      <div 
        id="location-map" 
        style={{ 
          height: '250px',
          width: '100%'
        }}
      />
      <div style={{
        padding: '12px',
        background: '#f9fafb',
        borderTop: '1px solid #e5e7eb'
      }}>
        <p style={{ 
          margin: 0, 
          fontSize: '12px', 
          color: '#6b7280',
          lineHeight: '1.5'
        }}>
          📍 {address}
        </p>
        <p style={{ 
          margin: '4px 0 0 0', 
          fontSize: '11px', 
          color: '#9ca3af'
        }}>
          Koordinat: {latitude.toFixed(6)}, {longitude.toFixed(6)}
        </p>
      </div>
    </div>
  );
}
