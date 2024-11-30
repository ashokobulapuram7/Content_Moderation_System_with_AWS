# Content_Moderation_System_with_AWS

Overview
This web application provides a streamlined platform for moderating images and videos using AWS services. Users can upload files, which are then analyzed for inappropriate or sensitive content. The results of the analysis (Approved or Flagged) are displayed in real-time, making it a practical solution for platforms requiring content moderation.

The application is built using modern technologies like React.js for the frontend and AWS services for the backend, ensuring a serverless, scalable, and secure architecture.

---

## Table of Contents
- [Features](#features)
- [Tech Stack](#Tech-stack)
- [Architecture](#architecture)
- [Access Website](#Access-Website)
- [Screenshots](#screenshots)

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
- React.js: Dynamic and responsive UI with routing and state management.
- CSS: Custom styling for an intuitive user experience.
- AWS Amplify: Frontend deployment and CI/CD management.
  
**Backend:**
- Amazon S3: File storage and event triggering for backend workflows.
- AWS Rekognition: Moderation engine to analyze images and videos.
- AWS Lambda: Serverless backend for file processing and database integration.
- Amazon DynamoDB: Storage of metadata and moderation results.
- Amazon API Gateway: Routing requests between the frontend and backend.

---

## Architecture

The system leverages a serverless architecture to ensure scalability, reliability, and minimal maintenance. Here's a summary of the flow:

- Frontend: Users upload files via the React.js interface.
- File Upload:
Files are sent to an API Gateway, which triggers an AWS Lambda function.
The Lambda function uploads the files to Amazon S3.
- Moderation:
An S3 upload event triggers another Lambda function.
The Lambda function uses AWS Rekognition to analyze the file for inappropriate or sensitive content.
Moderation results are stored in Amazon DynamoDB.
- Results Display:
The frontend queries DynamoDB through an API Gateway endpoint to retrieve and display the results.

![Architecture Diagram]![Final_AWS_Architecture](https://github.com/user-attachments/assets/c5625692-8586-4a5f-a2ca-5f98fe5c0826)


---

## Access Website

You can Access the website using the following link.

https://main.d1edxzmedbu1wl.amplifyapp.com/home

## Screenshots
![image](https://github.com/user-attachments/assets/7b4cad2b-c556-4216-9ae1-a2232722ab5a)

![image](https://github.com/user-attachments/assets/a114e05e-2235-4c90-abd8-a96f093e2ddb)

![image](https://github.com/user-attachments/assets/7ebe9693-4a88-447a-ac6f-17e42415dce5)

![image](https://github.com/user-attachments/assets/c8befbb4-6756-4165-ae6f-b1875047ebf2)

![image](https://github.com/user-attachments/assets/30b232ea-2342-4ac4-8e0c-639cbb36c102)





