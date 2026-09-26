import React, { useEffect, useRef, useState } from 'react';
import './UploadPreview.css';

const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024;
const MAX_VIDEO_DURATION_SECONDS = 10;
const ALLOWED_FILE_TYPES = new Set(['image/jpeg', 'image/png', 'video/mp4']);
const ALLOWED_FILE_EXTENSIONS = new Map([
  ['image/jpeg', ['.jpg', '.jpeg']],
  ['image/png', ['.png']],
  ['video/mp4', ['.mp4']],
]);
const UPLOAD_TIMEOUT_MS = 30000;
const POLL_TIMEOUT_MS = 10000;
const POLL_INTERVAL_MS = 5000;
const MAX_POLL_ATTEMPTS = 20;

const getSafeEndpoint = (value) => {
  if (!value || typeof value !== 'string') return null;

  try {
    const url = new URL(value.trim());
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
};

const fetchWithTimeout = (url, options, timeoutMs) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(url, { ...options, signal: controller.signal }).finally(() => {
    clearTimeout(timeoutId);
  });
};

const hasAllowedExtension = (file) => {
  const allowedExtensions = ALLOWED_FILE_EXTENSIONS.get(file.type) || [];
  const lowerName = file.name.toLowerCase();
  return allowedExtensions.some((extension) => lowerName.endsWith(extension));
};

