import React, { useEffect, useRef, useState } from 'react';
import './ContactUs.css';
import { getSafeEndpoint } from './utils/endpoints';

const CONTACT_TIMEOUT_MS = 10000;
const POPUP_DISMISS_MS = 5000;
const MAX_NAME_LENGTH = 80;
const MAX_EMAIL_LENGTH = 254;
const MAX_MESSAGE_LENGTH = 1000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ContactUs = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const popupTimeoutRef = useRef(null);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    return () => {
      if (popupTimeoutRef.current) {
        clearTimeout(popupTimeoutRef.current);
      }
    };
  }, []);

  const showPopup = (text, type) => {
    setPopupMessage(text);
    setPopupType(type);
    if (popupTimeoutRef.current) {
      clearTimeout(popupTimeoutRef.current);
    }
    popupTimeoutRef.current = setTimeout(() => {
      setPopupMessage('');
      setPopupType('');
    }, POPUP_DISMISS_MS);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmittingRef.current) return;

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      showPopup('Please complete all fields before sending your message.', 'error');
      return;
    }

    if (
      trimmedName.length > MAX_NAME_LENGTH ||
      trimmedEmail.length > MAX_EMAIL_LENGTH ||
      trimmedMessage.length > MAX_MESSAGE_LENGTH ||
      !EMAIL_PATTERN.test(trimmedEmail)
    ) {
      showPopup('Please check your name, email, and message length before trying again.', 'error');
      return;
    }

    const apiUrl = getSafeEndpoint(process.env.REACT_APP_AWS_API_CONTACT_ENDPOINT);
    if (!apiUrl) {
      showPopup('The contact service is not configured correctly. Please try again later.', 'error');
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONTACT_TIMEOUT_MS);

    try {
      isSubmittingRef.current = true;
      setIsSubmitting(true);
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          message: trimmedMessage,
        }),
        signal: controller.signal,
      });

      let responseData = {};
      try {
        responseData = await response.json();
      } catch {
        responseData = {};
      }

      if (response.ok) {
        const caseId = responseData && responseData.caseId ? ` Your Case ID is: ${responseData.caseId}` : '';
        showPopup(`Message sent successfully! We will respond to your case shortly.${caseId}`, 'success');
        setName('');
        setEmail('');
        setMessage('');
      } else {
        showPopup('Failed to send message. Please try again later.', 'error');
      }
    } catch {
      showPopup('An error occurred while sending your message. Please try again.', 'error');
    } finally {
      clearTimeout(timeoutId);
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="contact-container">
        <h2>Contact Us</h2>
        <p>If you have any questions or feedback, feel free to reach out!</p>
        {popupMessage && (
          <div className={`popup ${popupType}`}>
            <p>{popupMessage}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="contact-form">
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={MAX_NAME_LENGTH}
            required
          />

          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={MAX_EMAIL_LENGTH}
            required
          />

          <label htmlFor="message">Message:</label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={MAX_MESSAGE_LENGTH}
            required
          ></textarea>

          <button type="submit" className="submit-button" disabled={isSubmitting} aria-busy={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </div>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>Contact Info</h3>
            <p>📧 Email: <a href="mailto:ashokkumarobulapuram@gmail.com">ashokkumarobulapuram@gmail.com</a></p>
            <p>🔗 LinkedIn: <a href="https://www.linkedin.com/in/venkata-ashok-kumar-obulapuram-503070218/" target="_blank" rel="noopener noreferrer">LinkedIn Profile</a></p>
            <p>🐙 GitHub: <a href="https://github.com/your-profile" target="_blank" rel="noopener noreferrer">GitHub Profile</a></p>
          </div>
          <div className="footer-section">
            <h3>Connect with Us</h3>
            <p>Follow us on social media for updates!</p>
            <p>🐦 Twitter: <a href="https://x.com/ashokobulapuram?s=21" target="_blank" rel="noopener noreferrer">Twitter Profile</a></p>
            <p>📸 Instagram: <a href="https://www.instagram.com/ashok_obulapuram/profilecard/?igsh=cmZ2b2x6dmN6bWFi" target="_blank" rel="noopener noreferrer">Instagram Profile</a></p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 Ashok Obulapuram. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default ContactUs;
