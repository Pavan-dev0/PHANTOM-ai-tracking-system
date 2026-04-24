import React,{useState} from 'react';

export function MyDevices() {
  const [devices, setDevices] = useState([
    { id: 1, name: 'Sarah Johnson',  initials: 'SJ', number: '+91 98765 43210', status: 'approved' },
    { id: 2, name: 'Mike Stevens',   initials: 'MS', number: '+91 91234 56789', status: 'approved' },
    { id: 3, name: 'Priya Sharma',   initials: 'PS', number: '+91 87654 32109', status: 'approved' },
    { id: 4, name: 'David Chen',     initials: 'DC', number: '+91 99887 76655', status: 'approved' },
    { id: 5, name: 'Anika Patel',    initials: 'AP', number: '+91 93456 78901', status: 'approved' },
  ]);

  const [form, setForm] = useState({ name: '', number: '' });
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  function getInitials(name) {
    return name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  function handleAdd() {
    if (!form.name.trim() || !form.number.trim()) {
      setError('Both name and number are required.');
      return;
    }
    const newDevice = {
      id: Date.now(),
      name: form.name.trim(),
      initials: getInitials(form.name),
      number: form.number.trim(),
      online: false,
      status: 'pending',
    };
    setDevices(prev => [...prev, newDevice]);
    setForm({ name: '', number: '' });
    setShowForm(false);
    setError('');

    setTimeout(() => {
      setDevices(prev =>
        prev.map(d => d.id === newDevice.id ? { ...d, status: 'approved', online: true } : d)
      );
    }, 6000);
  }

  function handleRemove(id) {
    setDevices(prev => prev.filter(d => d.id !== id));
  }

  return (
    <>
      <h1 className="page-title">My Devices</h1>
      <p className="page-sub">Manage the profiles available in Locate Phone.</p>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button className="locate-btn" onClick={() => { setShowForm(prev => !prev); setError(''); }}>
          {showForm ? 'Cancel' : '+ Add Device'}
        </button>
      </div>

      {showForm && (
        <div className="location-card" style={{ marginBottom: '16px' }}>
          <div className="location-card-title">New Device</div>
          <p style={{ fontSize: '13px', color: '#5a7499', marginBottom: '12px' }}>
            A permission request will be sent to this number. They must accept before appearing in Locate Phone.
          </p>
          <div className="locate-input-wrap">
            <input
              className="locate-input"
              type="text"
              placeholder="Full name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
            <input
              className="locate-input"
              type="tel"
              placeholder="Phone number"
              value={form.number}
              onChange={e => setForm({ ...form, number: e.target.value })}
            />
            <button className="locate-btn" onClick={handleAdd}>Send Request</button>
          </div>
          {error && <p style={{ color: '#e24b4a', fontSize: '13px', marginTop: '6px' }}>{error}</p>}
        </div>
      )}

      {devices.length === 0 && (
        <div className="placeholder-box">No devices added yet. Click <strong>+ Add Device</strong> to get started.</div>
      )}

      <div className="devices-list">
        {devices.map(device => (
          <div className="device-card" key={device.id}>
            <div className="device-avatar" style={{ opacity: device.status === 'pending' ? 0.5 : 1 }}>
              {device.initials}
            </div>
            <div className="device-info">
              <div className="device-name">{device.name}</div>
              <div className="device-number">{device.number}</div>
              {device.status === 'pending' && (
                <div className="pending-label">Awaiting permission from device…</div>
              )}
            </div>
            
            {device.status === 'pending' && (
              <span className="device-status status-pending">Pending</span>
            )}
            <button className="remove-btn" onClick={() => handleRemove(device.id)}>
              Remove
            </button>
          </div>
        ))}
      </div>
    </>
  );
}