import React,{useState} from 'react';

export function LocatePhone() {
  const [locating, setLocating] = useState(null);

  const contacts = [
    { id: 1, name: 'Sarah Johnson',  initials: 'SJ', number: '+91 98765 43210', online: true  },
    { id: 2, name: 'Mike Stevens',   initials: 'MS', number: '+91 91234 56789', online: true  },
    { id: 3, name: 'Priya Sharma',   initials: 'PS', number: '+91 87654 32109', online: false },
    { id: 4, name: 'David Chen',     initials: 'DC', number: '+91 99887 76655', online: true  },
    { id: 5, name: 'Anika Patel',    initials: 'AP', number: '+91 93456 78901', online: false },
  ];

  function handleLocate(id) {
    setLocating(id);
    setTimeout(() => setLocating(null), 3000);
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
            <span className={`device-status ${contact.online ? 'status-online' : 'status-offline'}`}>
              {contact.online ? 'Online' : 'Offline'}
            </span>
            <button
              className="locate-device-btn"
              disabled={!contact.online || locating === contact.id}
              onClick={() => handleLocate(contact.id)}
            >
              {locating === contact.id ? 'Locating...' : 'Locate'}
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
