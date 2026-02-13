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
      const markers: Array<{ marker: mapboxgl.Marker; tool: Tool }> = [];
      
      toolsWithCoords.forEach((tool) => {
        if (tool.latitude && tool.longitude) {
          const el = document.createElement('div');
          el.style.width = '40px';
          el.style.height = '40px';
          el.style.borderRadius = '50%';
          el.style.display = 'flex';
          el.style.alignItems = 'center';
          el.style.justifyContent = 'center';
          el.style.fontSize = '20px';
          el.style.cursor = 'pointer';
          el.style.backgroundColor = tool.available ? '#10b981' : '#9ca3af';
          el.style.border = '3px solid white';
          el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
          el.style.pointerEvents = 'auto';
          el.textContent = '🔧';

          const popupHtml = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 12px; max-width: 240px;">
            <h3 style="margin: 0 0 4px 0; font-weight: 600; font-size: 14px; color: #111;">${tool.name}</h3>
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #666;">${tool.category}</p>
            <div style="display: flex; gap: 8px; margin-bottom: 10px; align-items: center;">
              <span style="font-size: 11px; font-weight: 600; padding: 4px 8px; border-radius: 4px; ${
                tool.available
                  ? 'background-color: #d1fae5; color: #065f46;'
                  : 'background-color: #f3f4f6; color: #374151;'
              }">
                ${tool.available ? '✓ Available' : '✗ Unavailable'}
              </span>
              <span style="font-size: 12px; font-weight: 700; color: #059669;">£${tool.daily_rate || 3}/day</span>
            </div>
            <a href="/tools/${tool.id}" style="display: block; width: 100%; text-align: center; font-size: 12px; color: #2563eb; text-decoration: none; font-weight: 600; background-color: #eff6ff; padding: 8px; border-radius: 4px; border: none; cursor: pointer;">
              View Details →
            </a>
          </div>`;

          const popup = new mapboxgl.Popup({ offset: 25, closeButton: true, closeOnClick: false }).setHTML(popupHtml);

          const marker = new mapboxgl.Marker({ element: el })
            .setLngLat([tool.longitude, tool.latitude])
            .setPopup(popup)
            .addTo(map.current!);

          markers.push({ marker, tool });

          // Add click listener directly to element
          el.addEventListener('click', (e) => {
            e.stopPropagation();
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
