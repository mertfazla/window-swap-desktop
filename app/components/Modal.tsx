'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import './Modal.css'; // Import modal specific styles
import { WindowData } from '../data/windowData'; // Import WindowData type

// Declare Vimeo type globally or import if using a type package
declare global {
	interface Window {
		Vimeo: any;
	}
}

interface PlaylistInfo {
	visited: WindowData[];
	upcoming: WindowData[];
}

interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	url: string | null;
	title?: string; // Optional title for context
	onVideoEnd?: () => void; // Callback for when Vimeo video ends
	isLooping: boolean;
	toggleLoop: () => void;
	handleGoNext: () => void;
	handleGoPrevious: () => void;
	canGoPrevious: boolean; // To disable previous button
	getPlaylistInfo: () => PlaylistInfo;
	playSpecificWindow: (windowId: string) => void;
}

const loadVimeoScript = (): Promise<void> => {
	return new Promise((resolve, reject) => {
		if (window.Vimeo) {
			resolve();
			return;
		}
		const script = document.createElement('script');
		script.src = 'https://player.vimeo.com/api/player.js';
		script.onload = () => resolve();
		script.onerror = (e) => reject(e);
		document.head.appendChild(script);
	});
};

const Modal: React.FC<ModalProps> = ({
	isOpen,
	onClose,
	url,
	title = "Window View",
	onVideoEnd,
	isLooping,
	toggleLoop,
	handleGoNext,
	handleGoPrevious,
	canGoPrevious,
	getPlaylistInfo,
	playSpecificWindow
}) => {
	const playerRef = useRef<any>(null);
	const playerContainerRef = useRef<HTMLDivElement>(null);
	const isVimeo = url?.includes('player.vimeo.com/video');

	const [showControls, setShowControls] = useState(false);
	const [showPlaylistPanel, setShowPlaylistPanel] = useState(false);
	const [playlistData, setPlaylistData] = useState<PlaylistInfo>({ visited: [], upcoming: [] });

	useEffect(() => {
		let playerInstance: any = null; // Keep track of the instance locally

		if (isOpen && isVimeo && url && playerContainerRef.current) {
			loadVimeoScript().then(() => {
				if (!playerContainerRef.current) return; // Check if container still exists

				// Ensure container is clean before initializing
				playerContainerRef.current.innerHTML = ''; // Clear previous player if any

				playerInstance = new window.Vimeo.Player(playerContainerRef.current, {
					url: url,
					autoplay: true,
					// Ensure dimensions are applied correctly, maybe default to 100%
					width: playerContainerRef.current.clientWidth || '100%',
					height: playerContainerRef.current.clientHeight || '100%',
				});

				playerRef.current = playerInstance; // Assign to ref

				playerInstance.on('ended', () => {
					if (isLooping) {
						console.log('Looping video');
						playerInstance.play().catch((e: any) => console.error("Error restarting video:", e));
					} else {
						console.log('Vimeo video ended (no loop)');
						onVideoEnd?.(); // Call the callback if provided
					}
				});

				playerInstance.on('error', (error: any) => {
					console.error('Vimeo Player Error:', error);
				});

			}).catch(err => {
				console.error("Failed to load Vimeo Player API", err);
			});
		}

		// Cleanup function
		return () => {
			// Use the local variable `playerInstance` or the ref `playerRef.current`
			const playerToDestroy = playerRef.current;
			if (playerToDestroy) {
				playerToDestroy.destroy().then(() => {
					console.log('Vimeo player destroyed');
				}).catch((error: any) => {
					console.error('Error destroying Vimeo player:', error);
				});
				playerRef.current = null; // Clear the ref
			}
		};
	}, [isOpen, isVimeo, url, onVideoEnd, isLooping]); // Added isLooping dependency

	// Fetch playlist data when panel is opened
	useEffect(() => {
		if (showPlaylistPanel) {
			setPlaylistData(getPlaylistInfo());
		}
	}, [showPlaylistPanel, getPlaylistInfo]);

	const handlePlaylistButtonClick = () => {
		setShowPlaylistPanel(prev => !prev);
	};

	const handlePlaylistItemClick = (windowId: string) => {
		playSpecificWindow(windowId);
		setShowPlaylistPanel(false); // Close panel after selection
	};

	if (!isOpen || !url) {
		return null;
	}

	return (
		<div className="modal-overlay" onClick={onClose}>
			<div
				className="modal-content"
				onClick={(e) => e.stopPropagation()}
				onMouseEnter={() => isVimeo && setShowControls(true)} // Show controls only for Vimeo
				onMouseLeave={() => setShowControls(false)}
			>
				<button className="modal-close-button" onClick={onClose}>
					&times; {/* Unicode 'X' character */}
				</button>
				<div className="modal-header">
					<h2>{title}</h2>
				</div>
				<div className="modal-body">
					{isVimeo ? (
						// Container for Vimeo Player API
						<div ref={playerContainerRef} style={{ width: '100%', height: '100%' }}></div>
					) : (
						// Standard iframe for other URLs (like Window Swap)
						<iframe
							src={url} // Use the direct URL for the iframe
							title={title}
							width="100%"
							height="100%"
							frameBorder="0"
							allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
							allowFullScreen
						></iframe>
					)}
				</div>

				{/* Controls - Show only for Vimeo and on hover */}
				{isVimeo && (
					<div className={`modal-controls ${showControls ? 'visible' : ''}`}>
						<button onClick={handleGoPrevious} disabled={!canGoPrevious} title="Previous">
							&#9664; {/*◀*/}
						</button>
						<button onClick={toggleLoop} title={isLooping ? "Disable Loop" : "Enable Loop"}>
							{isLooping ? '🔁' : '➡️'} {/* Simple example */}
						</button>
						<button onClick={handleGoNext} title="Next">
							&#9654; {/*▶*/}
						</button>
						<button onClick={handlePlaylistButtonClick} title="Show Playlist">
							☰
						</button>
					</div>
				)}

				{/* Playlist Panel */}
				{showPlaylistPanel && (
					<div className="playlist-panel">
						<button className="playlist-close-button" onClick={() => setShowPlaylistPanel(false)}>&times;</button>
						<h4>Playlist</h4>
						<div className="playlist-section">
							<h5>Visited</h5>
							<ul>
								{playlistData.visited.length > 0 ? (
									playlistData.visited.map(w => (
										<li key={`visited-${w.url1}`} onClick={() => handlePlaylistItemClick(w.url1)}>
											{w.cityLocation || 'Unknown'}
										</li>
									))
								) : (
									<li>None yet</li>
								)}
							</ul>
						</div>
						<div className="playlist-section">
							<h5>Upcoming (Next 10)</h5>
							<ul>
								{playlistData.upcoming.length > 0 ? (
									playlistData.upcoming.map(w => (
										<li key={`upcoming-${w.url1}`} onClick={() => handlePlaylistItemClick(w.url1)}>
											{w.cityLocation || 'Unknown'}
										</li>
									))
								) : (
									<li>End of the line!</li>
								)}
							</ul>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default Modal;
