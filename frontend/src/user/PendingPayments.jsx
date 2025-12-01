import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import '../styles/user.css';

const PendingPayments = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(null);

  // Fetch pending payments
  useEffect(() => {
    const fetchPendingPayments = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await api.get(`/PendingPayments/customer/${user.UserID}`);
        
        if (response.data.success) {
          setPayments(response.data.data || []);
        } else {
          throw new Error(response.data.error || 'Failed to fetch payments');
        }
      } catch (err) {
        console.error('Payment fetch error:', err);
        setError(err.response?.data?.error || err.message || 'Failed to load payments');
      } finally {
        setLoading(false);
      }
    };

    if (user?.UserID) {
      fetchPendingPayments();
    }
  }, [user]);

  const handlePayNow = async (paymentId) => {
    try {
      setProcessingPayment(paymentId);
      
      const response = await api.post(`/api/payments/${paymentId}/complete`);
      
      if (response.data.success) {
        const updatedResponse = await api.get(`/PendingPayments/customer/${user.UserID}`);
        setPayments(updatedResponse.data.data || []);
        alert('Payment completed successfully!');
      } else {
        throw new Error(response.data.error || 'Payment failed');
      }
    } catch (err) {
      console.error('Payment error:', err);
      alert(`Payment failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setProcessingPayment(null);
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner-circle"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pending-payments-container">
        <div className="error-message">
          <span>⚠️</span>
          {error}
          <button 
            onClick={() => window.location.reload()}
            className="retry-button"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="pending-payments-container">
        <h1 className="payments-title">Pending Payments</h1>

        {payments.length === 0 ? (
          <div className="empty-payments">
            <p className="empty-payments-text">No pending payments found</p>
          </div>
        ) : (
          <div className="payments-table-container">
            <table className="payments-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.PaymentID}>
                    <td>
                      <div className="order-id">Order #{payment.OrderID}</div>
                      <div className="order-status">{payment.OrderStatus}</div>
                    </td>
                    <td className="amount">${payment.Amount.toFixed(2)}</td>
                    <td className="payment-method">{payment.PaymentMethod}</td>
                    <td className="payment-date">
                      {new Date(payment.PaymentDate).toLocaleDateString()}
                    </td>
                    <td>
                      <span className="status-badge status-pending">
                        {payment.PaymentStatus}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handlePayNow(payment.PaymentID)}
                        disabled={processingPayment === payment.PaymentID}
                        className={`pay-button ${
                          processingPayment === payment.PaymentID 
                            ? 'pay-button-processing' 
                            : 'pay-button-default'
                        }`}
                      >
                        {processingPayment === payment.PaymentID ? (
                          <span className="flex items-center">
                            <svg className="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" width="16" height="16">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"></circle>
                              <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </span>
                        ) : 'Pay Now'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default PendingPayments;