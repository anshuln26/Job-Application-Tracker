import { LOCATION_PRESETS } from '../data/mockData';

const SAVED_LOCATIONS_KEY = 'careertrack_saved_locations_v1';

export const DEFAULT_CUSTOM_LOCATIONS = [
  'Bengaluru, India',
  'Hyderabad, India',
  'Pune, India',
  'Gurugram / NCR',
  'Mumbai, India',
  'Remote (India)',
  'Remote (Global)',
  'Dubai, UAE',
  'London, UK',
  'Berlin, Germany',
  'San Francisco, US',
  'Tokyo, Japan',
  'Seoul, South Korea',
  'Singapore',
  'Sydney, Australia'
];

/**
 * Retrieves user's saved/recommended locations from localStorage.
 */
export const getSavedLocations = () => {
  try {
    const saved = localStorage.getItem(SAVED_LOCATIONS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to read saved locations:', err);
  }
  return DEFAULT_CUSTOM_LOCATIONS;
};

/**
 * Saves a new custom location to the user's recommendations list.
 */
export const saveCustomLocation = (location) => {
  if (!location || typeof location !== 'string') return;
  const trimmed = location.trim();
  if (!trimmed || trimmed.length < 2) return;

  try {
    const existing = getSavedLocations();
    // Case-insensitive check
    const exists = existing.some(loc => loc.toLowerCase() === trimmed.toLowerCase());
    if (!exists) {
      const updated = [trimmed, ...existing].slice(0, 30);
      localStorage.setItem(SAVED_LOCATIONS_KEY, JSON.stringify(updated));
      return updated;
    }
  } catch (err) {
    console.error('Failed to save custom location:', err);
  }
};

/**
 * Removes a custom location from saved recommendations.
 */
export const removeCustomLocation = (location) => {
  if (!location) return;
  try {
    const existing = getSavedLocations();
    const updated = existing.filter(loc => loc.toLowerCase() !== location.trim().toLowerCase());
    localStorage.setItem(SAVED_LOCATIONS_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to remove custom location:', err);
  }
};

/**
 * Combines standard location presets, saved custom locations,
 * and any unique locations found in the user's active applications list.
 */
export const getAllLocationRecommendations = (applications = []) => {
  const saved = getSavedLocations();
  const presetLocations = LOCATION_PRESETS.map(p => p.location);
  
  const appLocations = applications
    .map(a => a.location)
    .filter(loc => typeof loc === 'string' && loc.trim().length > 1);

  // Combine and deduplicate preserving case
  const combined = [];
  const seenLower = new Set();

  [...saved, ...presetLocations, ...appLocations].forEach(loc => {
    if (!loc) return;
    const clean = loc.trim();
    const lower = clean.toLowerCase();
    if (!seenLower.has(lower)) {
      seenLower.add(lower);
      combined.push(clean);
    }
  });

  return combined;
};
