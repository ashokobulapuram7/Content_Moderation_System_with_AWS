import React from 'react';
import './SampleContent.css';

const sampleData = [
  {
    type: 'image',
    src: 'https://plus.unsplash.com/premium_photo-1719943510748-4b4354fbcf56',
    status: 'Approved',
    labels: [
      { name: 'Nature', confidence: 98 },
      { name: 'Outdoor', confidence: 92 },
    ],
  },
  {
    type: 'image',
    src: 'https://images.unsplash.com/photo-1550483795-c70ec4819718',
    status: 'Flagged',
    labels: [
      { name: 'Explicit Content', confidence: 87 },
      { name: 'Adult Content', confidence: 83 },
    ],
  },
  {
    type: 'video',
    src: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
    status: 'Approved',
    labels: [
      { name: 'Wildlife', confidence: 95 },
      { name: 'Animals', confidence: 89 },
    ],
  },
];

const SampleContent = () => {
  return (
    <div className="sample-content-container">
      <h2>Sample Content</h2>
      <p className="intro-text">
        Explore sample content processed by the moderation pipeline. Approved content is indicated with green highlights, while flagged content is highlighted in red.
      </p>

      {/* Example Cards */}
      <div className="content-display">
        {sampleData.map((content, index) => (
          <div
            key={index}
            className={`content-item ${
              content.status === 'Approved' ? 'approved' : 'flagged'
            }`}
          >
            {content.type === 'image' ? (
              <img src={content.src} alt={`Sample ${index}`} loading="lazy" />) : (
              <video controls>
                <source src={content.src} type="video/mp4" />
                Your browser does not support the video tag.
                </video>
              )}
            <div className="status-info">
              <h3>
                {content.status === 'Approved' ? (
                  <span className="status-approved">✅ Approved</span>
                ) : (
                  <span className="status-flagged">⚠️ Flagged</span>
                )}
              </h3>
              <ul>
                {content.labels.map((label, i) => (
                  <li key={i}>
                    {label.name} - {label.confidence}%
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Sections: Limitations, Project Flow, FAQs */}
      <div className="align-sections">
        <div className="shared-section limitations-section">
          <h3>Content Upload Limitations</h3>
          <ul>
            <li>Images should not exceed <strong>4 MB</strong>.Try to keep it as less size as possible.</li>
            <li>Video duration must be less than <strong>10 seconds.</strong>Please make sure the video should be less than 3 or 4 MB</li>
            <li>Accepted formats include <strong>JPG, PNG, MP4</strong>.</li>
            <li>Content with <strong>distortion</strong> or <strong>blur</strong> may lead to inaccurate results.</li>
            <li><strong>Text-heavy images</strong> may not be fully analyzed.</li>
          </ul>
        </div>

        <div className="shared-section project-flow">
          <h3>Project Flow</h3>
          <ol>
            <li><strong>File Upload:</strong> Users upload an image or video through the UI.</li>
            <li><strong>API Gateway:</strong> The request triggers an AWS Lambda function.</li>
            <li><strong>S3 Upload:</strong> Files are stored in an S3 bucket, triggering moderation.</li>
            <li><strong>Moderation:</strong> AWS Rekognition analyzes the file for flagged content.</li>
            <li><strong>Results Display:</strong> Moderation results are shown on the UI.</li>
          </ol>
        </div>

        <div className="shared-section faq-section">
          <h3>Frequently Asked Questions</h3>
          <div className="faq-item">
            <h4>What is content moderation?</h4>
            <p>Content moderation is the process of monitoring and reviewing user-generated content to ensure it aligns with platform policies and guidelines. This helps maintain a safe and respectful community while preventing the spread of harmful or inappropriate material.</p>
          </div>
          <div className="faq-item">
            <h4>What file types can I upload?</h4>
            <p>Currently, the platform supports uploading JPEG, PNG images, and MP4 videos. Files should meet the size and duration limitations to ensure smooth processing.</p>
          </div>
          <div className="faq-item">
            <h4>What does "flagged" content mean?</h4>
            <p>Flagged content refers to images or videos that have been detected as potentially violating guidelines. These are marked in red and should be reviewed for further action.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SampleContent;
