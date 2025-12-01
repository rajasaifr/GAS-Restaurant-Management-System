import { useState, useEffect } from 'react';
import api from '../api/axios';
import AdminNavbar from '../components/AdminNavbar';
//import '../styles/admin.css';

const ManageTables = () => {
  const [tables, setTables] = useState([]);
  const [tableTypes, setTableTypes] = useState([]);
  const [formData, setFormData] = useState({
    TableTypeID: '',
    Location: '',
    Capacity: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tablesRes, typesRes] = await Promise.all([
          api.get('/tables'),
          api.get('/table-types')
        ]);
        setTables(tablesRes.data.data);
        setTableTypes(typesRes.data.data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load table data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getTypeName = (typeId) => {
    const type = tableTypes.find(t => t.TableTypeID === typeId);
    return type ? type.Type : 'Unknown';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/tables', {
        ...formData,
        TableTypeID: parseInt(formData.TableTypeID),
        Capacity: parseInt(formData.Capacity)
      });
      setTables(prev => [...prev, response.data.data]);
      setFormData({ TableTypeID: '', Location: '', Capacity: '' });
      setSuccessMessage('Table added successfully!');
      setError(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to add table:', err);
      setError(err.response?.data?.message || 'Failed to add table');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this table?')) return;

    try {
      await api.delete(`/tables/${id}`);
      setTables(prev => prev.filter(table => table.TableID !== id));
      setSuccessMessage('Table deleted successfully!');
      setError(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to delete table:', err);
      setError(err.response?.data?.message || 'Failed to delete table');
    }
  };

  if (loading) return (
    <div>
      <AdminNavbar />
      <div className="loading">Loading table data...</div>
    </div>
  );

  return (
    <div>
      <AdminNavbar />
      <div className="admin-container">
        <h2>Manage Tables</h2>
        
        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}
        
        <div className="form-container">
          <h3>Add New Table</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Table Type</label>
              <select
                name="TableTypeID"
                value={formData.TableTypeID}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Type</option>
                {tableTypes.map(type => (
                  <option key={type.TableTypeID} value={type.TableTypeID}>
                    {type.Type}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                name="Location"
                value={formData.Location}
                onChange={handleInputChange}
                placeholder="e.g., Near window, Patio area"
                required
              />
            </div>
            <div className="form-group">
              <label>Capacity</label>
              <input
                type="number"
                name="Capacity"
                value={formData.Capacity}
                onChange={handleInputChange}
                required
                min="1"
                placeholder="Number of seats"
              />
            </div>
            <button type="submit" className="btn btn-primary">Add Table</button>
          </form>
        </div>

        <h3>Existing Tables</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Location</th>
              <th>Capacity</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tables.length === 0 ? (
              <tr><td colSpan="5" className="text-center">No tables found</td></tr>
            ) : (
              tables.map(table => (
                <tr key={table.TableID}>
                  <td>{table.TableID}</td>
                  <td>{getTypeName(table.TableTypeID)}</td>
                  <td>{table.Location || 'Not specified'}</td>
                  <td>{table.Capacity}</td>
                  <td>
                    <button 
                      onClick={() => handleDelete(table.TableID)}
                      className="btn btn-danger"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageTables;