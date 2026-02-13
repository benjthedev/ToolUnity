'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import Link from 'next/link';

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

const postcodeToCoordinates: Record<string, [number, number]> = {
  'SW1A': [-0.1264, 51.5007], // Westminster
  'W1A': [-0.1436, 51.5155], // West End
  'EC1A': [-0.0955, 51.5185], // City of London
  'N1': [-0.1087, 51.5329], // Islington
  'E1': [-0.0759, 51.5160], // Tower Hamlets
  'SE1': [-0.1008, 51.5050], // Southwark
  'SW1': [-0.1437, 51.4914], // Chelsea
  'W1': [-0.1456, 51.5142], // Mayfair
  'EC1': [-0.0955, 51.5185], // Clerkenwell
  'N1C': [-0.1087, 51.5329], // Islington
};

export default function ToolMap({ tools, initialCenter }: ToolMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

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
        center: [initialCenter?.lng ?? -0.1276, initialCenter?.lat ?? 51.5074],
        zoom: 12,
      });

      // Add tools as markers
      tools.forEach((tool) => {
        let latitude = tool.latitude;
        let longitude = tool.longitude;

        if (!latitude || !longitude) {
          const postcode = tool.postcode ? tool.postcode.toUpperCase() : '';
          const coords = postcodeToCoordinates[postcode];
          if (coords) {
            longitude = coords[0];
            latitude = coords[1];
          }
        }

        if (latitude && longitude) {
          const el = document.createElement('div');
          el.className = `w-7 h-7 rounded-full flex items-center justify-center text-lg cursor-pointer transition-transform hover:scale-110 ${
            tool.available
              ? 'bg-green-500 border-2 border-white shadow-lg'
              : 'bg-gray-400 border-2 border-white shadow-lg'
          }`;
          el.textContent = '🔧';

          const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
            `<div class="p-3 max-w-xs">
              <h3 class="font-semibold text-sm text-gray-900 mb-1">${tool.name}</h3>
              <p class="text-xs text-gray-600 mb-2">${tool.category}</p>
              <div class="flex items-center justify-between mb-3">
                <span class="text-xs font-semibold px-2 py-1 rounded-full ${
                  tool.available
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }">
                  ${tool.available ? 'Available' : 'Unavailable'}
                </span>
                <span class="text-sm font-bold text-green-600">
                  £${tool.daily_rate || 3}/day
                </span>
              </div>
              <a href="/tools/${tool.id}" class="text-xs text-blue-600 hover:text-blue-700 font-semibold inline-block">
                View Details →
              </a>
            </div>`
          );

          new mapboxgl.Marker(el).setLngLat([longitude, latitude]).setPopup(popup).addTo(map.current!);
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
  }, [tools, initialCenter]);

  return <div ref={mapContainer} className="w-full h-full" />;
}
