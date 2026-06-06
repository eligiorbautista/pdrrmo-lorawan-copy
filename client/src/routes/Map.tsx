import { useEffect, useRef, useState, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useDeviceStore } from "@/store/deviceStore";
import { useMeshtastic } from "@/hooks/useMeshtastic";
import type { MeshNode } from "@/lib/types";

// Helper to create glowing pulsing custom HTML pins for Leaflet
const createCustomMarkerIcon = (isMe: boolean, shortName: string) => {
  const colorClass = isMe ? "bg-blue-600 border-white text-white" : "bg-green-600 border-white text-white";
  const pulseClass = isMe ? "bg-blue-400" : "bg-green-400";
  
  return L.divIcon({
    className: "custom-div-icon",
    html: `
      <div class="relative flex items-center justify-center w-8 h-8">
        <span class="animate-ping absolute inline-flex h-7 w-7 rounded-full ${pulseClass} opacity-75"></span>
        <div class="relative flex items-center justify-center rounded-full h-8 w-8 ${colorClass} border-2 text-[10px] font-mono font-bold shadow-lg">
          ${shortName.slice(0, 2).toUpperCase()}
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

// Default center coordinates (Philippines - Central Metro Manila / Laguna area)
const DEFAULT_CENTER: [number, number] = [14.5995, 120.9842];
const DEFAULT_ZOOM = 12;

export function Map() {
  const { isConnected, connect, phase } = useMeshtastic();
  const nodes = useDeviceStore((s) => s.nodes);
  const myNodeNum = useDeviceStore((s) => s.myNodeNum);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<number, L.Marker>>({});

  const [selectedNodeNum, setSelectedNodeNum] = useState<number | null>(null);

  // Get nodes that have valid GPS positions
  const nodesWithPositions = useMemo(() => {
    return Array.from(nodes.values()).filter(
      (node) =>
        node.position &&
        typeof node.position.latitude === "number" &&
        typeof node.position.longitude === "number" &&
        !isNaN(node.position.latitude) &&
        !isNaN(node.position.longitude) &&
        node.position.latitude !== 0 &&
        node.position.longitude !== 0
    );
  }, [nodes]);

  // Get nodes that DO NOT have valid GPS positions
  const nodesWithoutPositions = useMemo(() => {
    return Array.from(nodes.values()).filter(
      (node) =>
        !node.position ||
        typeof node.position.latitude !== "number" ||
        typeof node.position.longitude !== "number" ||
        isNaN(node.position.latitude) ||
        isNaN(node.position.longitude) ||
        node.position.latitude === 0 ||
        node.position.longitude === 0
    );
  }, [nodes]);

  // Compute average center coordinates of nodes with positions
  const mapCenter = useMemo((): [number, number] => {
    if (nodesWithPositions.length === 0) return DEFAULT_CENTER;
    let totalLat = 0;
    let totalLng = 0;
    let validCount = 0;
    nodesWithPositions.forEach((n) => {
      const lat = n.position!.latitude;
      const lng = n.position!.longitude;
      if (typeof lat === "number" && typeof lng === "number" && !isNaN(lat) && !isNaN(lng)) {
        totalLat += lat;
        totalLng += lng;
        validCount++;
      }
    });
    if (validCount === 0) return DEFAULT_CENTER;
    const avgLat = totalLat / validCount;
    const avgLng = totalLng / validCount;
    return [
      isNaN(avgLat) ? DEFAULT_CENTER[0] : avgLat,
      isNaN(avgLng) ? DEFAULT_CENTER[1] : avgLng
    ];
  }, [nodesWithPositions]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false, // Position zoom control at the bottom right later
    }).setView(mapCenter, DEFAULT_ZOOM);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    mapRef.current = map;

    // Force Leaflet to recalculate the container bounds once layout renders
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isConnected]);

  // Update map view when average center changes (only if map view hasn't been moved by user)
  const hasMovedRef = useRef(false);
  useEffect(() => {
    if (mapRef.current && !hasMovedRef.current && nodesWithPositions.length > 0) {
      mapRef.current.setView(mapCenter, mapRef.current.getZoom());
    }
  }, [mapCenter, nodesWithPositions.length]);

  // Listen to dragend/zoomend to mark that user has custom positioned the map
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleUserInteraction = () => {
      hasMovedRef.current = true;
    };

    map.on("dragstart", handleUserInteraction);
    return () => {
      map.off("dragstart", handleUserInteraction);
    };
  }, [mapRef.current]);

  // Update markers dynamically when nodes update
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const activeNodeNums = new Set<number>();

    nodesWithPositions.forEach((node) => {
      const { latitude, longitude } = node.position!;
      activeNodeNums.add(node.nodeNum);

      const markerContent = `
        <div class="text-gray-900 font-sans p-1">
          <div class="font-bold border-b pb-1 mb-1 text-sm flex items-center justify-between gap-3">
            <span>Radio: ${node.longName || node.shortName}</span>
            <span class="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-semibold">${node.role}</span>
          </div>
          <p class="text-xs text-gray-600 mb-1">
            <b>ID:</b> ${node.nodeNum.toString(16).toUpperCase()}
          </p>
          <p class="text-xs text-gray-600 mb-1">
            <b>Coords:</b> ${latitude.toFixed(5)}, ${longitude.toFixed(5)}
          </p>
          ${
            node.batteryLevel !== undefined
              ? `<p class="text-xs text-gray-600 mb-1"><b>Battery:</b> ${node.batteryLevel}%</p>`
              : ""
          }
          ${
            node.lastHeard
              ? `<p class="text-[10px] text-gray-400 mt-2">Last heard: ${node.lastHeard.toLocaleTimeString()}</p>`
              : ""
          }
        </div>
      `;

      const isMe = node.nodeNum === myNodeNum;
      const customIcon = createCustomMarkerIcon(isMe, node.shortName);

      if (markersRef.current[node.nodeNum]) {
        // Update existing marker position, popup, and icon
        const marker = markersRef.current[node.nodeNum];
        marker.setLatLng([latitude, longitude]);
        marker.setPopupContent(markerContent);
        marker.setIcon(customIcon);
      } else {
        // Create new marker with custom icon
        const marker = L.marker([latitude, longitude], { icon: customIcon })
          .addTo(map)
          .bindPopup(markerContent);

        marker.on("click", () => {
          setSelectedNodeNum(node.nodeNum);
        });

        markersRef.current[node.nodeNum] = marker;
      }
    });

    // Remove stale markers (nodes that no longer exist or lost position data)
    Object.keys(markersRef.current).forEach((key) => {
      const nodeNum = Number(key);
      if (!activeNodeNums.has(nodeNum)) {
        markersRef.current[nodeNum].remove();
        delete markersRef.current[nodeNum];
      }
    });
  }, [nodesWithPositions]);

  // Center on a specific node from the sidebar list
  const handleLocateNode = (node: MeshNode) => {
    if (!mapRef.current || !node.position) return;
    hasMovedRef.current = true;
    setSelectedNodeNum(node.nodeNum);
    mapRef.current.setView(
      [node.position.latitude, node.position.longitude],
      15
    );
    const marker = markersRef.current[node.nodeNum];
    if (marker) {
      marker.openPopup();
    }
    // Close sidebar on mobile after choosing a node
    setMobileSidebarOpen(false);
  };

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  if (!isConnected) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gray-950 p-6 text-center select-none">
        <div className="w-full max-w-sm bg-gray-900 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col items-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-600/10 border border-red-600/20 flex items-center justify-center text-red-500 mb-5">
            <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white mb-2">
            Device Disconnected
          </h2>
          <p className="text-xs sm:text-sm text-white/60 mb-6 max-w-xs leading-relaxed">
            You must connect to a Meshtastic device to visualize mesh nodes and GPS coordinates on the map.
          </p>
          <button
            onClick={connect}
            disabled={phase === "scanning" || phase === "connecting"}
            className="w-full py-2.5 sm:py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-lg shadow-green-600/20 cursor-pointer"
          >
            {phase === "scanning" || phase === "connecting"
              ? "Connecting..."
              : "Connect Device"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex relative bg-gray-950 overflow-hidden select-none">
      {/* Sidebar - Node List (Responsive Sidebar / Mobile Drawer) */}
      <aside
        className={`
          absolute lg:relative inset-y-0 left-0 z-20
          w-72 sm:w-80 bg-gray-900 border-r border-white/10 flex flex-col flex-shrink-0 h-full
          transition-transform duration-300 ease-in-out
          ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-gray-900/60 backdrop-blur">
          <div>
            <h2 className="text-md font-bold tracking-tight text-white flex items-center gap-2">
              Node Directory
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/10 text-white/70 font-mono font-medium">
                {nodes.size}
              </span>
            </h2>
            <p className="text-[10px] text-white/40 mt-0.5">
              Available network devices
            </p>
          </div>
          {/* Close button on mobile/tablets */}
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-white/5 scrollbar-thin p-2 space-y-2">
          {/* Group 1: Nodes with Location */}
          <div className="space-y-1.5">
            <div className="px-2 py-1 flex items-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider font-mono">
                GPS Position Active ({nodesWithPositions.length})
              </span>
            </div>
            
            <div className="space-y-1">
              {nodesWithPositions.length === 0 ? (
                <div className="px-3 py-4 text-center border border-dashed border-white/5 rounded-xl text-white/30 text-xs">
                  No devices plotting coordinates
                </div>
              ) : (
                nodesWithPositions.map((node) => {
                  const isSelected = selectedNodeNum === node.nodeNum;
                  return (
                    <button
                      key={node.nodeNum}
                      onClick={() => handleLocateNode(node)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-3 hover:translate-x-0.5 duration-150 ${
                        isSelected
                          ? "bg-emerald-500/10 border-emerald-500/30 shadow-lg shadow-emerald-500/5"
                          : "bg-white/2 hover:bg-white/5 border-transparent"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-400 font-bold text-xs flex-shrink-0 border border-emerald-500/30">
                        {node.shortName.toUpperCase().slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-white truncate">
                            {node.longName || node.shortName}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[9px] font-mono px-1 rounded bg-white/5 text-white/50 border border-white/5">
                            {node.nodeNum.toString(16).toUpperCase()}
                          </span>
                          <span className="text-[9px] text-white/40 truncate">
                            {node.role}
                          </span>
                        </div>
                      </div>
                      {node.batteryLevel !== undefined && (
                        <span className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded flex-shrink-0 border ${
                          node.batteryLevel > 50
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : node.batteryLevel > 20
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}>
                          {node.batteryLevel}%
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Group 2: Nodes without Location */}
          <div className="space-y-1.5 pt-2">
            <div className="px-2 py-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider font-mono">
                GPS Lock Pending ({nodesWithoutPositions.length})
              </span>
            </div>

            <div className="space-y-1">
              {nodesWithoutPositions.length === 0 ? (
                <div className="px-3 py-4 text-center border border-dashed border-white/5 rounded-xl text-white/30 text-xs">
                  All active devices are mapped
                </div>
              ) : (
                nodesWithoutPositions.map((node) => (
                  <div
                    key={node.nodeNum}
                    className="w-full text-left px-3 py-2.5 rounded-xl border border-transparent bg-white/2 hover:bg-white/4 flex items-center gap-3 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-rose-500/15 flex items-center justify-center text-rose-400 font-bold text-xs flex-shrink-0 border border-rose-500/20">
                      {node.shortName.toUpperCase().slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white/90 truncate">
                        {node.longName || node.shortName}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] font-mono px-1 rounded bg-white/5 text-white/40 border border-white/5">
                          {node.nodeNum.toString(16).toUpperCase()}
                        </span>
                        <span className="text-[9px] text-rose-400/80 font-medium">
                          No Location
                        </span>
                      </div>
                    </div>
                    {node.batteryLevel !== undefined && (
                      <span className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded flex-shrink-0 border ${
                        node.batteryLevel > 50
                          ? "bg-green-500/10 text-green-400 border-green-500/20"
                          : node.batteryLevel > 20
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-red-500/10 text-red-400 border-red-500/20"
                      }`}>
                        {node.batteryLevel}%
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="lg:hidden fixed inset-0 z-10 bg-black/60 backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Map Canvas */}
      <div className="flex-1 h-full min-h-[300px] relative z-0">
        {/* Floating Menu Toggle Button (Visible on Mobile/Tablets only) */}
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="lg:hidden absolute top-4 left-4 z-[999] flex items-center justify-center w-10 h-10 bg-gray-900/90 border border-white/10 text-white hover:bg-gray-800 rounded-full shadow-lg transition-all cursor-pointer"
          aria-label="Open Node List"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div ref={mapContainerRef} className="w-full h-full" id="map-container" />
      </div>
    </div>
  );
}
