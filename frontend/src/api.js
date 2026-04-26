import axios from 'axios';

export const USE_MOCK = false;

function parseCoordinate(value) {
  if (value === '' || value === null || typeof value === 'undefined') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function buildAnalysePayload(formData) {
  const phoneLat = parseCoordinate(formData.phone_lat);
  const phoneLng = parseCoordinate(formData.phone_lng);

  return {
    name: formData.name,
    last_location: {
      lat: Number(formData.last_lat),
      lng: Number(formData.last_lng),
    },
    missing_since_hours: Number(formData.missing_since_hours),
    phone_last_active:
      phoneLat !== null && phoneLng !== null
        ? {
            lat: phoneLat,
            lng: phoneLng,
          }
        : null,
    phone_activity_notes: formData.phone_activity_notes,
    transport_available: formData.transport_available,
  };
}

export async function analyseCase(formData) {
  const response = await axios.post(
    'http://localhost:5000/analyse',
    buildAnalysePayload(formData)
  );
  return response.data;
}
