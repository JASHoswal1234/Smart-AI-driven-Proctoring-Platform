# ProctAI

ProctAI is an AI-powered Automated Exam Proctoring System (AEPS) designed to ensure integrity and security in online examinations. Built using the MERN stack along with TensorFlow.js, the system provides real-time AI monitoring, automated grading, and performance analytics.

---

## 🏗 System Architecture

<p align="center">
  <img src="readme-images/sytem-arch.png" width="700"/>
</p>

---

## 📚 Table of Contents

- [Tech Stack](#-tech-stack)
- [Current Functionality](#-current-functionality)
- [Future Scope](#-future-scope)
- [Project Screenshots](#-project-screenshots)
- [Deployed Website](#-deployed-website)
- [Test Users](#-test-users)

---

# 🛠 Tech Stack

## Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Tokens (JWT)
- Express-Async-Handler
- Cloudinary (for cheating screenshot storage)

## Frontend
- React.js
- Redux Toolkit
- TensorFlow.js
- Material UI
- React Router
- React Toastify
- React Webcam

---

# 🚀 Current Functionality

## 🔐 User Authentication & Role Management
- Role-based login for Students and Teachers
- Secure JWT-based authentication
- Password hashing using bcrypt

## 👨‍🏫 Teacher Capabilities
- Create and manage exams
- Add and configure questions
- View cheating logs
- Access student performance analytics

## 👨‍🎓 Student Functionality
- View and attempt available exams
- Real-time timer with auto-submit
- View results and analytics after submission

## 🤖 AI Exam Proctoring
- Mobile phone detection
- Multiple face detection
- Face not visible detection
- Tab switch detection
- Automatic logging of suspicious activity

## 📊 Result & Performance Analysis
- Automatic objective grading
- AI-based subjective grading (NLP powered)
- Instant result generation
- Student analytics dashboard
- Email notification after submission

---

# 🔮 Future Scope

## Candidate Verification
- Real-time face verification with registered student

## Voice Recognition
- Voice anomaly detection during exams

## Unified Portal
- Integrated exam + chat + document upload system

---

# 📸 Project Screenshots

## 🔐 Login Page
<p align="center">
  <img src="readme-images/login-page-student.png" width="600"/>
</p>

## 📊 Dashboard

### Student Dashboard
<p align="center">
  <img src="readme-images/student-dashboard.jpeg" width="600"/>
</p>

### Teacher Dashboard
<p align="center">
  <img src="readme-images/teacher-dashboard.png" width="600"/>
</p>

---

## 📝 Exam Creation

### Create Exam
<p align="center">
  <img src="readme-images/create-exam.png" width="600"/>
</p>

### Create Questions
<p align="center">
  <img src="readme-images/create-question.jpeg" width="600"/>
</p>

### All Student Results
<p align="center">
  <img src="readme-images/result-page.jpeg" width="600"/>
</p>

### Student Marks Analysis
<p align="center">
  <img src="readme-images/student-analysis.jpeg" width="600"/>
</p>

---

## 🚨 Cheating Detection During Exam

### Cell Phone Detection
<p align="center">
  <img src="readme-images/cell-phone-detection.png" width="500"/>
</p>

### Face Not Visible Detection
<p align="center">
  <img src="readme-images/face-not-visible.jpeg" width="500"/>
</p>

### Multiple Face Detection
<p align="center">
  <img src="readme-images/multiple-face-detection.png" width="500"/>
</p>

### Tab Switch Detection
<p align="center">
  <img src="readme-images/tabswitch-detection.png" width="500"/>
</p>

---

## 🧠 AI Grading (NLP)
<p align="center">
  <img src="readme-images/nlp.jpeg" width="600"/>
</p>

---

## 📧 Email Notification After Submission
<p align="center">
  <img src="readme-images/email.jpeg" width="600"/>
</p>

---

## 📈 Student Performance Analytics
<p align="center">
  <img src="readme-images/result-analytics1.jpeg" width="45%"/>
  <img src="readme-images/result-analytics2.jpeg" width="45%"/>
</p>

---


# 🌍 Deployed Website

https://proctaii.vercel.app/

---

# 🔐 Test Users

### 👨‍🎓 Student Account
Email: student_testing@gmail.com  
Password: 123456  

### 👨‍🏫 Teacher Account
Email: teacher@test.com  
Password: 123456  

---






