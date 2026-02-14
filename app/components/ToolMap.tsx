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

interface ToolRequest {
  id: string;
  tool_name: string;
  category: string;
  postcode: string;
  description?: string;
  upvote_count: number;
  status: string;
  created_at: string;
  latitude?: number;
  longitude?: number;
}

interface ToolMapProps {
  tools: Tool[];
  toolRequests?: ToolRequest[];
  initialCenter?: { lat: number; lng: number };
}

export default function ToolMap({ tools, toolRequests = [], initialCenter }: ToolMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [toolsWithCoords, setToolsWithCoords] = useState<Tool[]>([]);
  const [requestsWithCoords, setRequestsWithCoords] = useState<ToolRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get all unique postcodes from tools AND requests and geocode them
    const toolPostcodes = tools.map((t) => t.postcode);
    const requestPostcodes = toolRequests.map((r) => r.postcode);
    const uniquePostcodes = [...new Set([...toolPostcodes, ...requestPostcodes])];
    
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

      const requestsWithCoordinates = toolRequests.map((req) => {
        const geocoded = coords[req.postcode.toUpperCase()];
        if (geocoded) {
          return {
            ...req,
            latitude: geocoded.lat,
            longitude: geocoded.lon,
          };
        }
        return req;
      });

      setToolsWithCoords(toolsWithCoordinates);
      setRequestsWithCoords(requestsWithCoordinates);
      setLoading(false);
    });
  }, [tools, toolRequests]);

  useEffect(() => {
    if (!mapContainer.current || map.current || loading) return;

    // Set Mapbox token
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

    if (!mapboxgl.accessToken) {
      console.warn('Mapbox token not configured');
      return;
    }

    try {
      // Calculate center point from all tools and requests
      const toolsWithCoordinatesFiltered = toolsWithCoords.filter(t => t.latitude && t.longitude);
      const requestsWithCoordinatesFiltered = requestsWithCoords.filter(r => r.latitude && r.longitude);
      const allPoints = [
        ...toolsWithCoordinatesFiltered.map(t => ({ lat: t.latitude!, lng: t.longitude! })),
        ...requestsWithCoordinatesFiltered.map(r => ({ lat: r.latitude!, lng: r.longitude! })),
      ];
      let defaultCenter = [initialCenter?.lng ?? 1.2977, initialCenter?.lat ?? 52.6286] as [number, number];
      let defaultZoom = initialCenter ? 12 : 10;

      // Create map
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: defaultCenter,
        zoom: defaultZoom,
      });

      // If we have multiple points and no initial center, fit bounds to show all points
      if (allPoints.length > 1 && !initialCenter) {
        const bounds = allPoints.reduce(
          (acc, point) => {
            return {
              minLng: Math.min(acc.minLng, point.lng),
              maxLng: Math.max(acc.maxLng, point.lng),
              minLat: Math.min(acc.minLat, point.lat),
              maxLat: Math.max(acc.maxLat, point.lat),
            };
          },
          {
            minLng: allPoints[0].lng,
            maxLng: allPoints[0].lng,
            minLat: allPoints[0].lat,
            maxLat: allPoints[0].lat,
          }
        );

        map.current.fitBounds(
          [
            [bounds.minLng, bounds.minLat],
            [bounds.maxLng, bounds.maxLat],
          ],
          { padding: 80 }
        );
      }

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

        const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat([mainTool.longitude!, mainTool.latitude!])
          .setPopup(popup)
          .addTo(map.current!);

        // Add click listener
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          marker.togglePopup();
        });
      });

      // Add request markers (orange)
      requestsWithCoords.forEach((req) => {
        if (!req.latitude || !req.longitude) return;

        console.log(`[MAP] Request "${req.tool_name}" - Postcode: ${req.postcode}, Lat: ${req.latitude}, Lng: ${req.longitude}`);

        const el = document.createElement('div');
        el.style.width = '40px';
        el.style.height = '40px';
        el.style.borderRadius = '50%';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.fontSize = '20px';
        el.style.cursor = 'pointer';
        el.style.backgroundColor = '#f97316';
        el.style.border = '3px solid white';
        el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        el.style.pointerEvents = 'auto';
        el.style.position = 'relative';
        el.textContent = '📢';

        // Upvote badge if > 0
        if (req.upvote_count > 0) {
          const badge = document.createElement('div');
          badge.style.position = 'absolute';
          badge.style.top = '-8px';
          badge.style.right = '-8px';
          badge.style.width = '22px';
          badge.style.height = '22px';
          badge.style.borderRadius = '50%';
          badge.style.backgroundColor = '#f97316';
          badge.style.color = 'white';
          badge.style.display = 'flex';
          badge.style.alignItems = 'center';
          badge.style.justifyContent = 'center';
          badge.style.fontSize = '11px';
          badge.style.fontWeight = 'bold';
          badge.style.border = '2px solid white';
          badge.textContent = `👍${req.upvote_count}`;
          el.appendChild(badge);
        }

        const popupHtml = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 12px; max-width: 260px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
            <span style="font-size: 10px; font-weight: 600; padding: 3px 8px; border-radius: 10px; background-color: #fff7ed; color: #c2410c; border: 1px solid #fed7aa;">📢 REQUESTED</span>
          </div>
          <h4 style="margin: 0 0 4px 0; font-weight: 700; font-size: 14px; color: #111;">${req.tool_name}</h4>
          <p style="margin: 0 0 6px 0; font-size: 11px; color: #666;">${req.category}</p>
          ${req.description ? `<p style="margin: 0 0 8px 0; font-size: 12px; color: #444; font-style: italic;">"${req.description}"</p>` : ''}
          <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 11px; color: #666;">📍 ${req.postcode}</span>
            <span style="font-size: 11px; color: #f97316; font-weight: 600;">👍 ${req.upvote_count} ${req.upvote_count === 1 ? 'vote' : 'votes'}</span>
          </div>
          <a href="/dashboard" style="display: block; text-align: center; font-size: 11px; color: #fff; text-decoration: none; font-weight: 600; background-color: #f97316; padding: 6px; border-radius: 3px; border: none; cursor: pointer;">
            Got this tool? List it! →
          </a>
        </div>`;

        const popup = new mapboxgl.Popup({ offset: 25, closeButton: true, closeOnClick: false }).setHTML(popupHtml);

        const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat([req.longitude!, req.latitude!])
          .setPopup(popup)
          .addTo(map.current!);

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
  }, [toolsWithCoords, requestsWithCoords, initialCenter, loading]);

  return (
    <div ref={mapContainer} className="w-full h-full" />
  );
}
