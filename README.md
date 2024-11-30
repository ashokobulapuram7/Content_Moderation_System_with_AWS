# Content_Moderation_System_with_AWS

This is a web application for moderating images and videos using AWS services like S3, Rekognition, and Lambda. The system allows users to upload files, processes them using AWS Rekognition, and provides results on whether the content is approved or flagged.

---

## Table of Contents
- [Features](#features)
- [Architecture](#architecture)
- [Installation](#installation)
- [Usage](#usage)
- [Technologies Used](#technologies-used)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)

---

## Features
- Upload content (images and videos) for moderation.
- AWS Rekognition integration for content analysis.
- Results display for flagged and approved content.
- Responsive UI with light/dark mode.
- Environment variables to secure API endpoints.

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
