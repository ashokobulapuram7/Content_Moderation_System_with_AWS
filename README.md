# Content_Moderation_System_with_AWS

Overview
This web application provides a streamlined platform for moderating images and videos using AWS services. Users can upload files, which are then analyzed for inappropriate or sensitive content. The results of the analysis (Approved or Flagged) are displayed in real-time, making it a practical solution for platforms requiring content moderation.

The application is built using modern technologies like React.js for the frontend and AWS services for the backend, ensuring a serverless, scalable, and secure architecture.

---

## Table of Contents
- [Features](#features)
- [Tech Stack](#Tech-stcak)
- [Architecture](#architecture)
- [Installation](#installation)
- [Usage](#usage)
- [Technologies Used](#technologies-used)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)

---

## Features
- Image and Video Upload: Allows users to upload files via a clean and user-friendly interface.
- Content Moderation: Analyzes files for sensitive or explicit content using AWS Rekognition.
- Real-Time Results: Displays moderation results (approved or flagged) with confidence scores and labels.
- File Size and Format Validation: Ensures files meet size (<4 MB) and format (JPG, PNG, MP4) requirements.
- Dark Mode Support: Provides a dark mode for enhanced user experience.
- Scalable Architecture: Built using AWS Lambda, S3, Rekognition, API Gateway, and DynamoDB for high performance and cost efficiency.

---

## Tech Stack
**Frontend:**
React.js: Dynamic and responsive UI with routing and state management.
CSS: Custom styling for an intuitive user experience.
AWS Amplify: Frontend deployment and CI/CD management.
**Backend:**
Amazon S3: File storage and event triggering for backend workflows.
AWS Rekognition: Moderation engine to analyze images and videos.
AWS Lambda: Serverless backend for file processing and database integration.
Amazon DynamoDB: Storage of metadata and moderation results.
Amazon API Gateway: Routing requests between the frontend and backend.

---

## Architecture
The application follows a microservices-based architecture leveraging AWS cloud services. Below is a high-level overview:

- **Frontend**: React app for the user interface.
- **Backend**: AWS API Gateway and Lambda functions.
- **Storage**: S3 bucket for storing uploaded files.
- **Moderation**: AWS Rekognition for content analysis.

![Architecture Diagram](docs/architecture-diagram.png)

---

## Installation

Follow these steps to set up the project locally:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/content-moderation-app.git
