import React, { useState, useRef } from 'react';
import './UploadPreview.css';

const UploadPreview = ({ uploadedFile, setUploadedFile, onUpload }) => {
  const fileInputRef = useRef(null);
  const [moderationResults, setModerationResults] = useState(null);
  const [isOversizedVideo, setIsOversizedVideo] = useState(false);
  const [isOversizedFile, setIsOversizedFile] = useState(false); // State for file size check
  const [polling, setPolling] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [generalError, setGeneralError] = useState(false); // New state for general errors
  const [detailed, setDetailed] = useState([]);
  const AWSuploadEndpoint = process.env.REACT_APP_AWS_API_UPLOAD_ENDPOINT;
  const AWSresultsEndpoint = process.env.REACT_APP_AWS_API_RESULTS_ENDPOINT;

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
    event.target.value = '';
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const selectedFile = event.dataTransfer.files[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processFile = async (file) => {
    setIsOversizedVideo(false);
    setIsOversizedFile(false);
    setGeneralError(false);
    removeFile();

    // Validate file size (4 MB limit)
    const maxSizeInMB = 4;
    if (file.size > maxSizeInMB * 1024 * 1024) {
      setIsOversizedFile(true);
      setUploadedFile(null);
      return;
    }

    // Check video duration if it's a video file
    if (file.type.startsWith('video/')) {
      const duration = await getVideoDuration(file);
      if (duration >= 11) {
        setIsOversizedVideo(true);
        setUploadedFile(null);
        return;
      }
    }

    previewFile(file);
  };

  const previewFile = (file) => {
    if (uploadedFile && uploadedFile.src) {
      URL.revokeObjectURL(uploadedFile.src);
    }

    const filePreview = {
      file: file,
      name: file.name,
      type: file.type,
      src: URL.createObjectURL(file),
    };

    setUploadedFile(filePreview);
    if (onUpload) onUpload(filePreview);
  };

  const getVideoDuration = (file) => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        resolve(video.duration);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const removeFile = () => {
    if (uploadedFile && uploadedFile.src) {
      URL.revokeObjectURL(uploadedFile.src);
    }
    setUploadedFile(null);
    setModerationResults(null);
    setPolling(false);
    setIsUploading(false);
    if (onUpload) onUpload(null);
  };

  const handleUploadToAPI = () => {
    if (uploadedFile) {
      setIsUploading(true);
      setGeneralError(false);

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Content = reader.result.split(',')[1];

        const fileData = {
          file_type: uploadedFile.type,
          file_size: uploadedFile.file.size,
          file_name: uploadedFile.name,
          file_content: base64Content,
        };

        fetch(`${AWSuploadEndpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fileData),
        })
          .then((response) => {
            if (!response.ok) throw new Error('Upload failed');
            return response.json();
          })
          .then((data) => {
            const parsedData = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
            const contentId = parsedData.content_id;
            startPolling(contentId);
          })
          .catch(() => {
            setGeneralError(true);
            setIsUploading(false);
          });
      };

      reader.readAsDataURL(uploadedFile.file);
    }
  };

  const startPolling = (contentId) => {
    if (!contentId) {
      setGeneralError(true);
      setIsUploading(false);
      return;
    }

    setPolling(true);
    let attempts = 0;
    const maxAttempts = 20;
    const pollInterval = 5000;

    const poll = () => {
      fetch(`${AWSresultsEndpoint}?content_id=${contentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
        .then((response) => {
          if (!response.ok) throw new Error('Polling failed');
          return response.json();
        })
        .then((data) => {
          const moderationStatus = data && data.moderationStatus;
          const labels = data && data.DetailedLabels ? JSON.parse(data.DetailedLabels) : [];

          if (moderationStatus === 'Approved') {
            setModerationResults(data);
            setPolling(false);
            setIsUploading(false);
          } else if (moderationStatus === 'Flagged') {
            setModerationResults(data);
            setDetailed(labels);
            setPolling(false);
            setIsUploading(false);
          } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(poll, pollInterval);
          } else {
            setGeneralError(true);
            setPolling(false);
            setIsUploading(false);
          }
        })
        .catch(() => {
          setGeneralError(true);
          setPolling(false);
          setIsUploading(false);
        });
    };

    setTimeout(poll, pollInterval);
  };

  const handleCloseNotification = () => {
    setIsOversizedVideo(false);
    setIsOversizedFile(false);
    setGeneralError(false); // Close general error notification
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  return (
    <div className="upload-card" role="main">
      <h2>Upload Content</h2>
      {!isUploading && (
        <div
          className={`upload-area ${isOversizedVideo || isOversizedFile || generalError ? 'disabled' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            multiple={false}
            style={{ display: 'none' }}
            ref={fileInputRef}
            id="file-upload"
            aria-label="Upload a file"
          />
          <label htmlFor="file-upload" style={{ cursor: 'pointer' }}>
            Drag and drop a file here or click to upload
          </label>
        </div>
      )}

      <div className="file-previews">
        {uploadedFile && (
          <div className="file-preview">
            {uploadedFile.type.startsWith('image/') ? (
              <img src={uploadedFile.src} alt={uploadedFile.name} className="preview-image" />
            ) : (
              <video width="100%" controls>
                <source src={uploadedFile.src} type={uploadedFile.type} />
                Your browser does not support the video tag.
              </video>
            )}
            <button onClick={removeFile} className="remove-btn" aria-label="Remove file">
              Upload New File
            </button>
          </div>
        )}
      </div>

      {!isUploading && (
        <button onClick={handleUploadToAPI} className="upload-btn" disabled={polling} aria-busy={polling}>
          {polling ? 'Waiting for Results...' : 'Upload'}
        </button>
      )}

      {isOversizedVideo && (
        <div className="notification-popup" role="alert">
          <p>Video duration exceeds 10 seconds. Please upload a shorter video.</p>
          <button onClick={handleCloseNotification} className="close-button" aria-label="Close notification">
            Close
          </button>
        </div>
      )}

      {isOversizedFile && (
        <div className="notification-popup" role="alert">
          <p>File size exceeds 5MB. Please upload a smaller file than 5MB.</p>
          <button onClick={handleCloseNotification} className="close-button" aria-label="Close notification">
            Close
          </button>
        </div>
      )}

      {generalError && (
        <div className="notification-popup" role="alert">
          <p>An error occurred. Please try again later.</p>
          <button onClick={handleCloseNotification} className="close-button" aria-label="Close notification">
            Close
          </button>
        </div>
      )}

      {moderationResults && (
        <div className="moderation-results" aria-live="polite">
          {moderationResults.moderationStatus === 'Approved' ? (
            <div className="approved-message">
              <h3>Content Approved ✅</h3>
              <p>Your content has been reviewed and is approved for use!</p>
            </div>
          ) : moderationResults.moderationStatus === 'Flagged' ? (
            <div>
              <h3>Moderation Results (Content Flagged):</h3>
              <table>
                <thead>
                  <tr>
                    <th>Label</th>
                    <th>Parent Label</th>
                    <th>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {detailed?.length > 0 ? (
                    detailed.map((label, index) => (
                      <tr key={index}>
                        <td>{label.Name}</td>
                        <td>{label.ParentName}</td>
                        <td>{label.Confidence.toFixed(2)}%</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3">No data available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="in-progress-message">
              <h3>Processing Moderation Results ⏳</h3>
              <p>Please wait while we complete the moderation review.</p>
            </div>
          )}
        </div>
      )}

      {isUploading && (
        <div className="loading-overlay">
          <div className="loader" aria-label="Processing..."></div>
          <p className="loading-text">
            {polling ? 'Getting moderation results... Please wait.' : 'Uploading your content...'}
          </p>
        </div>
      )}
    </div>
  );
};

export default UploadPreview;