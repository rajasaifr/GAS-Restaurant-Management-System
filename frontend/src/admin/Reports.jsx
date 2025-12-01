import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import AdminNavbar from '../components/AdminNavbar';
//import '../styles/admin.css';

const Reports = () => {
  const [activeReport, setActiveReport] = useState('revenue');
  const [revenueData, setRevenueData] = useState([]);
  const [popularItemsData, setPopularItemsData] = useState([]);
  const [busyTimesData, setBusyTimesData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (activeReport === 'revenue') {
          const res = await api.get('/api/reports/revenue-by-day');
          setRevenueData(res.data.data);
        } 
        else if (activeReport === 'popular') {
          const res = await api.get('/api/reports/popular-items');
          setPopularItemsData(res.data.data);
        }
        else if (activeReport === 'busy') {
          const res = await api.get('/api/reports/busiest-times');
          setBusyTimesData(res.data.data);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeReport]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div>
      <AdminNavbar />
      <div className="admin-container">
        <h1>Restaurant Reports</h1>
        
        <div className="report-selector">
          <button 
            className={`report-tab ${activeReport === 'revenue' ? 'active' : ''}`}
            onClick={() => setActiveReport('revenue')}
          >
            Revenue by Day
          </button>
          <button 
            className={`report-tab ${activeReport === 'popular' ? 'active' : ''}`}
            onClick={() => setActiveReport('popular')}
          >
            Popular Items
          </button>
          <button 
            className={`report-tab ${activeReport === 'busy' ? 'active' : ''}`}
            onClick={() => setActiveReport('busy')}
          >
            Busiest Times
          </button>
        </div>

        {loading && <div className="loading">Loading report data...</div>}
        {error && <div className="error-message">Error: {error}</div>}

        {activeReport === 'revenue' && (
          <div className="report-section">
            <h2>Revenue by Day</h2>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {revenueData.length > 0 ? (
                  revenueData.map((row, index) => (
                    <tr key={index}>
                      <td>{new Date(row.Date).toLocaleDateString()}</td>
                      <td>{formatCurrency(row.Revenue)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="2" className="text-center">No revenue data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeReport === 'popular' && (
          <div className="report-section">
            <h2>Most Popular Menu Items</h2>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Orders</th>
                  <th>Total Quantity</th>
                </tr>
              </thead>
              <tbody>
                {popularItemsData.length > 0 ? (
                  popularItemsData.map((row, index) => (
                    <tr key={index}>
                      <td>{row.Item}</td>
                      <td>{row.Orders}</td>
                      <td>{row.TotalQuantity}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="text-center">No popular items data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeReport === 'busy' && (
          <div className="report-section">
            <h2>Busiest Times</h2>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Time Slot</th>
                  <th>Reservations</th>
                </tr>
              </thead>
              <tbody>
                {busyTimesData.length > 0 ? (
                  busyTimesData.map((row, index) => (
                    <tr key={index}>
                      <td>{row.TimeSlot}</td>
                      <td>{row.Reservations}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="2" className="text-center">No busy times data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;