import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  X,
  Menu,
  RadioOff,
  Loader,
} from "lucide-react";
import { useDeviceStore } from "@/store/deviceStore";
import { useMeshtastic } from "@/hooks/useMeshtastic";
import type { MeshNode } from "@/lib/types";

// Helper to create glowing pulsing custom HTML pins for Leaflet
const createCustomMarkerIcon = (isMe: boolean, shortName: string) => {
  const colorClass = isMe
    ? "bg-blue-500 border-white text-white"
    : "bg-emerald-500 border-white text-white";
  const pulseClass = isMe ? "bg-blue-400" : "bg-emerald-400";

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
  const hasMovedRef = useRef(false);

  const [selectedNodeNum, setSelectedNodeNum] = useState<number | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Mount key: forces React to create a fresh DOM element on every mount.
  // This prevents Leaflet state residue from surviving across unmount/remount.
  const [mountKey] = useState(() => Math.random().toString(36).slice(2));

  // Get the user's own node
  const myNode = useMemo(() => {
    if (myNodeNum === null) return null;
    return nodes.get(myNodeNum) ?? null;
  }, [nodes, myNodeNum]);

  // Check if a node has a valid GPS position
  const hasValidPosition = useCallback((node: MeshNode | null): boolean => {
    if (!node?.position) return false;
    const lat = node.position.latitude;
    const lng = node.position.longitude;
    return (
      typeof lat === "number" &&
      typeof lng === "number" &&
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat !== 0 &&
      lng !== 0
    );
  }, []);

  // Get nodes that have valid GPS positions
  const nodesWithPositions = useMemo(() => {
    return Array.from(nodes.values()).filter((node) => hasValidPosition(node));
  }, [nodes, hasValidPosition]);

  // Get nodes that DO NOT have valid GPS positions
  const nodesWithoutPositions = useMemo(() => {
    return Array.from(nodes.values()).filter((node) => !hasValidPosition(node));
  }, [nodes, hasValidPosition]);

  // Compute map center: prioritize user's own GPS, then average of others, then default
  const mapCenter = useMemo((): [number, number] => {
    if (hasValidPosition(myNode)) {
      return [myNode!.position!.latitude, myNode!.position!.longitude];
    }
    if (nodesWithPositions.length === 0) return DEFAULT_CENTER;
    let totalLat = 0;
    let totalLng = 0;
    let validCount = 0;
    nodesWithPositions.forEach((n) => {
      const lat = n.position!.latitude;
      const lng = n.position!.longitude;
      if (
        typeof lat === "number" &&
        typeof lng === "number" &&
        !isNaN(lat) &&
        !isNaN(lng)
      ) {
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
      isNaN(avgLng) ? DEFAULT_CENTER[1] : avgLng,
    ];
  }, [myNode, nodesWithPositions, hasValidPosition]);

  // Initialize Map — runs once on mount, cleanup on unmount
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container || mapRef.current) return;

    // Clean any Leaflet residue from previous mounts
    container.innerHTML = "";

    const map = L.map(container, {
      zoomControl: false,
    }).setView(mapCenter, DEFAULT_ZOOM);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    mapRef.current = map;

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
  }, []); // Run once on mount only

  // Update map view when center changes (only if user hasn't manually panned)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || hasMovedRef.current || nodesWithPositions.length === 0) return;
    map.setView(mapCenter, map.getZoom());
  }, [mapCenter, nodesWithPositions.length]);

  // Listen to dragstart to mark user interaction
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
  }, []);

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
        const marker = markersRef.current[node.nodeNum];
        marker.setLatLng([latitude, longitude]);
        marker.setPopupContent(markerContent);
        marker.setIcon(customIcon);
      } else {
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
  }, [nodesWithPositions, myNodeNum]);

  // Center on a specific node from the sidebar list
  const handleLocateNode = useCallback((node: MeshNode) => {
    if (!mapRef.current || !node.position) return;
    hasMovedRef.current = true;
    setSelectedNodeNum(node.nodeNum);
    mapRef.current.setView(
      [node.position.latitude, node.position.longitude],
      15,
    );
    const marker = markersRef.current[node.nodeNum];
    if (marker) {
      marker.openPopup();
    }
    setMobileSidebarOpen(false);
  }, []);

  if (!isConnected) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-surface-0 p-6 text-center select-none">
        <div className="w-full max-w-sm bg-surface-1 border border-default rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col items-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emergency/10 border border-emergency/20 flex items-center justify-center text-emergency mb-5">
            <RadioOff className="w-7 h-7 sm:w-8 sm:h-8" aria-hidden="true" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-primary mb-2">
            Device Disconnected
          </h2>
          <p className="text-xs sm:text-sm text-secondary mb-6 max-w-xs leading-relaxed">
            You must connect to a Meshtastic device to visualize mesh nodes and GPS coordinates on the map.
          </p>
          <button
            onClick={connect}
            disabled={phase === "scanning" || phase === "connecting"}
            className="w-full touch-target py-2.5 sm:py-3 bg-mesh hover:bg-mesh/90 disabled:opacity-50 text-surface-0 text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-lg shadow-mesh/20 inline-flex items-center justify-center gap-2"
          >
            {phase === "scanning" || phase === "connecting" ? (
              <>
                <Loader className="w-4 h-4 animate-spin" aria-hidden="true" />
                Connecting...
              </>
            ) : (
              "Connect Device"
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex relative bg-surface-0 overflow-hidden select-none">
      {/* Sidebar - Node List (Responsive Sidebar / Mobile Drawer) */}
      <aside
        className={`
          absolute md:relative inset-y-0 left-0 z-20
          w-72 sm:w-80 bg-surface-1 border-r border-default flex flex-col flex-shrink-0 h-full
          transition-transform duration-300 ease-in-out
          ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="p-4 border-b border-subtle flex items-center justify-between bg-surface-1/60 backdrop-blur">
          <div>
            <h2 className="text-md font-bold tracking-tight text-primary flex items-center gap-2">
              Node Directory
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-surface-3 text-secondary font-mono font-medium border border-subtle">
                {nodes.size}
              </span>
            </h2>
            <p className="text-[10px] text-tertiary mt-0.5">
              Available network devices
            </p>
          </div>
          {/* Close button on mobile */}
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="md:hidden touch-target-sm inline-flex items-center justify-center p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-surface-3 transition-colors"
            aria-label="Close node list"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-subtle scrollbar-thin p-2 space-y-2">
          {/* Group 1: Nodes with Location */}
          <div className="space-y-1.5">
            <div className="px-2 py-1 flex items-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-mesh animate-pulse" aria-hidden="true" />
              <span className="text-[10px] text-mesh font-bold uppercase tracking-wider font-mono">
                GPS Position Active ({nodesWithPositions.length})
              </span>
            </div>

            <div className="space-y-1">
              {nodesWithPositions.length === 0 ? (
                <div className="px-3 py-4 text-center border border-dashed border-subtle rounded-xl text-disabled text-xs">
                  No devices plotting coordinates
                </div>
              ) : (
                nodesWithPositions.map((node) => {
                  const isSelected = selectedNodeNum === node.nodeNum;
                  return (
                    <button
                      key={node.nodeNum}
                      onClick={() => handleLocateNode(node)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all flex items-center gap-3 hover:translate-x-0.5 duration-150 ${
                        isSelected
                          ? "bg-mesh/10 border-mesh/30 shadow-lg shadow-mesh/5"
                          : "bg-surface-1/30 hover:bg-surface-1/50 border-transparent"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-mesh/15 flex items-center justify-center text-mesh-light font-bold text-xs flex-shrink-0 border border-mesh/30">
                        {node.shortName.toUpperCase().slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-primary truncate">
                            {node.longName || node.shortName}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[9px] font-mono px-1 rounded bg-surface-1 text-tertiary border border-subtle">
                            {node.nodeNum.toString(16).toUpperCase()}
                          </span>
                          <span className="text-[9px] text-tertiary truncate">
                            {node.role}
                          </span>
                        </div>
                      </div>
                      {node.batteryLevel !== undefined && (
                        <span
                          className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded flex-shrink-0 border ${
                            node.batteryLevel > 50
                              ? "bg-mesh/10 text-mesh-light border-mesh/20"
                              : node.batteryLevel > 20
                              ? "bg-warn/10 text-warn-light border-warn/20"
                              : "bg-emergency/10 text-emergency-light border-emergency/20"
                          }`}
                        >
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
              <span className="w-1.5 h-1.5 rounded-full bg-emergency" aria-hidden="true" />
              <span className="text-[10px] text-emergency font-bold uppercase tracking-wider font-mono">
                GPS Lock Pending ({nodesWithoutPositions.length})
              </span>
            </div>

            <div className="space-y-1">
              {nodesWithoutPositions.length === 0 ? (
                <div className="px-3 py-4 text-center border border-dashed border-subtle rounded-xl text-disabled text-xs">
                  All active devices are mapped
                </div>
              ) : (
                nodesWithoutPositions.map((node) => (
                  <div
                    key={node.nodeNum}
                    className="w-full text-left px-3 py-2.5 rounded-xl border border-transparent bg-surface-1/30 hover:bg-surface-1/40 flex items-center gap-3 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-emergency/15 flex items-center justify-center text-emergency-light font-bold text-xs flex-shrink-0 border border-emergency/20">
                      {node.shortName.toUpperCase().slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-primary truncate">
                        {node.longName || node.shortName}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] font-mono px-1 rounded bg-surface-1 text-tertiary border border-subtle">
                          {node.nodeNum.toString(16).toUpperCase()}
                        </span>
                        <span className="text-[9px] text-emergency font-medium">
                          No Location
                        </span>
                      </div>
                    </div>
                    {node.batteryLevel !== undefined && (
                      <span
                        className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded flex-shrink-0 border ${
                          node.batteryLevel > 50
                            ? "bg-mesh/10 text-mesh-light border-mesh/20"
                            : node.batteryLevel > 20
                            ? "bg-warn/10 text-warn-light border-warn/20"
                            : "bg-emergency/10 text-emergency-light border-emergency/20"
                        }`}
                      >
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
          className="md:hidden fixed inset-0 z-10 bg-black/60 backdrop-blur-sm transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Map Canvas */}
      <div className="flex-1 h-full min-h-[300px] relative z-0">
        {/* Floating Menu Toggle Button (Visible on Mobile only) */}
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="md:hidden absolute top-4 left-4 z-[999] flex items-center justify-center touch-target bg-surface-1/90 border border-default text-primary hover:bg-surface-2 rounded-full shadow-lg transition-all"
          aria-label="Open Node List"
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
        </button>

        {/* mountKey forces React to create a fresh DOM element on every mount */}
        <div
          key={mountKey}
          ref={mapContainerRef}
          className="w-full h-full"
        />
      </div>
    </div>
  );
}