const UploadPreview = ({ uploadedFile, setUploadedFile, onUpload }) => {
  const fileInputRef = useRef(null);
  const pollTimeoutRef = useRef(null);
  const currentPreviewUrlRef = useRef(null);
  const [moderationResults, setModerationResults] = useState(null);
  const [isOversizedVideo, setIsOversizedVideo] = useState(false);
  const [isOversizedFile, setIsOversizedFile] = useState(false);
  const [isUnsupportedFile, setIsUnsupportedFile] = useState(false);
  const [polling, setPolling] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [generalError, setGeneralError] = useState(false);
  const [configurationError, setConfigurationError] = useState(false);
  const [detailed, setDetailed] = useState([]);
  const AWSuploadEndpoint = getSafeEndpoint(process.env.REACT_APP_AWS_API_UPLOAD_ENDPOINT);
  const AWSresultsEndpoint = getSafeEndpoint(process.env.REACT_APP_AWS_API_RESULTS_ENDPOINT);

  const clearPollingTimer = () => {
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearPollingTimer();
      if (currentPreviewUrlRef.current) {
        URL.revokeObjectURL(currentPreviewUrlRef.current);
      }
    };
  }, []);

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
    setIsUnsupportedFile(false);
    setGeneralError(false);
    setConfigurationError(false);
    removeFile();

    if (!ALLOWED_FILE_TYPES.has(file.type) || !hasAllowedExtension(file)) {
      setIsUnsupportedFile(true);
      setUploadedFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setIsOversizedFile(true);
      setUploadedFile(null);
      return;
    }

    if (file.type === 'video/mp4') {
      const duration = await getVideoDuration(file);
      if (!Number.isFinite(duration)) {
        setGeneralError(true);
        setUploadedFile(null);
        return;
      }
      if (duration >= MAX_VIDEO_DURATION_SECONDS + 1) {
        setIsOversizedVideo(true);
        setUploadedFile(null);
        return;
      }
    }

    previewFile(file);
  };

  const previewFile = (file) => {
    if (currentPreviewUrlRef.current) {
      URL.revokeObjectURL(currentPreviewUrlRef.current);
    }

    const previewUrl = URL.createObjectURL(file);
    currentPreviewUrlRef.current = previewUrl;
    const filePreview = {
      file: file,
      name: file.name,
      type: file.type,
      src: previewUrl,
    };

    setUploadedFile(filePreview);
    if (onUpload) onUpload(filePreview);
  };

  const getVideoDuration = (file) => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const objectUrl = URL.createObjectURL(file);

      const cleanup = () => {
        URL.revokeObjectURL(objectUrl);
        video.removeAttribute('src');
        video.load();
      };

      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        const duration = video.duration;
        cleanup();
        resolve(duration);
      };
      video.onerror = () => {
        cleanup();
        resolve(null);
      };
      video.src = objectUrl;
    });
  };

  const removeFile = () => {
    clearPollingTimer();
    if (currentPreviewUrlRef.current) {
      URL.revokeObjectURL(currentPreviewUrlRef.current);
      currentPreviewUrlRef.current = null;
    }
    setUploadedFile(null);
    setModerationResults(null);
    setDetailed([]);
    setPolling(false);
    setIsUploading(false);
    if (onUpload) onUpload(null);
  };

  const handleUploadToAPI = () => {
    if (!uploadedFile || isUploading || polling) return;

    if (!AWSuploadEndpoint || !AWSresultsEndpoint) {
      setConfigurationError(true);
      return;
    }

    setIsUploading(true);
    setGeneralError(false);
    setConfigurationError(false);

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Content = typeof reader.result === 'string' ? reader.result.split(',')[1] : null;
      if (!base64Content) {
        setGeneralError(true);
        setIsUploading(false);
        return;
      }

      const fileData = {
        file_type: uploadedFile.type,
        file_size: uploadedFile.file.size,
        file_name: uploadedFile.name,
        file_content: base64Content,
      };

      fetchWithTimeout(AWSuploadEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fileData),
      }, UPLOAD_TIMEOUT_MS)
        .then((response) => {
          if (!response.ok) throw new Error('Upload failed');
          return response.json();
        })
        .then((data) => {
          const parsedData = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
          const contentId = parsedData && parsedData.content_id;
          startPolling(contentId);
        })
        .catch(() => {
          setGeneralError(true);
          setIsUploading(false);
        });
    };
    reader.onerror = () => {
      setGeneralError(true);
      setIsUploading(false);
    };

    reader.readAsDataURL(uploadedFile.file);
  };

  const startPolling = (contentId) => {
    if (!contentId || !AWSresultsEndpoint) {
      setGeneralError(true);
      setIsUploading(false);
      return;
    }

    clearPollingTimer();
    setPolling(true);
    let attempts = 0;

    const poll = () => {
      const url = new URL(AWSresultsEndpoint);
      url.searchParams.set('content_id', contentId);

      fetchWithTimeout(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }, POLL_TIMEOUT_MS)
        .then((response) => {
          if (!response.ok) throw new Error('Polling failed');
          return response.json();
        })
        .then((data) => {
          const moderationStatus = data && data.moderationStatus;
          const labels = data && data.DetailedLabels ? JSON.parse(data.DetailedLabels) : [];

          if (moderationStatus === 'Approved') {
            clearPollingTimer();
            setModerationResults(data);
            setPolling(false);
            setIsUploading(false);
          } else if (moderationStatus === 'Flagged') {
            clearPollingTimer();
            setModerationResults(data);
            setDetailed(labels);
            setPolling(false);
            setIsUploading(false);
          } else if (attempts < MAX_POLL_ATTEMPTS) {
            attempts++;
            pollTimeoutRef.current = setTimeout(poll, POLL_INTERVAL_MS);
          } else {
            clearPollingTimer();
            setGeneralError(true);
            setPolling(false);
            setIsUploading(false);
          }
        })
        .catch(() => {
          clearPollingTimer();
          setGeneralError(true);
          setPolling(false);
          setIsUploading(false);
        });
    };

    pollTimeoutRef.current = setTimeout(poll, POLL_INTERVAL_MS);
  };

  const handleCloseNotification = () => {
    setIsOversizedVideo(false);
    setIsOversizedFile(false);
    setIsUnsupportedFile(false);
    setGeneralError(false);
    setConfigurationError(false);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  return (
    <div className="upload-card" role="main">
      <h2>Upload Content</h2>
      {!isUploading && (
        <div
          className={`upload-area ${isOversizedVideo || isOversizedFile || isUnsupportedFile || generalError || configurationError ? 'disabled' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <input
            type="file"
            accept="image/jpeg,image/png,video/mp4"
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
        <button onClick={handleUploadToAPI} className="upload-btn" disabled={!uploadedFile || polling} aria-busy={polling}>
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
          <p>File size exceeds 4MB. Please upload a smaller file than 4MB.</p>
          <button onClick={handleCloseNotification} className="close-button" aria-label="Close notification">
            Close
          </button>
        </div>
      )}

      {isUnsupportedFile && (
        <div className="notification-popup" role="alert">
          <p>Unsupported file type. Please upload a JPEG, PNG, or MP4 file.</p>
          <button onClick={handleCloseNotification} className="close-button" aria-label="Close notification">
            Close
          </button>
        </div>
      )}

      {configurationError && (
        <div className="notification-popup" role="alert">
          <p>The moderation service is not configured correctly. Please contact the site owner.</p>
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
