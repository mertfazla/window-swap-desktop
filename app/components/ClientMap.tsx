'use client';

import dynamic from 'next/dynamic';
import { WindowData } from '../data/windowData';

// This is now in a client component, so dynamic import with ssr: false is allowed
const MapView = dynamic(() => import('./Map'), {
  ssr: false
});

interface ClientMapProps {
  data: WindowData[];
}

export default function ClientMap({ data }: ClientMapProps) {
  return <MapView data={data} />;
}
