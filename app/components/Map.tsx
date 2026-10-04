'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

import Modal from './Modal';
import PlaylistPanel from './PlaylistPanel';
import LiveFeed from './LiveFeed';
import { WindowData } from '../data/windowData';

interface MapViewProps {
	data: WindowData[];
}

const VISITED_WINDOWS_KEY = 'visitedWindows';

// Define category keys
const categoryKeys: (keyof WindowData)[] = [
	'Interiors', 'Snow', 'Animals', 'City', 'Rain', 'Nature', 'Night'
];

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
	const R = 6371; // Radius of the Earth in km
	const dLat = (lat2 - lat1) * Math.PI / 180;
	const dLon = (lon2 - lon1) * Math.PI / 180;
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
		Math.sin(dLon / 2) * Math.sin(dLon / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	const distance = R * c; // Distance in km
	return distance;
}

export default function MapView({ data }: MapViewProps) {
	const mapRef = useRef<L.Map | null>(null);
	const mapContainerRef = useRef<HTMLDivElement>(null);
	const clusterGroupRef = useRef<any>(null);
	const mapInitializedRef = useRef(false);

	// State for modal control
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [modalUrl, setModalUrl] = useState<string | null>(null);
	const [modalTitle, setModalTitle] = useState<string>("Window View");

	// State for playlist logic
	const [currentWindow, setCurrentWindow] = useState<WindowData | null>(null);
	const [visitedWindows, setVisitedWindows] = useState<Set<string>>(new Set());
	const [visitHistory, setVisitHistory] = useState<string[]>([]); // Store url1 strings
	const [isLooping, setIsLooping] = useState(false);
	const [isPlaylistPanelOpen, setIsPlaylistPanelOpen] = useState(false); // State for playlist panel visibility
	const [visibleWindows, setVisibleWindows] = useState<WindowData[]>([]);
	const lastUpdateRef = useRef<{ lat: number, lng: number, zoom: number } | null>(null);

	// Load visited windows from localStorage on mount
	useEffect(() => {
		// Provide initial discovery feed content even before map is ready
		if (data && data.length > 0) {
			const initial = data.slice(0, 10).sort(() => 0.5 - Math.random()).slice(0, 5);
			setVisibleWindows(initial);
		}

		try {
			const storedVisited = localStorage.getItem(VISITED_WINDOWS_KEY);
			if (storedVisited) {
				setVisitedWindows(new Set(JSON.parse(storedVisited)));
				console.log("Loaded visited windows from localStorage");
			}
		} catch (error) {
			console.error("Failed to load visited windows from localStorage:", error);
		}
	}, []);

	// Save visited windows to localStorage when changed
	useEffect(() => {
		try {
			localStorage.setItem(VISITED_WINDOWS_KEY, JSON.stringify(Array.from(visitedWindows)));
		} catch (error) {
			console.error("Failed to save visited windows to localStorage:", error);
		}
	}, [visitedWindows]);

	// Function to close the modal
	const closeModal = useCallback(() => {
		setIsModalOpen(false);
		setModalUrl(null);
		setCurrentWindow(null);
		console.log("Modal closed.");
	}, []);

	// Function to find the nearest unvisited window
	const findNearestUnvisitedWindow = useCallback((currentLat: number, currentLon: number, excludeId?: string, excludeIds?: Set<string>): WindowData | null => {
		let nearestWindow: WindowData | null = null;
		let minDistance = Infinity;

		data.forEach(window => {
			// Check if window has coordinates, is not globally visited, is not the starting point, AND is not in the temporary exclusion list
			if (window.Latitude && window.Longitude &&
				!visitedWindows.has(window.url1) &&
				window.url1 !== excludeId &&
				(!excludeIds || !excludeIds.has(window.url1)) // Check against temporary exclusion set
			) {
				const lat = typeof window.Latitude === 'string' ? parseFloat(window.Latitude) : window.Latitude;
				const lng = typeof window.Longitude === 'string' ? parseFloat(window.Longitude) : window.Longitude;
				const distance = calculateDistance(currentLat, currentLon, lat, lng);
				if (distance < minDistance) {
					minDistance = distance;
					nearestWindow = window;
				}
			}
		});
		return nearestWindow;
	}, [data, visitedWindows]);

	// Function to update state for a new window
	const goToWindow = useCallback((windowData: WindowData | null, isNewVisit: boolean = true) => {
		if (!windowData) {
			console.log("No window data to go to.");
			closeModal();
			return;
		}

		console.log(`Going to window: ${windowData.url1}, New visit: ${isNewVisit}`);
		setCurrentWindow(windowData);
		const nextVimeoEmbedUrl = `https://player.vimeo.com/video/${windowData.url1}?h=${windowData.url2}&autoplay=1&title=0&byline=0&portrait=0`;
		setModalUrl(nextVimeoEmbedUrl);

		// Generate category string
		const activeCategories = categoryKeys
			.filter(key => windowData[key] === true)
			.join(', ');
		const categoryString = activeCategories ? ` (${activeCategories})` : '';

		setModalTitle(`${windowData.cityLocation || 'Unknown Location'}${categoryString}`);

		if (isNewVisit) {
			setVisitedWindows(prev => {
				if (prev.has(windowData.url1)) return prev;
				const next = new Set(prev);
				next.add(windowData.url1);
				return next;
			});
			setVisitHistory(prev => {
				const filtered = prev.filter(id => id !== windowData.url1);
				return [...filtered, windowData.url1];
			});
		}

		setIsModalOpen(true);
	}, [closeModal]); // Reduced dependencies to stabilize it

	// Function to update visible windows for the footer feed
	const updateVisibleWindows = useCallback(() => {
		const map = mapRef.current;
		if (!map) return;

		let bounds;
		try {
			bounds = map.getBounds();
			if (!bounds || !bounds.isValid()) return;
		} catch (e) {
			return;
		}

		const currentCenter = map.getCenter();
		const currentZoom = map.getZoom();

		if (lastUpdateRef.current) {
			const { lat, lng, zoom } = lastUpdateRef.current;
			const dist = currentCenter.distanceTo([lat, lng]);
			const zoomChanged = currentZoom !== zoom;
			if (dist < 50000 && !zoomChanged) return;
		}

		lastUpdateRef.current = { lat: currentCenter.lat, lng: currentCenter.lng, zoom: currentZoom };

		// Optimization: Instead of filtering 50k items, find first 20 in bounds
		const inBounds: WindowData[] = [];
		for (let i = 0; i < data.length; i++) {
			const w = data[i];
			if (!w.Latitude || !w.Longitude) continue;

			const lat = typeof w.Latitude === 'string' ? parseFloat(w.Latitude) : w.Latitude;
			const lng = typeof w.Longitude === 'string' ? parseFloat(w.Longitude) : w.Longitude;

			if (bounds.contains([lat, lng])) {
				inBounds.push(w);
				if (inBounds.length >= 20) break; // Found enough candidates
			}
		}

		console.log(`Visible windows update: found ${inBounds.length} candidates in bounds`);

		const shuffled = [...inBounds].sort(() => 0.5 - Math.random());
		const nextVisible = shuffled.slice(0, 5);

		if (nextVisible.length === 0 && data.length > 0) {
			// Efficient fallback for unvisited
			const unvisited: WindowData[] = [];
			for (let i = 0; i < data.length; i++) {
				const w = data[i];
				if (!visitedWindows.has(w.url1) && w.Latitude && w.Longitude) {
					unvisited.push(w);
					if (unvisited.length >= 5) break;
				}
			}
			setVisibleWindows(unvisited.length > 0 ? unvisited : data.slice(0, 5));
		} else {
			setVisibleWindows(nextVisible);
		}
	}, [data, visitedWindows]);

	const handleLiveFeedClick = useCallback((windowData: WindowData) => {
		const map = mapRef.current;
		if (map && windowData.Latitude && windowData.Longitude) {
			map.flyTo([windowData.Latitude, windowData.Longitude], 14, {
				duration: 2
			});
		}
		goToWindow(windowData, true);
	}, [goToWindow]);

	// Function to open the modal
	const openModal = useCallback((url: string, title: string, windowData?: WindowData) => {
		if (windowData) {
			goToWindow(windowData, true);
		} else {
			setModalUrl(url);
			setModalTitle(title);
			setCurrentWindow(null);
			setVisitHistory([]);
			setIsModalOpen(true);
		}
	}, [goToWindow]);

	// Keep refs of callbacks for Leaflet event handlers to avoid re-initializing map
	const openModalRef = useRef(openModal);
	const updateVisibleWindowsRef = useRef(updateVisibleWindows);

	useEffect(() => {
		openModalRef.current = openModal;
		updateVisibleWindowsRef.current = updateVisibleWindows;
	}, [openModal, updateVisibleWindows]);

	// Function to handle the end of a Vimeo video
	const handleVideoEnd = useCallback(() => {
		console.log("handleVideoEnd triggered for:", currentWindow?.url1);
		if (isLooping || !currentWindow || !currentWindow.Latitude || !currentWindow.Longitude) {
			if (!isLooping) closeModal();
			return;
		}

		const nextWindow = findNearestUnvisitedWindow(currentWindow.Latitude, currentWindow.Longitude, currentWindow.url1);
		if (nextWindow) {
			goToWindow(nextWindow, true);
		} else {
			console.log("No more unvisited windows found.");
			closeModal();
		}
	}, [currentWindow, findNearestUnvisitedWindow, closeModal, goToWindow, isLooping]);

	// Function for "Go Next" button
	const handleGoNext = useCallback(() => {
		console.log("handleGoNext triggered");
		if (!currentWindow || !currentWindow.Latitude || !currentWindow.Longitude) return;

		if (!visitedWindows.has(currentWindow.url1)) {
			setVisitedWindows(prev => new Set(prev).add(currentWindow.url1));
			setVisitHistory(prev => prev[prev.length - 1] !== currentWindow.url1 ? [...prev, currentWindow.url1] : prev);
		}

		const nextWindow = findNearestUnvisitedWindow(currentWindow.Latitude, currentWindow.Longitude, currentWindow.url1);
		if (nextWindow) {
			goToWindow(nextWindow, true);
		} else {
			console.log("No more unvisited windows to go next to.");
		}
	}, [currentWindow, visitedWindows, findNearestUnvisitedWindow, goToWindow]);

	// Function for "Go Previous" button
	const handleGoPrevious = useCallback(() => {
		console.log("handleGoPrevious triggered. History:", visitHistory);
		if (visitHistory.length < 2) {
			console.log("Not enough history to go previous.");
			return;
		}

		const previousWindowId = visitHistory[visitHistory.length - 2];
		const previousWindowData = data.find(w => w.url1 === previousWindowId);

		if (previousWindowData) {
			setVisitHistory(prev => prev.slice(0, -1));
			goToWindow(previousWindowData, false);
		} else {
			console.error("Could not find data for previous window ID:", previousWindowId);
			setVisitHistory(prev => prev.filter(id => id !== previousWindowId));
		}
	}, [visitHistory, data, goToWindow]);

	// Function to play a specific window from the playlist panel
	const playSpecificWindow = useCallback((windowId: string) => {
		console.log("playSpecificWindow triggered for:", windowId);
		const windowData = data.find(w => w.url1 === windowId);
		if (windowData) {
			const isNewVisit = !visitedWindows.has(windowId) || visitHistory[visitHistory.length - 1] !== windowId;
			goToWindow(windowData, isNewVisit);
		} else {
			console.error("Could not find window data for ID:", windowId);
		}
	}, [data, goToWindow, visitedWindows, visitHistory]);

	// Function to toggle looping
	const toggleLoop = useCallback(() => {
		setIsLooping(prev => !prev);
	}, []);

	// Function to get playlist info
	const getPlaylistInfo = useCallback(() => {
		const visited = visitHistory
			.map(id => data.find(w => w.url1 === id))
			.filter((w): w is WindowData => !!w) // Ensure only valid WindowData objects are included
			.reverse();

		let upcoming: WindowData[] = [];
		let upcomingIds = new Set<string>();
		let count = 0;
		let lastWindow = currentWindow;

		while (count < 10 && lastWindow && lastWindow.Latitude && lastWindow.Longitude) {
			const next = findNearestUnvisitedWindow(lastWindow.Latitude, lastWindow.Longitude, lastWindow.url1, upcomingIds);

			if (next) {
				upcoming.push(next);
				upcomingIds.add(next.url1);
				lastWindow = next;
				count++;
			} else {
				break;
			}
		}

		return { visited, upcoming };
	}, [visitHistory, currentWindow, data, findNearestUnvisitedWindow]);

	// Memoize playlist info to prevent unnecessary re-renders
	const playlistInfo = useMemo(() => getPlaylistInfo(), [getPlaylistInfo]);


	// Debug için veri kontrolü
	useEffect(() => {
		if (!data || data.length === 0) {
			console.error("No data available for map markers!");
		} else {
			console.log("Data available:", data.length, "items");
		}
	}, [data]);

	// Haritayı oluştur
	useEffect(() => {
		if (!mapContainerRef.current) return;

		if (mapInitializedRef.current) return;
		mapInitializedRef.current = true;

		const loadScript = (url: string): Promise<void> => {
			if (document.querySelector(`script[src="${url}"]`)) return Promise.resolve();
			return new Promise((resolve, reject) => {
				const script = document.createElement('script');
				script.src = url;
				script.async = true;
				script.onload = () => resolve();
				script.onerror = (e) => reject(e);
				document.head.appendChild(script);
			});
		};

		const initMap = async () => {
			try {
				await loadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js');
				await loadScript('https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js');

				const L = window.L;
				if (!L) throw new Error("Leaflet not loaded correctly");

				delete (L.Icon.Default.prototype as any)._getIconUrl;
				L.Icon.Default.mergeOptions({
					iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
					iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
					shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
				});

				const map = L.map(mapContainerRef.current).setView([20, 0], 2);
				mapRef.current = map;

				L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
					attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
					maxZoom: 18
				}).addTo(map);

				if (!L.markerClusterGroup) {
					throw new Error("L.markerClusterGroup is not available");
				}

				const markerClusterGroup = L.markerClusterGroup({
					chunkedLoading: true,
					spiderfyOnMaxZoom: true,
					showCoverageOnHover: false,
					zoomToBoundsOnClick: true,
					disableClusteringAtZoom: 19,
					maxClusterRadius: 50,
					iconCreateFunction: function (cluster: any) { // Add : any here
						const childCount = cluster.getChildCount();

						let size, className;
						if (childCount < 10) {
							size = 30;
							className = 'marker-cluster-small';
						} else if (childCount < 100) {
							size = 40;
							className = 'marker-cluster-medium';
						} else {
							size = 50;
							className = 'marker-cluster-large';
						}

						return new L.DivIcon({
							html: '<div><span>' + childCount + '</span></div>',
							className: 'marker-cluster ' + className,
							iconSize: new L.Point(size, size)
						});
					}
				});

				clusterGroupRef.current = markerClusterGroup;

				// Optimization: Don't create 50k DOM nodes upfront. Use a function for bindPopup.
				const markers: L.Marker[] = [];
				const CHUNK_SIZE = 2000;

				for (let i = 0; i < data.length; i++) {
					const windowData = data[i];
					if (!windowData.Latitude || !windowData.Longitude) continue;

					const lat = typeof windowData.Latitude === 'string' ? parseFloat(windowData.Latitude) : windowData.Latitude;
					const lng = typeof windowData.Longitude === 'string' ? parseFloat(windowData.Longitude) : windowData.Longitude;

					const customIcon = L.divIcon({
						className: 'window-marker',
						html: '',
						iconSize: [16, 16],
						iconAnchor: [8, 8]
					});

					const marker = L.marker([lat, lng], {
						icon: customIcon,
						title: windowData.cityLocation
					});

					// Lazy bind popup - only creates DOM when clicked
					marker.bindPopup(() => {
						const container = document.createElement('div');
						container.className = 'popup-content';

						const title = document.createElement('h3');
						title.textContent = windowData.cityLocation || 'Unknown location';
						container.appendChild(title);

						const locationInfo = document.createElement('div');
						locationInfo.className = 'popup-location-info';
						locationInfo.innerHTML = `
							<span class="popup-location-icon">
								<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
									<circle cx="12" cy="10" r="3"></circle>
								</svg>
							</span>
						`;
						const country = document.createElement('span');
						country.textContent = windowData.countryLocation || '';
						locationInfo.appendChild(country);
						container.appendChild(locationInfo);

						const buttonContainer = document.createElement('div');
						buttonContainer.className = 'popup-button-container';

						const swapBtn = document.createElement('button');
						swapBtn.className = 'popup-primary-button';
						swapBtn.textContent = 'View Window';
						swapBtn.onclick = () => openModalRef.current(
							`https://www.window-swap.com/Window/${windowData.url1}`,
							windowData.cityLocation || 'Window Swap View',
							windowData
						);
						buttonContainer.appendChild(swapBtn);

						const vimeoBtn = document.createElement('button');
						vimeoBtn.className = 'popup-secondary-button';
						vimeoBtn.textContent = 'View on Vimeo';
						vimeoBtn.onclick = () => {
							const vimeoUrl = `https://player.vimeo.com/video/${windowData.url1}?h=${windowData.url2}&autoplay=1&title=0&byline=0&portrait=0`;
							openModal(vimeoUrl, windowData.cityLocation || 'Unknown Location', windowData);
						};
						buttonContainer.appendChild(vimeoBtn);

						container.appendChild(buttonContainer);
						return container;
					}, {
						className: 'modern-popup',
						closeButton: true,
						autoClose: true,
						minWidth: 220
					});

					marker.on('click', () => {
						openModalRef.current(
							`https://www.window-swap.com/Window/${windowData.url1}`,
							windowData.cityLocation || 'Window Swap View',
							windowData
						);
					});

					markers.push(marker);
				}

				// Use bulk addition in chunks to prevent stack overflow in some Leaflet versions
				for (let i = 0; i < markers.length; i += CHUNK_SIZE) {
					markerClusterGroup.addLayers(markers.slice(i, i + CHUNK_SIZE));
				}

				map.addLayer(markerClusterGroup);

				console.log("Marker cluster added to map");

				L.control.zoom({
					position: 'topright'
				}).addTo(map);

				// Set up feed updates
				map.on('moveend', () => updateVisibleWindowsRef.current());
				map.on('zoomend', () => updateVisibleWindowsRef.current());
				updateVisibleWindowsRef.current(); // Initial load

			} catch (error) {
				console.error("Error initializing map or clustering:", error);

				if (mapContainerRef.current && !mapRef.current) {
					try {
						const L = window.L;
						if (L) {
							console.log("Falling back to simple map without clustering");
							const map = L.map(mapContainerRef.current).setView([20, 0], 2);
							mapRef.current = map;

							L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
								attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
							}).addTo(map);

							const limitedData = data.slice(0, 1000);
							limitedData.forEach(window => {
								if (!window.Latitude || !window.Longitude) return;

								const marker = L.marker([window.Latitude, window.Longitude]).addTo(map);
								marker.bindTooltip(window.cityLocation || "Unknown location");

								marker.on('click', () => {
									openModalRef.current(
										`https://www.window-swap.com/Window/${window.url1}`,
										window.cityLocation || 'Window Swap View',
										window
									);
								});
							});
						}
					} catch (fallbackErr) {
						console.error("Even fallback map failed:", fallbackErr);
					}
				}
			}
		};

		initMap();

		return () => {
			if (mapRef.current) {
				mapRef.current.remove();
				mapRef.current = null;
				mapInitializedRef.current = false;
			}
		};
	}, [data]); // Only re-run if data changes

	return (
		<div style={{ height: '100vh', width: '100%', position: 'relative', overflow: 'hidden' }}>
			<div id="map" ref={mapContainerRef} style={{ height: '100%', width: '100%', zIndex: 1 }} />
			<Modal
				isOpen={isModalOpen}
				onClose={closeModal}
				url={modalUrl}
				title={modalTitle}
				onVideoEnd={handleVideoEnd}
				isLooping={isLooping}
				toggleLoop={toggleLoop}
				handleGoNext={handleGoNext}
				handleGoPrevious={handleGoPrevious}
				canGoPrevious={visitHistory.length >= 2}
				getPlaylistInfo={getPlaylistInfo}
				playSpecificWindow={playSpecificWindow}
			/>
			{isPlaylistPanelOpen && (
				<PlaylistPanel
					visitedWindows={playlistInfo.visited}
					upcomingWindows={playlistInfo.upcoming}
					onPlayWindow={playSpecificWindow}
					onClose={() => setIsPlaylistPanelOpen(false)}
				/>
			)}
			<LiveFeed windows={visibleWindows} onWindowClick={handleLiveFeedClick} />
		</div>
	);
}

// Window nesnesine Leaflet tiplerini ekle
declare global {
	interface Window {
		L: any;
	}
}
