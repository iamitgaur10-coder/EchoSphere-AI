// Service to handle Geocoding via OpenStreetMap Nominatim API (Free, no key required for low volume)

export const searchLocation = async (query: string): Promise<{ lat: number; lon: number; display_name: string } | null> => {
  if (!query || query.length < 3) return null;

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
    );
    const data = await response.json();

    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        display_name: data[0].display_name
      };
    }
    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
};