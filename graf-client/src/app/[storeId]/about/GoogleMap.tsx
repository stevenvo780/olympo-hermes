'use client';

import React from 'react';
import { Spinner } from 'react-bootstrap';
import { useLoadScript, GoogleMap, Marker } from '@react-google-maps/api';

interface MapProps {
  location: {
    lat: number;
    lng: number;
  };
  zoom?: number;
  height?: string;
}

const GoogleMapComponent: React.FC<MapProps> = ({
  location,
  zoom = 15,
  height = '400px',
}) => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  if (!isLoaded) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando mapa...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height }}
      center={location}
      zoom={zoom}
    >
      <Marker position={location} />
    </GoogleMap>
  );
};

export default GoogleMapComponent;
