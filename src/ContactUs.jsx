import React, { useState } from 'react';
import './ContactUs.css'; // Ensure to import the CSS file

const ContactUs = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const apiUrl = process.env.REACT_APP_AWS_API_CONTACT_ENDPOINT;

      const response = await fetch(`${apiUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          message,
        }),
      });

      const responseData = await response.json();

      if (response.ok) {
        setPopupMessage(`Message sent successfully! We will respond to your case shortly.Your Case ID is: ${responseData.caseId}`);
        setPopupType('success');
        setName('');
        setEmail('');
        setMessage('');
      } else {
        setPopupMessage(`Failed to send message: ${responseData.error || 'Unknown error.'}`);
        setPopupType('error');
      }
    } catch {
      setPopupMessage('An error occurred while sending your message. Please try again.');
      setPopupType('error');
    }

    setTimeout(() => {
      setPopupMessage('');
    }, 5000); // Popup disappears after 3 seconds
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
            required
          />

          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="message">Message:</label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          ></textarea>

          <button type="submit" className="submit-button">Send Message</button>
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
