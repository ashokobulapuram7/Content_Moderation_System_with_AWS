import React, { useState } from 'react';
import './Feedback.css';

const Feedback = () => {
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="feedback-container">
      <div className="feedback-card">
        <h2>We Value Your Feedback</h2>
        <p>
          Your feedback helps us improve and create a better experience for you.
          Let us know what you think!
        </p>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="feedback-form">
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Enter your feedback here..."
              required
            ></textarea>
            <button type="submit" className="submit-btn">
              Submit Feedback
            </button>
          </form>
        ) : (
          <div className="thank-you-message">
            <h3>Thank you for your feedback!</h3>
            <p>We appreciate you taking the time to share your thoughts.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Feedback;
