'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import Link from 'next/link';
import { geocodePostcodes } from '@/lib/geocode';

interface Tool {
  id: string;
  name: string;
  category: string;
  owner_id: string;
  postcode: string;
  available: boolean;
  tool_value: number;
  daily_rate?: number;
  image_url?: string;
  latitude?: number;
  longitude?: number;
}

interface ToolMapProps {
  tools: Tool[];
  initialCenter?: { lat: number; lng: number };
}

export default function ToolMap({ tools, initialCenter }: ToolMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [toolsWithCoords, setToolsWithCoords] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get all unique postcodes and geocode them
    const uniquePostcodes = [...new Set(tools.map((t) => t.postcode))];
    
    geocodePostcodes(uniquePostcodes).then((coords) => {
      const toolsWithCoordinates = tools.map((tool) => {
        if (tool.latitude && tool.longitude) {
          return tool;
        }
        const geocoded = coords[tool.postcode.toUpperCase()];
        if (geocoded) {
          return {
            ...tool,
            latitude: geocoded.lat,
            longitude: geocoded.lon,
          };
        }
        return tool;
      });
      setToolsWithCoords(toolsWithCoordinates);
      setLoading(false);
    });
  }, [tools]);

  useEffect(() => {
    if (!mapContainer.current || map.current || loading) return;

    // Set Mapbox token
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

    if (!mapboxgl.accessToken) {
      console.warn('Mapbox token not configured');
      return;
    }

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [initialCenter?.lng ?? -2.0, initialCenter?.lat ?? 53.4],
        zoom: initialCenter ? 12 : 6,
      });

      // Add tools as markers
      toolsWithCoords.forEach((tool) => {
        if (tool.latitude && tool.longitude) {
          const el = document.createElement('div');
          el.className = `w-8 h-8 rounded-full flex items-center justify-center text-sm cursor-pointer transition-transform hover:scale-110 flex-shrink-0`;
          el.style.backgroundColor = tool.available ? '#10b981' : '#9ca3af';
          el.style.border = '2px solid white';
          el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
          el.textContent = '🔧';

          const popup = new mapboxgl.Popup({ offset: 25, closeButton: true, closeOnClick: false }).setHTML(
            `<div class="p-3 max-w-xs bg-white rounded">
              <h3 class="font-semibold text-sm text-gray-900 mb-1">${tool.name}</h3>
              <p class="text-xs text-gray-600 mb-2">${tool.category}</p>
              <div class="flex items-center justify-between mb-3 gap-2">
                <span class="text-xs font-semibold px-2 py-1 rounded-full ${
                  tool.available
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }">
                  ${tool.available ? '✓ Available' : '✗ Unavailable'}
                </span>
                <span class="text-sm font-bold text-green-600">
                  £${tool.daily_rate || 3}/day
                </span>
              </div>
              <a href="/tools/${tool.id}" class="block w-full text-center text-xs text-blue-600 hover:text-blue-700 font-semibold bg-blue-50 py-2 px-3 rounded">
                View Details →
              </a>
            </div>`
          );

          const marker = new mapboxgl.Marker(el)
            .setLngLat([tool.longitude, tool.latitude])
            .setPopup(popup)
            .addTo(map.current!);

          // Open popup on click
          marker.getElement().addEventListener('click', () => {
            marker.togglePopup();
          });
        }
      });
    } catch (err) {
      console.error('Error initializing map:', err);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [toolsWithCoords, initialCenter, loading]);

  return (
    <div ref={mapContainer} className="w-full h-full" />
  );
}
