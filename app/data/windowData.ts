import dataValues from './catalog.json';

export interface WindowData {
    url1: string;
    url2?: string;
    cityLocation: string;
    countryLocation?: string;
    Latitude: number;
    Longitude: number;
    Interiors?: boolean;
    Snow?: boolean;
    Animals?: boolean;
    City?: boolean;
    Rain?: boolean;
    Nature?: boolean;
    Night?: boolean;
    date?: string; // Add optional date property
}

// Only include content and metadata cleared for public redistribution.
// Everything here is included in the exported app and visible to its users.
export const data: WindowData[] = dataValues;
