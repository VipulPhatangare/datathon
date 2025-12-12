import { useState, useEffect } from 'react';
import { adminAPI } from '../api';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [answerCSV, setAnswerCSV] = useState(null);
  const [config, setConfig] = useState({ defaultUploadLimit: 15 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // User form state
  const [userForm, setUserForm] = useState({
    email: '',
    password: '',
    teamName: '',
    role: 'user',
    uploadLimit: ''
  });
  const [editingUserId, setEditingUserId] = useState(null);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'answer-csv') {
      fetchAnswerCSV();
    } else if (activeTab === 'config') {
      fetchConfig();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      const response = await adminAPI.getUsers();
      setUsers(response.data.users);
    } catch (err) {
      setError('Failed to load users');
    }
  };

  const fetchAnswerCSV = async () => {
    try {
      const response = await adminAPI.getAnswerCSV();
      setAnswerCSV(response.data.answerCSV);
    } catch (err) {
      setError('Failed to load answer CSV info');
    }
  };

  const fetchConfig = async () => {
    try {
      const response = await adminAPI.getConfig('defaultUploadLimit');
      setConfig({ defaultUploadLimit: response.data.value });
    } catch (err) {
      setError('Failed to load configuration');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const userData = {
        ...userForm,
        uploadLimit: userForm.uploadLimit ? parseInt(userForm.uploadLimit) : null
      };
      
      await adminAPI.createUser(userData);
      setSuccess('User created successfully');
      setUserForm({ email: '', password: '', teamName: '', role: 'user', uploadLimit: '' });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const userData = {
        ...userForm,
        uploadLimit: userForm.uploadLimit ? parseInt(userForm.uploadLimit) : null
      };
      
      await adminAPI.updateUser(editingUserId, userData);
      setSuccess('User updated successfully');
      setEditingUserId(null);
      setUserForm({ email: '', password: '', teamName: '', role: 'user', uploadLimit: '' });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const startEditUser = (user) => {
    setEditingUserId(user._id);
    setUserForm({
      email: user.email,
      password: '', // Don't populate password
      teamName: user.teamName,
      role: user.role,
      uploadLimit: user.uploadLimit || ''
    });
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setUserForm({ email: '', password: '', teamName: '', role: 'user', uploadLimit: '' });
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await adminAPI.deleteUser(userId);
      setSuccess('User deleted successfully');
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete user');
    }
  };

  const handleUploadAnswerCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await adminAPI.uploadAnswerCSV(file);
      setSuccess(`Answer CSV uploaded successfully! ${response.data.rowCount} rows loaded.`);
      fetchAnswerCSV();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload answer CSV');
    } finally {
      setLoading(false);
      e.target.value = ''; // Reset file input
    }
  };

  const handleUpdateConfig = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await adminAPI.updateConfig('defaultUploadLimit', config.defaultUploadLimit);
      setSuccess('Configuration updated successfully');
    } catch (err) {
      setError('Failed to update configuration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-content">
      <div className="card">
        <h1 className="card-title">Admin Dashboard</h1>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            {success}
          </div>
        )}

        {/* Tabs */}
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Manage Users
          </button>
          <button 
            className={`tab ${activeTab === 'answer-csv' ? 'active' : ''}`}
            onClick={() => setActiveTab('answer-csv')}
          >
            Answer CSV
          </button>
          <button 
            className={`tab ${activeTab === 'config' ? 'active' : ''}`}
            onClick={() => setActiveTab('config')}
          >
            Configuration
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <h2 className="card-subtitle">
              {editingUserId ? 'Edit User' : 'Create New User'}
            </h2>
            
            <form onSubmit={editingUserId ? handleUpdateUser : handleCreateUser}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Password {editingUserId && '(leave blank to keep current)'}
                </label>
                <input
                  type="password"
                  className="form-input"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  required={!editingUserId}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Team Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={userForm.teamName}
                  onChange={(e) => setUserForm({ ...userForm, teamName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  className="form-input"
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Upload Limit (leave blank for default)
                </label>
                <input
                  type="number"
                  className="form-input"
                  value={userForm.uploadLimit}
                  onChange={(e) => setUserForm({ ...userForm, uploadLimit: e.target.value })}
                  min="1"
                />
              </div>

              <div className="flex gap-1">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {editingUserId ? 'Update User' : 'Create User'}
                </button>
                {editingUserId && (
                  <button type="button" className="btn btn-secondary" onClick={cancelEdit}>
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <h2 className="card-subtitle mt-2">All Users</h2>
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Team Name</th>
                    <th>Role</th>
                    <th>Upload Limit</th>
                    <th>Submissions</th>
                    <th>Best Accuracy</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td>{user.email}</td>
                      <td>{user.teamName}</td>
                      <td>{user.role}</td>
                      <td>{user.uploadLimit || 'Default'}</td>
                      <td>{user.submissionCount}</td>
                      <td>
                        {user.bestAccuracy 
                          ? `${(user.bestAccuracy * 100).toFixed(2)}%`
                          : 'N/A'
                        }
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <button
                            onClick={() => startEditUser(user)}
                            className="btn btn-secondary"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user._id)}
                            className="btn btn-danger"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Answer CSV Tab */}
        {activeTab === 'answer-csv' && (
          <div>
            <h2 className="card-subtitle">Upload Canonical Answer CSV</h2>
            
            <div className="alert alert-info">
              <strong>Note:</strong> Uploading a new answer CSV will replace the current one.
              The CSV must contain "row_id" and "label" columns.
            </div>

            {answerCSV && (
              <div className="alert alert-success">
                <strong>Current Answer CSV:</strong>
                <br />
                Filename: {answerCSV.filename}
                <br />
                Uploaded by: {answerCSV.uploadedBy?.email}
                <br />
                Rows: {answerCSV.rowCount}
                <br />
                Date: {new Date(answerCSV.uploadedAt).toLocaleString()}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Select CSV File</label>
              <input
                type="file"
                accept=".csv"
                onChange={handleUploadAnswerCSV}
                className="form-input"
                disabled={loading}
              />
            </div>
          </div>
        )}

        {/* Configuration Tab */}
        {activeTab === 'config' && (
          <div>
            <h2 className="card-subtitle">Global Configuration</h2>
            
            <form onSubmit={handleUpdateConfig}>
              <div className="form-group">
                <label className="form-label">Default Upload Limit</label>
                <input
                  type="number"
                  className="form-input"
                  value={config.defaultUploadLimit}
                  onChange={(e) => setConfig({ ...config, defaultUploadLimit: parseInt(e.target.value) })}
                  min="1"
                  required
                />
                <small className="text-muted">
                  This is the default number of submissions allowed per user.
                  You can override this for individual users.
                </small>
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading}>
                Update Configuration
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
