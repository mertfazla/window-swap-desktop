import React from 'react';
import { WindowData } from '../data/windowData'; // Adjust path if needed
import './Modal.css'; // Reuse Modal CSS for styling, or create a separate one

interface PlaylistPanelProps {
	visitedWindows: WindowData[]; // Changed from string[] to WindowData[]
	upcomingWindows: WindowData[];
	onPlayWindow: (windowId: string) => void;
	onClose: () => void;
}

const PlaylistPanel: React.FC<PlaylistPanelProps> = ({
	visitedWindows,
	upcomingWindows,
	onPlayWindow,
	onClose
}) => {
	return (
		<div className="playlist-panel">
			<button className="playlist-close-button" onClick={onClose}>&times;</button>
			<h4>Playlist</h4>
			<div className="playlist-section">
				<h5>Visited</h5>
				<ul>
					{visitedWindows.length > 0 ? (
						visitedWindows.map(w => (
							<li key={`visited-${w.url1}`} onClick={() => onPlayWindow(w.url1)}>
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
					{upcomingWindows.length > 0 ? (
						upcomingWindows.map(w => (
							<li key={`upcoming-${w.url1}`} onClick={() => onPlayWindow(w.url1)}>
								{w.cityLocation || 'Unknown'}
							</li>
						))
					) : (
						<li>End of the line!</li>
					)}
				</ul>
			</div>
		</div>
	);
};

export default PlaylistPanel;
