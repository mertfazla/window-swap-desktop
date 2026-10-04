import { data } from './data/windowData';
import ClientMap from './components/ClientMap';

export default function Home() {
	return (
		<div className="window-swap-container">
			{data.length === 0 && (
				<div style={{ position: 'absolute', top: 16, left: 64, zIndex: 1000, padding: 16, background: '#fff', color: '#111', borderRadius: 8, maxWidth: 380 }}>
					<strong>No videos loaded</strong>
					<p>Add a catalog of videos you own or have permission to share to explore window views.</p>
				</div>
			)}
			<ClientMap data={data} />
		</div>
	);
}
