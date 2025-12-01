import { useEffect, useState } from 'react';
import api from '../api/axios';
//import '../styles/admin.css';
import AdminNavbar from '../components/AdminNavbar'; // Import the AdminNavbar component
//import '../styles/ManageMenu.css';

const ManageMenu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [newItem, setNewItem] = useState({ ItemName: '', Category: '', Price: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const menuRes = await api.get('/api/menu');
        setMenuItems(menuRes.data.data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch menu:', err);
        setError('Failed to load menu items');
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddItem = async () => {
    if (!newItem.ItemName || !newItem.Category || !newItem.Price) {
      setError('Please fill all fields');
      return;
    }

    try {
      await api.post('/api/menu', {
        ItemName: newItem.ItemName,
        Category: newItem.Category,
        Price: parseFloat(newItem.Price),
      });
      const updated = await api.get('/api/menu');
      setMenuItems(updated.data.data);
      setNewItem({ ItemName: '', Category: '', Price: '' });
      setError(null);
    } catch (err) {
      console.error('Add failed:', err);
      setError('Failed to add menu item');
    }
  };

  const handlePriceUpdate = async (id, price) => {
    try {
      await api.put(`/api/menu/${id}`, { Price: parseFloat(price) });
      setMenuItems(prev =>
        prev.map(item => (item.ItemID === id ? { ...item, Price: price } : item))
      );
      setError(null);
    } catch (err) {
      console.error('Price update failed:', err);
      setError('Failed to update price');
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      await api.delete(`/api/menu/${id}`);
      setMenuItems(prev => prev.filter(item => item.ItemID !== id));
      setError(null);
    } catch (err) {
      console.error('Delete failed:', err);
      setError('Failed to delete item');
    }
  };

  if (loading) return (
    <div>
      <AdminNavbar />
      <div className="loading">Loading menu...</div>
    </div>
  );

  if (error) return (
    <div>
      <AdminNavbar />
      <div className="error">Error: {error}</div>
    </div>
  );

  return (
    <div>
      <AdminNavbar />
      <div className="admin-container">
        <h2>Manage Menu</h2>

        {error && <div className="error-message">{error}</div>}

        <div className="admin-form">
          <h3>Add Menu Item</h3>
          <input
            type="text"
            placeholder="Item Name"
            value={newItem.ItemName}
            onChange={e => setNewItem({ ...newItem, ItemName: e.target.value })}
          />
          <input
            type="text"
            placeholder="Category"
            value={newItem.Category}
            onChange={e => setNewItem({ ...newItem, Category: e.target.value })}
          />
          <input
            type="number"
            step="0.01"
            placeholder="Price"
            value={newItem.Price}
            onChange={e => setNewItem({ ...newItem, Price: e.target.value })}
          />
          <button className="btn btn-primary" onClick={handleAddItem}>
            Add Item
          </button>
        </div>

        <h3>Existing Menu</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Update</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {menuItems.map(item => (
              <tr key={item.ItemID}>
                <td>{item.ItemName}</td>
                <td>{item.Category}</td>
                <td>
                  <input
                    type="number"
                    value={item.Price}
                    step="0.01"
                    onChange={e => {
                      const newPrice = e.target.value;
                      setMenuItems(prev =>
                        prev.map(m =>
                          m.ItemID === item.ItemID ? { ...m, Price: newPrice } : m
                        )
                      );
                    }}
                  />
                </td>
                <td>
                  <button
                    className="btn btn-success"
                    onClick={() => handlePriceUpdate(item.ItemID, item.Price)}
                  >
                    Save
                  </button>
                </td>
                <td>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDeleteItem(item.ItemID)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageMenu;