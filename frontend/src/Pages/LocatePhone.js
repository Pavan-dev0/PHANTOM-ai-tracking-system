import React,{useState} from 'react';

export function LocatePhone() {
  const [locating, setLocating] = useState(null);
  const [selected, setSelected] = useState(null);
  /* Hard coded for now will be removed once the summary can be attained by the model */
  const contacts = [
    { id: 1, name: 'Sarah Johnson',  initials: 'SJ', number: '+91 98765 43210'},
    { id: 2, name: 'Mike Stevens',   initials: 'MS', number: '+91 91234 56789'},
    { id: 3, name: 'Priya Sharma',   initials: 'PS', number: '+91 87654 32109'},
    { id: 4, name: 'David Chen',     initials: 'DC', number: '+91 99887 76655'},
    { id: 5, name: 'Anika Patel',    initials: 'AP', number: '+91 93456 78901'},
  ];

  function handleLocate(contact) {
    
    setLocating(contact.id);
    setTimeout(() => {
      setLocating(null);
      setSelected(contact);
    }, 1500);
  }
  if (selected) {
    return <LocationDetail contact={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <>
      <h1 className="page-title">Locate Phone</h1>
      <p className="page-sub">Select a connected profile to locate their device.</p>

      <div className="devices-list">
        {contacts.map(contact => (
          <div className="device-card" key={contact.id}>
            <div className="device-avatar">{contact.initials}</div>
            <div className="device-info">
              <div className="device-name">{contact.name}</div>
              <div className="device-number">{contact.number}</div>
            </div>
            <button
              className="locate-device-btn"
              onClick={() => handleLocate(contact)}
            >
              {locating === contact.id ? 'Locating...' : 'Locate'}
            </button>
          </div>
        ))}
      </div>
    </>
  );
}


function LocationDetail({ contact, onBack }) {
  /* Hard coded for now will be removed once the summary can be attained by the model */
  const history = [
    { time: '10:42 AM', place: 'Home',              address: '14 MG Road, Bengaluru, 560001' },
    { time: '11:15 AM', place: 'Petrol Bunk',        address: 'Shell Station, Residency Rd'   },
    { time: '12:30 PM', place: 'Koramangala Mall',   address: 'Forum Mall, Koramangala'       },
    { time: '02:10 PM', place: 'Cafe Coffee Day',    address: 'Indiranagar 100ft Road'        },
    { time: '03:45 PM', place: 'Office',             address: 'Bagmane Tech Park, CV Raman Nagar' },
    { time: '06:20 PM', place: 'Gym',                address: 'Cult Fit, Indiranagar'         },
    { time: '08:05 PM', place: 'Home',               address: '14 MG Road, Bengaluru, 560001' },
  ];

  // Last seen is the most recent entry
  const lastSeen = history[history.length - 1];

  // Google Maps link for last seen location
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lastSeen.address)}`;

  // Embed preview (static map via OpenStreetMap — no API key needed)
  const embedSrc = `https://www.openstreetmap.org/export/embed.html?bbox=77.5946,12.9716,77.6046,12.9816&layer=mapnik&marker=12.9716,77.5946`;

  return (
    <>
      <button className="back-btn" onClick={onBack}>
        ← Back to contacts
      </button>

      {/* Contact header */}
      <div className="location-header">
        <div className="device-avatar">{contact.initials}</div>
        <div className="location-info">
          <div className="location-name">{contact.name}</div>
          <div className="location-number">{contact.number}</div>
        </div>
      </div>

      <div className="location-grid">

        {/* Last seen card */}
        <div className="location-card">
          <div className="location-card-title">Last Known Location</div>
          <div className="last-seen-time">8:05 PM</div>
          <div className="last-seen-date">Today, April 24 2026</div>
          <div className="last-seen-address">📍 {lastSeen.address}</div>
          <a className="maps-btn" href={mapsLink} target="_blank" rel="noreferrer">
            Open in Google Maps ↗
          </a>
          <div className="map-embed">
            <iframe
              title="Location preview"
              src={embedSrc}
              allowFullScreen
            />
          </div>
        </div>

        {/* Location history */}
        <div className="location-card">
          <div className="location-card-title">Location History — Today</div>
          <div className="history-list">
            {history.map((item, i) => (
              <div className="history-item" key={i}>
                <div className="history-dot" />
                <div className="history-time">{item.time}</div>
                <div>
                  <div className="history-place">{item.place}</div>
                  <div className="history-address">{item.address}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Movement summary */}
      <div className="location-card">
        <div className="location-card-title">Movement Summary</div>
        <p className="summary-box-body">
          {contact.name} started their day at home on MG Road at around 10:42 AM. They made a quick stop at a petrol bunk before heading to Forum Mall in Koramangala for about an hour and a half. The afternoon was spent at a café in Indiranagar followed by a long stretch at the office in Bagmane Tech Park. After work they visited the gym in Indiranagar before returning home by 8:05 PM. Total distance covered today is approximately <strong>34 km</strong> across <strong>7 locations</strong>.
        </p>

        <div className="summary-box" style={{ marginTop: '16px' }}>
          <div className="summary-box-title">Where They Might Go Next</div>
          <div className="prediction-list">
            <div className="prediction-item">
              <div className="prediction-dot" />
              Based on the past 14 days, {contact.name} typically visits a <strong>grocery store</strong> near Indiranagar on Friday evenings after the gym.
            </div>
            <div className="prediction-item">
              <div className="prediction-dot" />
              They have visited <strong>Church Street Social</strong> every Saturday night for the past 3 weeks — a visit tomorrow evening is likely.
            </div>
            <div className="prediction-item">
              <div className="prediction-dot" />
              Morning routines suggest a <strong>coffee shop stop</strong> near their office before 9:30 AM tomorrow.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}