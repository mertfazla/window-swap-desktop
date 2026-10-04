'use client';

import React from 'react';
import { WindowData } from '../data/windowData';
import './LiveFeed.css';

interface LiveFeedProps {
    windows: WindowData[];
    onWindowClick: (window: WindowData) => void;
}

const LiveFeed: React.FC<LiveFeedProps> = ({ windows, onWindowClick }) => {
    if (windows.length === 0) return null;

    return (
        <div className="live-feed-container">
            <div className="live-feed-header">
                <span className="live-dot"></span>
                <h3>Live Discoveries</h3>
            </div>
            <div className="live-feed-scroll">
                {windows.map((win) => (
                    <div
                        key={win.url1}
                        className="live-feed-item"
                        onClick={() => onWindowClick(win)}
                    >
                        <div className="live-feed-video-wrapper">
                            <iframe
                                src={`https://player.vimeo.com/video/${win.url1}?h=${win.url2}&autoplay=1&loop=1&muted=1&background=1&title=0&byline=0&portrait=0`}
                                frameBorder="0"
                                allow="autoplay; fullscreen"
                                title={win.cityLocation}
                            ></iframe>
                            <div className="live-feed-overlay">
                                <span className="live-feed-location">{win.cityLocation}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LiveFeed;
