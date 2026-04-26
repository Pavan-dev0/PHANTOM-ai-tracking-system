import React, { useState } from 'react';

export default function Profile() {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+91 98765 43210',
    role: 'Lead Investigator',
    clearance: 'ALPHA',
    assignedCases: '5',
  });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  return (
    <div>
      <h1 className="page-title">INVESTIGATOR PROFILE</h1>
      <p className="page-sub">Manage your personal information.</p>

      <div className="profile-card">
        <div className="profile-avatar profile-avatar-investigator">JD</div>
        <div className="profile-info">
          <div className="profile-name">{form.name}</div>
          <div className="profile-role">{form.role}</div>
        </div>
        <button
          className="profile-edit-btn profile-edit-btn-investigator"
          onClick={() => setEditing(prev => !prev)}
        >
          {editing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      <div className="placeholder-box" style={{ marginTop: '20px' }}>
        <div className="profile-fields">
          {[
            { label: 'Full Name', name: 'name', type: 'text' },
            { label: 'Email',         name: 'email', type: 'email' },
            { label: 'Phone Number',  name: 'phone', type: 'tel' },
            { label: 'Role', name: 'role', type: 'text' },
            { label: 'Clearance Level', name: 'clearance', type: 'text' },
            { label: 'Cases Assigned', name: 'assignedCases', type: 'text' },
          ].map(field => (
            <div className="profile-field" key={field.name}>
              <label className="profile-label">{field.label}</label>
              {editing
                ? <input
                    className="locate-input"
                    type={field.type}
                    name={field.name}
                    value={form[field.name]}
                    onChange={handleChange}
                  />
                : <div className="profile-value">{form[field.name]}</div>
              }
            </div>
          ))}
        </div>

        {editing && (
          <button className="locate-btn" style={{ marginTop: '20px' }} onClick={() => setEditing(false)}>
            Save Changes
          </button>
        )}
      </div>
    </div>
  );
}
