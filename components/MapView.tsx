import React, { useEffect, useRef, useState } from 'react';
import { Trip, StudyGroup } from '../types';
import { MILAN_COORDS, getCoordsWithOffset } from '../constants';
import { useLanguage } from '../i18n';

// Leaflet è caricato via CDN: in ambiente ESM può essere solo su window
const getL = (): any => (typeof window !== 'undefined' ? (window as any).L : undefined);

interface MapViewProps {
    trips: Trip[];
    studyGroups?: StudyGroup[];
    onTripSelect: (tripId: string) => void;
}

export const MapView: React.FC<MapViewProps> = ({ trips, studyGroups = [] }) => {
    const { t } = useLanguage();
    const mapContainerRef = useRef<HTMLDivElement>(null);
        const mapInstanceRef = useRef<any>(null);
    const markersLayerRef = useRef<any>(null);
    const [isLeafletReady, setIsLeafletReady] = useState(false);
    const [containerReady, setContainerReady] = useState(false);

    // 1. Attesa del caricamento di Leaflet (CDN)
    useEffect(() => {
        const checkLeaflet = setInterval(() => {
            if (getL()) {
                clearInterval(checkLeaflet);
                setIsLeafletReady(true);
            }
        }, 100);
        return () => clearInterval(checkLeaflet);
    }, []);

    const updateMarkers = (currentTrips: Trip[], currentGroups: StudyGroup[]) => {
        try {
            const L = getL();
            const map = mapInstanceRef.current;
            const markersLayer = markersLayerRef.current;
            if (!L || !map || !markersLayer) return;

            markersLayer.clearLayers();

            if (currentTrips.length === 0 && currentGroups.length === 0) return;

            const formatTime = (iso: string) => {
                try {
                    const d = new Date(iso);
                    if (isNaN(d.getTime())) {
                        if (iso && iso.includes(':')) return iso;
                        return '--:--';
                    }
                    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                } catch (e) { return '--:--'; }
            };

            // 1. Rendering Trips
            currentTrips.forEach(trip => {
                if (!trip || !trip.from) return;

                const { coords, label: bestMatch } = getCoordsWithOffset(trip.from, trip.id);

                const icon = L.divIcon({
                    className: 'custom-marker',
                    html: `
                        <div class="relative flex items-center justify-center">
                            <div class="absolute w-8 h-8 bg-brand-500/20 rounded-full animate-ping"></div>
                            <div class="relative w-8 h-8 bg-brand-600 border-2 border-white rounded-full flex items-center justify-center shadow-xl transform hover:scale-125 active:scale-95 transition-all cursor-pointer">
                                <span class="text-[16px]">🚗</span>
                            </div>
                        </div>
                    `,
                    iconSize: [32, 32],
                    iconAnchor: [16, 16]
                });

                const marker = L.marker(coords, { icon }).addTo(markersLayer);
                const popupContent = `
                    <div class="p-0 overflow-hidden rounded-3xl min-w-[200px]">
                        <div class="bg-brand-600 px-4 py-3 border-b border-brand-500">
                            <p class="text-[10px] font-black text-brand-100 uppercase tracking-widest">${bestMatch}</p>
                            <h4 class="text-white text-xs font-black mt-0.5">vs ${trip.to || '---'}</h4>
                        </div>
                        <div class="p-4 bg-white space-y-3">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center text-lg">👤</div>
                                <div>
                                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-tighter">${t.driver || 'Driver'}</p>
                                    <p class="text-xs font-black text-slate-800">${trip.driverName}</p>
                                </div>
                            </div>
                            <div class="flex items-center justify-between pt-2 border-t border-slate-50">
                                <span class="text-xs font-black text-brand-600">${formatTime(trip.departureTime)}</span>
                                ${trip.tutoringSubject ? `<span class="text-[9px] text-brand-500 font-black px-1.5 py-0.5 bg-brand-50 rounded-md">#${trip.tutoringSubject}</span>` : ''}
                            </div>
                        </div>
                    </div>
                `;
                marker.bindPopup(popupContent, { className: 'custom-glass-popup', closeButton: false, offset: [0, -10] });
            });

            // 2. Rendering Study Groups
            currentGroups.forEach(group => {
                if (!group || !group.from) return;

                const { coords, label: bestMatch } = getCoordsWithOffset(group.from, group.id);

                const icon = L.divIcon({
                    className: 'custom-marker',
                    html: `
                        <div class="relative flex items-center justify-center">
                            <div class="absolute w-8 h-8 bg-indigo-500/20 rounded-full animate-ping"></div>
                            <div class="relative w-8 h-8 bg-indigo-600 border-2 border-white rounded-full flex items-center justify-center shadow-xl transform hover:scale-125 active:scale-95 transition-all cursor-pointer">
                                <span class="text-[16px]">📚</span>
                            </div>
                        </div>
                    `,
                    iconSize: [32, 32],
                    iconAnchor: [16, 16]
                });

                const marker = L.marker(coords, { icon }).addTo(markersLayer);
                const popupContent = `
                    <div class="p-0 overflow-hidden rounded-3xl min-w-[200px]">
                        <div class="bg-indigo-600 px-4 py-3 border-b border-indigo-500">
                            <p class="text-[10px] font-black text-indigo-100 uppercase tracking-widest">${bestMatch}</p>
                            <h4 class="text-white text-xs font-black mt-0.5">${group.subject}</h4>
                        </div>
                        <div class="p-4 bg-white space-y-3">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 bg-indigo-100 rounded-2xl flex items-center justify-center text-lg">🚄</div>
                                <div>
                                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Train ${group.trainNumber}</p>
                                    <p class="text-xs font-black text-slate-800">${group.trainLine}</p>
                                </div>
                            </div>
                            <div class="flex items-center justify-between pt-2 border-t border-slate-50">
                                <span class="text-xs font-black text-indigo-600">${formatTime(group.departureTime)}</span>
                                <span class="text-[9px] text-indigo-500 font-bold">${group.members.length}/${group.maxMembers} students</span>
                            </div>
                        </div>
                    </div>
                `;
                marker.bindPopup(popupContent, { className: 'custom-glass-popup', closeButton: false, offset: [0, -10] });
            });

            if (mapInstanceRef.current && !mapInstanceRef.current.hasLayer(markersLayer)) {
                markersLayer.addTo(mapInstanceRef.current);
            }

            const allCoords: [number, number][] = [];
            currentTrips.forEach(trip => {
                if (trip?.from) {
                    const { coords } = getCoordsWithOffset(trip.from, trip.id);
                    allCoords.push(coords);
                }
            });
            currentGroups.forEach(group => {
                if (group?.from) {
                    const { coords } = getCoordsWithOffset(group.from, group.id);
                    allCoords.push(coords);
                }
            });
            if (allCoords.length > 0 && mapInstanceRef.current && L) {
                const bounds = L.latLngBounds(allCoords);
                mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
            }
        } catch (error) {
            console.error("MapView Refresh Error:", error);
        }
    };

    // 1b. Quando il contenitore è visibile e ha dimensioni, segnalalo
    useEffect(() => {
        if (!mapContainerRef.current || !isLeafletReady) return;
        const el = mapContainerRef.current;
        const checkSize = () => {
            const r = el.getBoundingClientRect();
            if (r.width > 0 && r.height > 0) {
                setContainerReady(true);
                return true;
            }
            return false;
        };
        if (checkSize()) return;
        const t1 = setTimeout(() => { checkSize() && setContainerReady(true); }, 100);
        const t2 = setTimeout(() => { checkSize() && setContainerReady(true); }, 400);
        const ro = new ResizeObserver(() => { checkSize() && setContainerReady(true); });
        ro.observe(el);
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            ro.disconnect();
        };
    }, [isLeafletReady]);

    // 2. Inizializzazione Mappa (solo quando Leaflet e contenitore sono pronti)
    useEffect(() => {
        const L = getL();
        if (!L || !containerReady || !mapContainerRef.current || mapInstanceRef.current) return;

        const map = L.map(mapContainerRef.current, {
            center: [45.4642, 9.1900],
            zoom: 12,
            zoomControl: false,
            attributionControl: false
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19
        }).addTo(map);

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        const markers = L.layerGroup().addTo(map);

        mapInstanceRef.current = map;
        markersLayerRef.current = markers;

        setTimeout(() => {
            map.invalidateSize();
            updateMarkers(trips, studyGroups);
        }, 100);
    }, [isLeafletReady, containerReady]);

    // 3. Aggiorna marker quando cambiano trips/studyGroups
    useEffect(() => {
        if (!mapInstanceRef.current) return;
        mapInstanceRef.current.invalidateSize();
        updateMarkers(trips, studyGroups);
    }, [trips, studyGroups, t]);

    return (
        <div className="bg-white rounded-[3rem] overflow-hidden shadow-2xl border border-slate-200 relative w-full group" style={{ minHeight: 500, height: 600 }}>
            {/* Map Container: dimensioni esplicite per Leaflet */}
            <div
                ref={mapContainerRef}
                className="absolute inset-0 z-10 bg-slate-50"
                style={{ minHeight: 500, height: '100%', width: '100%' }}
            />

            {/* Overlay UI */}
            <div className="absolute top-8 left-8 z-20 pointer-events-none">
                <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-white shadow-xl">
                    <h3 className="text-slate-800 text-xl font-black">{t.map_title}</h3>
                    <p className="text-emerald-600 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 mt-1">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        {t.map_subtitle}
                    </p>
                </div>
            </div>

            <div className="absolute bottom-8 left-8 z-20 pointer-events-none">
                <div className="bg-slate-900/10 backdrop-blur-sm px-4 py-2 rounded-full">
                    <p className="text-slate-800 text-[9px] uppercase font-black tracking-[0.2em]">{t.map_footer}</p>
                </div>
            </div>

            <style>{`
                .custom-div-icon { background: none !important; border: none !important; }
                .custom-glass-popup .leaflet-popup-content-wrapper {
                    background: rgba(255, 255, 255, 0.98) !important;
                    backdrop-filter: blur(12px);
                    border-radius: 24px !important;
                    padding: 0 !important;
                    border: 1px solid white;
                    box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.15) !important;
                }
                .custom-glass-popup .leaflet-popup-content { margin: 0 !important; }
                .custom-glass-popup .leaflet-popup-tip {
                    background: rgba(255, 255, 255, 0.98) !important;
                }
            `}</style>
        </div>
    );
};
