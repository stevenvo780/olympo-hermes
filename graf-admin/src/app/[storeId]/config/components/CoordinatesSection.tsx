'use client'
import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { Form, Button } from 'react-bootstrap';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { Coordinates } from '@/types';

const DEFAULT_LAT = 6.226885670017665;
const DEFAULT_LNG = -75.58341651733735;

const containerStyle = {
  width: '100%',
  height: '300px'
};

type CoordinatesSectionProps = {
  coordinates: Coordinates;
  handleCoordinatesChange: (field: keyof Coordinates, value: number) => void;
  handleFullCoordinatesChange?: (coords: Coordinates) => void;
};

const CoordinatesSection: React.FC<CoordinatesSectionProps> = ({ 
  coordinates, 
  handleCoordinatesChange,
  handleFullCoordinatesChange 
}) => {
  const initialCoordinates = {
    lat: typeof coordinates?.lat === 'number' && !isNaN(coordinates.lat) ? coordinates.lat : DEFAULT_LAT,
    lng: typeof coordinates?.lng === 'number' && !isNaN(coordinates.lng) ? coordinates.lng : DEFAULT_LNG
  };
  
  const [validCoordinates, setValidCoordinates] = useState(initialCoordinates);
  
  useEffect(() => {
    setValidCoordinates((prev) => ({
      lat:
        typeof coordinates?.lat === 'number' && !isNaN(coordinates.lat)
          ? coordinates.lat
          : prev.lat,
      lng:
        typeof coordinates?.lng === 'number' && !isNaN(coordinates.lng)
          ? coordinates.lng
          : prev.lng
    }));
  }, [coordinates?.lat, coordinates?.lng]);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY || ''
  });

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      
      const newCoords = { lat, lng };
      setValidCoordinates(newCoords);
      
      if (handleFullCoordinatesChange) {
        handleFullCoordinatesChange(newCoords);
      } else {
        handleCoordinatesChange('lat', lat);
        handleCoordinatesChange('lng', lng);
      }
    }
  }, [handleCoordinatesChange, handleFullCoordinatesChange]);

  const handleInputChange = (field: keyof Coordinates, value: string) => {
    const numValue = parseFloat(value);
    
    if (!isNaN(numValue)) {
      const newCoords = {
        ...validCoordinates,
        [field]: numValue
      };
      
      setValidCoordinates(newCoords);
      
      if (handleFullCoordinatesChange && field === 'lat') {
        handleFullCoordinatesChange(newCoords);
      } else if (handleFullCoordinatesChange && field === 'lng') {
        handleFullCoordinatesChange(newCoords);
      } else {
        handleCoordinatesChange(field, numValue);
      }
    }
  };

  const handleCenterMap = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          const newCoords = { lat, lng };
          setValidCoordinates(newCoords);
          
          if (handleFullCoordinatesChange) {
            handleFullCoordinatesChange(newCoords);
          } else {
            handleCoordinatesChange('lat', lat);
            handleCoordinatesChange('lng', lng);
          }
        },
        () => {
          const defaultCoords = { lat: DEFAULT_LAT, lng: DEFAULT_LNG };
          setValidCoordinates(defaultCoords);
          
          if (handleFullCoordinatesChange) {
            handleFullCoordinatesChange(defaultCoords);
          } else {
            handleCoordinatesChange('lat', DEFAULT_LAT);
            handleCoordinatesChange('lng', DEFAULT_LNG);
          }
        }
      );
    }
  };

  const center = useMemo(() => ({
    lat: validCoordinates.lat,
    lng: validCoordinates.lng
  }), [validCoordinates.lat, validCoordinates.lng]);

  return (
    <fieldset className="mb-4">
      <legend>Coordenadas</legend>
      
      <div className="row mb-3">
        <div className="col-md-6">
          <Form.Group>
            <Form.Label>Latitud</Form.Label>
            <Form.Control
              type="number"
              step="0.000001"
              value={validCoordinates.lat}
              onChange={(e) => handleInputChange('lat', e.target.value)}
            />
          </Form.Group>
        </div>
        <div className="col-md-6">
          <Form.Group>
            <Form.Label>Longitud</Form.Label>
            <Form.Control
              type="number"
              step="0.000001"
              value={validCoordinates.lng}
              onChange={(e) => handleInputChange('lng', e.target.value)}
            />
          </Form.Group>
        </div>
      </div>
      
      <div className="d-flex justify-content-end mb-3">
        <Button 
          variant="outline-primary" 
          size="sm"
          onClick={handleCenterMap}
        >
          Usar mi ubicación actual
        </Button>
      </div>
      
      <div style={{ height: '300px', width: '100%' }}>
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={13}
            onClick={handleMapClick}
          >
            <Marker position={center} />
          </GoogleMap>
        ) : (
          <div className="d-flex justify-content-center align-items-center h-100 bg-light">
            <div className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando mapa...</span>
              </div>
              <p className="mt-2">Cargando mapa...</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-2 text-muted small">
        <p>Haz clic en el mapa para seleccionar una ubicación o introduce manualmente las coordenadas.</p>
      </div>
    </fieldset>
  );
};

export default CoordinatesSection;
