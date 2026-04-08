const GEONAMES_USERNAME = 'kiritk';
const BASE_URL = 'https://secure.geonames.org/searchJSON';

export interface City {
  city: string;
  region: string;
  country: string;
  displayName: string;
  latitude: number;
  longitude: number;
}

export async function searchCities(query: string): Promise<City[]> {
  if (!query || query.length < 2) return [];

  try {
    const params = new URLSearchParams({
      name_startsWith: query,
      maxRows: '5',
      featureClass: 'P',
      cities: 'cities5000',
      orderby: 'relevance',
      username: GEONAMES_USERNAME,
    });

    const response = await fetch(`${BASE_URL}?${params}`);
    const data = await response.json();

    if (!data.geonames) return [];

    return data.geonames.map((place: any) => ({
      city: place.name,
      region: place.adminName1 || '',
      country: place.countryName || '',
      displayName: place.adminName1
        ? `${place.name}, ${place.adminName1}, ${place.countryName}`
        : `${place.name}, ${place.countryName}`,
      latitude: parseFloat(place.lat),
      longitude: parseFloat(place.lng),
    }));
  } catch (error) {
    console.error('GeoNames search error:', error);
    return [];
  }
}
