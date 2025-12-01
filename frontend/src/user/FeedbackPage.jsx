import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import '../styles/user.css';

const FeedbackPage = () => {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [feedbackHistory, setFeedbackHistory] = useState([]);

  // Use useCallback to memoize the function
  const fetchFeedbackHistory = useCallback(async () => {
    try {
      const response = await api.get(`/api/feedback/user/${user.UserID}`);
      setFeedbackHistory(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch feedback history:', err);
    }
  }, [user]);

  useEffect(() => {
    if (user?.UserID) {
      fetchFeedbackHistory();
    }
  }, [user, fetchFeedbackHistory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/api/feedback', {
        userId: user.UserID,
        rating,
        comments
      });

      if (response.data.success) {
        setSubmitted(true);
        setComments('');
        fetchFeedbackHistory(); // Refresh history
      } else {
        throw new Error(response.data.error || 'Failed to submit feedback');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <>
        <Navbar />
        <div className="user-container">
          <div className="success-message">
            <h2>Thank You for Your Feedback!</h2>
            <p>We appreciate you taking the time to share your experience with us.</p>
            <button 
              onClick={() => setSubmitted(false)}
              className="btn btn-primary"
            >
              Submit Another Feedback
            </button>
          </div>
          <FeedbackHistory feedback={feedbackHistory} />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="user-container">
        <h2>Share Your Feedback</h2>
        
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="feedback-form">
          <div className="form-group">
            <label>Rating (1-10):</label>
            <div className="rating-selector">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <button
                  key={num}
                  type="button"
                  className={`rating-option ${rating === num ? 'selected' : ''}`}
                  onClick={() => setRating(num)}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Comments (optional):</label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows="5"
              placeholder="Share your experience with us..."
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>

        <FeedbackHistory feedback={feedbackHistory} />
      </div>
    </>
  );
};

const FeedbackHistory = ({ feedback }) => {
  if (feedback.length === 0) return null;

  return (
    <div className="feedback-history">
      <h3>Your Previous Feedback</h3>
      <div className="history-list">
        {feedback.map((item) => (
          <div key={item.FeedbackID} className="feedback-item">
            <div className="feedback-header">
              <span className="rating-badge">Rating: {item.Rating}/10</span>
              <span className="feedback-date">
                {new Date(item.FeedbackDate).toLocaleDateString()}
              </span>
            </div>
            {item.Comments && (
              <div className="feedback-comments">
                <p>{item.Comments}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeedbackPage;