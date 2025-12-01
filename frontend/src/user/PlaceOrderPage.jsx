import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../auth/AuthContext';
import Navbar from '../components/Navbar';
import '../styles/user.css';

const PlaceOrderPage = () => {
  const { user } = useAuth();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [order, setOrder] = useState([]);
  const [groupedMenuItems, setGroupedMenuItems] = useState({});
  const [discountInfo, setDiscountInfo] = useState({
    isMember: false,
    discountApplied: 0,
    subtotal: 0,
    total: 0
  });

  // Fetch menu items from API
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await api.get('/menu');
        const data = response.data?.data || response.data.menuItems || response.data;

        if (!Array.isArray(data)) {
          throw new Error('Invalid menu data format');
        }

        const formatted = data.map(item => ({
          ItemID: item.ItemID,
          ItemName: item.ItemName,
          Price: parseFloat(item.Price), // Base price for display only
          Category: item.Category || 'Other',
          quantity: 0
        }));

        setMenuItems(formatted);
        setLoading(false);
      } catch (err) {
        console.error('Menu fetch error:', err);
        setError('Failed to load menu');
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  useEffect(() => {
    const grouped = menuItems.reduce((acc, item) => {
      if (!acc[item.Category]) acc[item.Category] = [];
      acc[item.Category].push(item);
      return acc;
    }, {});
    setGroupedMenuItems(grouped);
  }, [menuItems]);

  const handleQuantityChange = (category, itemId, newQuantity) => {
    const quantity = Math.max(parseInt(newQuantity) || 0, 0);
    setGroupedMenuItems(prev => {
      const updated = { ...prev };
      updated[category] = updated[category].map(item =>
        item.ItemID === itemId ? { ...item, quantity } : item
      );
      return updated;
    });
  };

  const addToOrder = () => {
    const selectedItems = Object.values(groupedMenuItems)
      .flat()
      .filter(item => item.quantity > 0)
      .map(({ ItemID, ItemName, Price, quantity }) => ({
        ItemID,
        name: ItemName,
        basePrice: Price, // Store base price for display
        quantity
      }));

    setOrder(selectedItems);
    
    // Calculate subtotal (before discount)
    const subtotal = selectedItems.reduce((sum, item) => sum + (item.basePrice * item.quantity), 0);
    setDiscountInfo({
      isMember: user?.isMember || false,
      discountApplied: user?.isMember ? subtotal * 0.2 : 0,
      subtotal,
      total: user?.isMember ? subtotal * 0.8 : subtotal
    });
  };

  const placeOrder = async () => {
    if (!user) return alert('You must be logged in to place an order.');
    if (order.length === 0) return alert('Please add items to your order.');

    try {
      // 1. Create order
      const orderRes = await api.post('/orderByID', { userID: user.UserID });
      const OrderID = orderRes.data?.orderId;

      if (!OrderID) throw new Error('No OrderID returned');

      // 2. Insert order details (server will calculate prices)
      const orderDetails = await Promise.all(
        order.map(item => 
          api.post('/order-details', {
            OrderID,
            ItemID: item.ItemID,
            Quantity: item.quantity
          })
        )
      );

      // Get the actual prices with discounts from the response
      const orderItemsWithPrices = orderDetails.map((res, index) => ({
        ...order[index],
        finalPrice: res.data.data.Price,
        discountApplied: res.data.data.discountApplied
      }));

      // Calculate total discount and final total
      const totalDiscount = orderItemsWithPrices.reduce(
        (sum, item) => sum + item.discountApplied * item.quantity, 0
      );
      const finalTotal = orderItemsWithPrices.reduce(
        (sum, item) => sum + item.finalPrice * item.quantity, 0
      );

      // 3. Insert payment with the final total
      await api.post('/PayPayments', {
        OrderID,
        UserID: user.UserID,
        Amount: finalTotal,
      });

      // Update discount info for display
      setDiscountInfo({
        isMember: user.isMember,
        discountApplied: totalDiscount,
        subtotal: order.reduce((sum, item) => sum + (item.basePrice * item.quantity), 0),
        total: finalTotal
      });

      alert(`Order placed successfully! ${totalDiscount > 0 ? `(Member discount applied: $${totalDiscount.toFixed(2)})` : ''}`);
      
      // Reset all quantities
      setGroupedMenuItems(prev => {
        const reset = { ...prev };
        for (let category in reset) {
          reset[category] = reset[category].map(item => ({ ...item, quantity: 0 }));
        }
        return reset;
      });
    } catch (err) {
      console.error('Order placement error:', err);
      alert('Failed to place order. Try again.');
    }
  };

  return (
    <>
      <Navbar />
      <div className="place-order-container">
        <h1 className="order-page-title">Place Your Order</h1>

        {error && (
          <div className="error-message">
            <span>⚠️</span>
            {error}
          </div>
        )}

        <div className="order-layout">
          <div className="menu-section">
            {loading ? (
              <p className="loading">Loading menu...</p>
            ) : Object.keys(groupedMenuItems).length === 0 ? (
              <p>No menu items found.</p>
            ) : (
              Object.entries(groupedMenuItems).map(([category, items]) => (
                <div key={category} className="category-card">
                  <h3 className="category-title">{category}</h3>
                  <table className="order-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Price</th>
                        <th>Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map(item => (
                        <tr key={item.ItemID}>
                          <td>{item.ItemName}</td>
                          <td>${item.Price.toFixed(2)}</td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              value={item.quantity}
                              onChange={e => handleQuantityChange(category, item.ItemID, e.target.value)}
                              className="quantity-input"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))
            )}

            <button
              onClick={addToOrder}
              className="update-order-btn"
            >
              Update Order
            </button>
          </div>

          {/* Order Summary */}
          <div className="order-summary">
            <h3 className="order-summary-title">Order Summary</h3>
            {order.length === 0 ? (
              <p className="empty-order-message">No items selected yet.</p>
            ) : (
              <div>
                <div className="order-items-list">
                  {order.map((item, i) => (
                    <div key={i} className="order-item">
                      <span>{item.quantity}x {item.name}</span>
                      <span>€{(item.basePrice * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                
                {user?.isMember && (
                  <div className="discount-info">
                    <div className="order-item">
                      <span>Member discount (20%)</span>
                      <span>-€{discountInfo.discountApplied.toFixed(2)}</span>
                    </div>
                  </div>
                )}
                
                <div className="order-total">
                  <span>Total:</span>
                  <span>€{discountInfo.total.toFixed(2)}</span>
                </div>
                
                <button
                  onClick={placeOrder}
                  className="place-order-btn"
                >
                  Place Order
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PlaceOrderPage;