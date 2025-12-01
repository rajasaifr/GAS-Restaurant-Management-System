import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import api from '../api/axios';
import Navbar from '../components/AdminNavbar';
import { useNavigate } from 'react-router-dom';

const ViewFeedback = () => {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch all feedback
  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await api.get('/api/feedback');
        
        if (response.data.success) {
          setFeedback(response.data.data || []);
        } else {
          throw new Error(response.data.message || 'Failed to fetch feedback');
        }
      } catch (err) {
        console.error('Feedback fetch error:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load feedback');
        
        // If unauthorized, redirect to home
        if (err.response?.status === 403) {
          navigate('/');
        }
      } finally {
        setLoading(false);
      }
    };

    if (user?.isAdmin) {
      fetchFeedback();
    } else {
      navigate('/');
    }
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-500">
        {error}
        <button 
          onClick={() => window.location.reload()}
          className="ml-4 px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="p-4 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Customer Feedback</h2>

        {feedback.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-500 text-lg">No feedback received yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comments</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {feedback.map((item) => (
                  <tr key={item.FeedbackID} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.UserName}</div>
                      <div className="text-sm text-gray-500">ID: {item.UserID}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-lg font-bold text-yellow-500 mr-2">
                          {item.Rating}/10
                        </div>
                        <div className="w-32 bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-yellow-500 h-2.5 rounded-full" 
                            style={{ width: `${item.Rating * 10}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {item.Comments || <span className="text-gray-400">No comment</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(item.FeedbackDate).toLocaleDateString()}
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

export default ViewFeedback;