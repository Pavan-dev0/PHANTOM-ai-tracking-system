function getTimestamp() {
  return new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  });
}

export function getMockResponse(formData = {}) {
  const subjectName = String(formData.name || '').trim().toLowerCase();

  if (subjectName === 'meera nair') {
    return {
      case_id: 'PHT-2024-002',
      timestamp: getTimestamp(),
      search_zone: {
        lat: 13.1,
        lng: 80.25,
        radius_km: 18,
      },
      destination_category: 'isolated_outdoor',
      confidence: 0.61,
      reasoning:
        'Phone activity indicates a possible move toward isolated outdoor terrain with moderate confidence. Search zone prioritises park and trail access corridors near the last known route.',
      gaps:
        'No direct transport booking found. Final destination remains partially inferred.',
      intent_stage: 'specific',
      dominant_engine: 'PHANTOM',
      signal_breakdown: {
        movement: '18km zone projected from last known location via walking access and short vehicle hops',
        cognitive: 'isolated_outdoor at 61 percent confidence',
        device: 'latest device traces cluster west of Tambaram trail approach',
      },
    };
  }

  if (subjectName === 'unknown subject') {
    return {
      case_id: 'PHT-2024-003',
      timestamp: getTimestamp(),
      search_zone: {
        lat: 13.05,
        lng: 80.21,
        radius_km: 12,
      },
      destination_category: 'unknown',
      confidence: 0.34,
      reasoning:
        'Available evidence is weak and fragmented. Current recommendation preserves a low-confidence search radius around the last known area until stronger behavioural or device indicators emerge.',
      gaps:
        'No phone activity history available. No validated transport or destination signal identified.',
      intent_stage: 'vague',
      dominant_engine: 'PHANTOM',
      signal_breakdown: {
        movement: '12km fallback radius from last known location with minimal directional certainty',
        cognitive: 'unknown at 34 percent confidence',
        device: 'device anchor unresolved beyond final passive network registration',
      },
    };
  }

  return {
    case_id: 'PHT-2024-001',
    timestamp: getTimestamp(),
    search_zone: {
      lat: 13.0827,
      lng: 80.2707,
      radius_km: 30,
    },
    destination_category: 'transport_hub',
    confidence: 0.82,
    reasoning:
      'Phone activity strongly suggests transit intent toward a major transport hub. Search zone prioritised around Central Station area.',
    gaps:
      'No historical movement pattern available. Transport confirmation unverified.',
    intent_stage: 'narrowing',
    dominant_engine: 'WRAITH',
    signal_breakdown: {
      movement: '30km radius from last known location via bus',
      cognitive: 'transport_hub at 82 percent confidence',
      device: 'anchored near Park Town coordinates',
    },
  };
}

export const mockResponse = getMockResponse();
