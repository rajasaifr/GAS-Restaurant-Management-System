import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import api from '../api/axios';
import '../styles/user.css';
import Navbar from '../components/Navbar';

const PaymentHistory = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await api.get(`/payments/customer/${user.UserID}`);
        // No need to filter here since API already filters for completed payments
        setPayments(response.data.data);
      } catch (err) {
        console.error('Failed to fetch payments:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, [user]);

  if (loading) return <div>Loading...</div>;

  return (
    <>
    <Navbar/>
    <div className="user-container">
      <h2>Payment History</h2>
      {payments.length > 0 ? (
        <table className="user-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Status</th>
              <th>Order</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(payment => (
              <tr key={payment.PaymentID}>
                <td>{new Date(payment.PaymentDate).toLocaleDateString()}</td>
                <td>${payment.Amount.toFixed(2)}</td>
                <td>{payment.PaymentMethod}</td>
                <td>{payment.PaymentStatus || 'N/A'}</td>
                <td>#{payment.OrderID}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No completed payments found</p>
      )}
    </div>
    </>
  );
};

export default PaymentHistory;