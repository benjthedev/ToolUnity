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
      // Calculate center point from all tools
      const toolsWithCoordinatesFiltered = toolsWithCoords.filter(t => t.latitude && t.longitude);
      let defaultCenter = [initialCenter?.lng ?? 1.2977, initialCenter?.lat ?? 52.6286] as [number, number];
      let defaultZoom = initialCenter ? 12 : 10;

      if (toolsWithCoordinatesFiltered.length > 0 && !initialCenter) {
        const avgLng = toolsWithCoordinatesFiltered.reduce((sum, t) => sum + (t.longitude || 0), 0) / toolsWithCoordinatesFiltered.length;
        const avgLat = toolsWithCoordinatesFiltered.reduce((sum, t) => sum + (t.latitude || 0), 0) / toolsWithCoordinatesFiltered.length;
        defaultCenter = [avgLng, avgLat];
      }

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: defaultCenter,
        zoom: defaultZoom,
      });

      // Group tools by location
      const toolsByLocation: Record<string, Tool[]> = {};
      
      toolsWithCoords.forEach((tool) => {
        if (tool.latitude && tool.longitude) {
          const key = `${tool.latitude.toFixed(4)},${tool.longitude.toFixed(4)}`;
          if (!toolsByLocation[key]) {
            toolsByLocation[key] = [];
          }
          toolsByLocation[key].push(tool);
        }
      });

      // Create markers and cluster indicators
      Object.entries(toolsByLocation).forEach(([, toolsAtLocation]) => {
        if (toolsAtLocation.length === 0) return;

        const mainTool = toolsAtLocation[0];
        const isCluster = toolsAtLocation.length > 1;

        // Main marker
        const el = document.createElement('div');
        el.style.width = '40px';
        el.style.height = '40px';
        el.style.borderRadius = '50%';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.fontSize = '20px';
        el.style.cursor = 'pointer';
        el.style.backgroundColor = mainTool.available ? '#10b981' : '#9ca3af';
        el.style.border = '3px solid white';
        el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        el.style.pointerEvents = 'auto';
        el.style.position = 'relative';
        
        if (isCluster) {
          el.textContent = '📦';
          
          // Add cluster badge
          const badge = document.createElement('div');
          badge.style.position = 'absolute';
          badge.style.top = '-8px';
          badge.style.right = '-8px';
          badge.style.width = '24px';
          badge.style.height = '24px';
          badge.style.borderRadius = '50%';
          badge.style.backgroundColor = '#ef4444';
          badge.style.color = 'white';
          badge.style.display = 'flex';
          badge.style.alignItems = 'center';
          badge.style.justifyContent = 'center';
          badge.style.fontSize = '12px';
          badge.style.fontWeight = 'bold';
          badge.style.border = '2px solid white';
          badge.textContent = toolsAtLocation.length.toString();
          el.appendChild(badge);
        } else {
          el.textContent = '🔧';
        }

        // Build popup with all tools at this location
        let popupHtml = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 12px; max-width: 280px;">`;
        
        if (isCluster) {
          popupHtml += `<h3 style="margin: 0 0 10px 0; font-weight: 600; font-size: 14px; color: #111;">${toolsAtLocation.length} Tools Available</h3>`;
          popupHtml += `<div style="max-height: 300px; overflow-y: auto;">`;
        }

        toolsAtLocation.forEach((tool, idx) => {
          popupHtml += `<div style="${idx > 0 ? 'border-top: 1px solid #e5e7eb; margin-top: 10px; padding-top: 10px;' : ''}">
            <h4 style="margin: 0 0 4px 0; font-weight: 600; font-size: 13px; color: #111;">${tool.name}</h4>
            <p style="margin: 0 0 6px 0; font-size: 11px; color: #666;">${tool.category}</p>
            <div style="display: flex; gap: 6px; margin-bottom: 8px; align-items: center;">
              <span style="font-size: 10px; font-weight: 600; padding: 3px 6px; border-radius: 3px; ${
                tool.available
                  ? 'background-color: #d1fae5; color: #065f46;'
                  : 'background-color: #f3f4f6; color: #374151;'
              }">
                ${tool.available ? '✓ Available' : '✗ Unavailable'}
              </span>
              <span style="font-size: 11px; font-weight: 700; color: #059669;">£${tool.daily_rate || 3}/day</span>
            </div>
            <a href="/tools/${tool.id}" style="display: block; text-align: center; font-size: 11px; color: #fff; text-decoration: none; font-weight: 600; background-color: #2563eb; padding: 6px; border-radius: 3px; border: none; cursor: pointer;">
              View →
            </a>
          </div>`;
        });

        if (isCluster) {
          popupHtml += `</div>`;
        }
        
        popupHtml += `</div>`;

        const popup = new mapboxgl.Popup({ offset: 25, closeButton: true, closeOnClick: false }).setHTML(popupHtml);

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([mainTool.longitude!, mainTool.latitude!])
          .setPopup(popup)
          .addTo(map.current!);

        // Add click listener
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          marker.togglePopup();
        });
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
