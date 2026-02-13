// Utility to geocode UK postcodes using postcode.io API
// Free and no API key required

const postcodeCache: Record<string, { lon: number; lat: number } | null> = {};

export async function geocodePostcode(postcode: string): Promise<{ lon: number; lat: number } | null> {
  const normalized = postcode.toUpperCase().replace(/\s+/g, '');

  // Check cache first
  if (postcodeCache[normalized] !== undefined) {
    return postcodeCache[normalized];
  }

  try {
    const response = await fetch(`https://api.postcodes.io/postcodes/${normalized}`);
    
    if (!response.ok) {
      postcodeCache[normalized] = null;
      return null;
    }

    const data = await response.json();
    
    if (data.result) {
      const coords = {
        lon: data.result.longitude,
        lat: data.result.latitude,
      };
      postcodeCache[normalized] = coords;
      return coords;
    }

    postcodeCache[normalized] = null;
    return null;
  } catch (error) {
    console.error(`Error geocoding postcode ${postcode}:`, error);
    postcodeCache[normalized] = null;
    return null;
  }
}

// Batch geocode multiple postcodes
export async function geocodePostcodes(postcodes: string[]): Promise<Record<string, { lon: number; lat: number } | null>> {
  const results: Record<string, { lon: number; lat: number } | null> = {};
  const uncachedPostcodes = postcodes.filter((p) => !(p.toUpperCase().replace(/\s+/g, '') in postcodeCache));

  // Geocode uncached postcodes
  await Promise.all(
    uncachedPostcodes.map(async (postcode) => {
      const coords = await geocodePostcode(postcode);
      results[postcode.toUpperCase()] = coords;
    })
  );

  // Add cached results
  postcodes.forEach((p) => {
    const normalized = p.toUpperCase().replace(/\s+/g, '');
    if (postcodeCache[normalized] !== undefined && !results[p.toUpperCase()]) {
      results[p.toUpperCase()] = postcodeCache[normalized];
    }
  });

  return results;
}
