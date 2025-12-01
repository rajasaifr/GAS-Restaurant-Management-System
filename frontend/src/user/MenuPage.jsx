import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import '../styles/user.css';

const MenuPage = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await api.get('/menu');
        setMenuItems(response.data.data || []);
      } catch (err) {
        console.error('Failed to fetch menu:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  // Group items by category
  const groupedMenuItems = menuItems.reduce((acc, item) => {
    const category = item.Category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {});

  return (
    <>
      <Navbar />
      <div className="menu-container">
        <h1 className="menu-title">Our Menu</h1>

        {loading ? (
          <div className="loading">Loading menu...</div>
        ) : (
          <div className="menu-content">
            {Object.entries(groupedMenuItems).map(([category, items]) => (
              <div key={category} className="menu-category">
                <h2 className="category-title">{category}</h2>
                <div className="menu-items">
                  {items.map((item) => (
                    <div key={item._id || item.ItemName} className="menu-item">
                      <div className="item-details">
                        <span className="item-name">{item.ItemName || 'Unknown Dish'}</span>
                        {item.Description && (
                          <p className="item-description">{item.Description}</p>
                        )}
                      </div>
                      <span className="item-price">
                        ${parseFloat(item.Price || 0).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default MenuPage;