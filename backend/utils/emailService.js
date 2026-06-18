import nodemailer from 'nodemailer';

// Create transporter for Gmail
const createTransporter = () => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  return transporter;
};

// Generate performance message based on percentage
const getPerformanceMessage = (percentage) => {
  if (percentage >= 90) return { emoji: "🏆", message: "Outstanding performance! You're a star!" };
  if (percentage >= 80) return { emoji: "🎉", message: "Excellent work! Keep it up!" };
  if (percentage >= 70) return { emoji: "👍", message: "Good job! You're doing well!" };
  if (percentage >= 60) return { emoji: "📈", message: "Nice effort! There's room for improvement!" };
  if (percentage >= 50) return { emoji: "💪", message: "Keep trying! Practice makes perfect!" };
  return { emoji: "📚", message: "Don't give up! Every expert was once a beginner!" };
};

// Send exam result email
export const sendResultEmail = async (userEmail, userName, examDetails, resultData) => {
  try {
    const transporter = createTransporter();

    const { totalScore, percentage, mcqScore, subjectiveScore, maxPossible } = resultData;
    const performance = getPerformanceMessage(percentage);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f4f4f4;
          }
          .container { 
            max-width: 600px; 
            margin: 20px auto; 
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
          }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
          }
          .header h1 { margin: 0; font-size: 28px; }
          .content { 
            padding: 30px 20px; 
          }
          .greeting { 
            font-size: 18px; 
            margin-bottom: 20px; 
            color: #555;
          }
          .result-card { 
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            padding: 25px; 
            margin: 20px 0; 
            border-radius: 10px; 
            text-align: center;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          }
          .score { 
            font-size: 48px; 
            font-weight: bold; 
            margin: 10px 0;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
          }
          .score-label { 
            font-size: 16px; 
            opacity: 0.9; 
          }
          .details-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 15px; 
            margin: 20px 0; 
          }
          .detail-item { 
            background: #f8f9fa; 
            padding: 15px; 
            border-radius: 8px; 
            text-align: center;
            border-left: 4px solid #667eea;
          }
          .detail-label { 
            font-size: 12px; 
            color: #666; 
            text-transform: uppercase; 
            letter-spacing: 1px; 
          }
          .detail-value { 
            font-size: 20px; 
            font-weight: bold; 
            color: #333; 
            margin-top: 5px;
          }
          .performance-message { 
            background: #e8f5e8; 
            border: 1px solid #4caf50; 
            border-radius: 8px; 
            padding: 20px; 
            margin: 20px 0; 
            text-align: center;
          }
          .performance-emoji { 
            font-size: 32px; 
            margin-bottom: 10px; 
          }
          .exam-info { 
            background: #fff3cd; 
            border: 1px solid #ffeaa7; 
            border-radius: 8px; 
            padding: 15px; 
            margin: 20px 0; 
          }
          .footer { 
            background: #f8f9fa; 
            text-align: center; 
            padding: 20px; 
            color: #666; 
            font-size: 14px; 
            border-top: 1px solid #eee;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 25px;
            margin: 20px 0;
            font-weight: bold;
          }
          @media (max-width: 600px) {
            .details-grid { grid-template-columns: 1fr; }
            .score { font-size: 36px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Exam Results</h1>
          </div>
          
          <div class="content">
            <div class="greeting">
              Hello <strong>${userName}</strong>! 👋
            </div>
            
            <p>Your exam results are ready! Here's a detailed breakdown of your performance:</p>
            
            <div class="exam-info">
              <strong>📝 Exam:</strong> ${examDetails.title || 'N/A'}<br>
              <strong>📅 Date:</strong> ${new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}<br>
              <strong>⏰ Time:</strong> ${new Date().toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>

            <div class="result-card">
              <div class="score">${percentage.toFixed(1)}%</div>
              <div class="score-label">Overall Score</div>
            </div>

            <div class="details-grid">
              <div class="detail-item">
                <div class="detail-label">Total Score</div>
                <div class="detail-value">${totalScore} / ${maxPossible}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">MCQ Score</div>
                <div class="detail-value">${mcqScore}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Subjective Score</div>
                <div class="detail-value">${subjectiveScore}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Grade</div>
                <div class="detail-value">${percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B' : percentage >= 60 ? 'C' : percentage >= 50 ? 'D' : 'F'}</div>
              </div>
            </div>

            <div class="performance-message">
              <div class="performance-emoji">${performance.emoji}</div>
              <strong>${performance.message}</strong>
            </div>

            <p style="text-align: center;">
              <a href="#" class="cta-button">View Detailed Results</a>
            </p>

            <p style="color: #666; font-size: 14px;">
              💡 <strong>Tip:</strong> Log into your account to view detailed feedback and correct answers for better preparation next time.
            </p>
          </div>
          
          <div class="footer">
            <p>This is an automated email from the Exam Platform.<br>
            Please do not reply to this email.</p>
            <p style="font-size: 12px; margin-top: 10px;">
              © ${new Date().getFullYear()} Exam Platform. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"Exam Platform" <${process.env.EMAIL_FROM}>`,
      to: userEmail,
      subject: `🎯 Your Exam Results - ${examDetails.title || 'Exam'} (${percentage.toFixed(1)}%)`,
      html: htmlContent,
      text: `
Hello ${userName}!

Your exam results are ready:

Exam: ${examDetails.title || 'N/A'}
Overall Score: ${percentage.toFixed(1)}%
Total Score: ${totalScore} / ${maxPossible}
MCQ Score: ${mcqScore}
Subjective Score: ${subjectiveScore}

${performance.message}

Log into your account to view detailed results.

This is an automated email. Please do not reply.
      `.trim(),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('❌ Error sending email:', error);
    return { success: false, error: error.message };
  }
};

export const sendWelcomeEmail = async (userEmail, userName) => {
  try {
    const transporter = createTransporter();

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', sans-serif; line-height: 1.6; color: #333; margin: 0; background: #f4f4f4; }
          .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px 20px; text-align: center; }
          .content { padding: 30px 20px; }
          .feature { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #4CAF50; }
          .footer { background: #f8f9fa; text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to Exam Platform!</h1>
          </div>
          <div class="content">
            <h2>Hello ${userName}! 👋</h2>
            <p>Welcome to our online examination platform. We're excited to have you on board!</p>
            
            <h3>What you can do:</h3>
            <div class="feature">📝 <strong>Take Exams:</strong> Access and complete your assigned examinations</div>
            <div class="feature">📊 <strong>View Results:</strong> Check your scores and detailed feedback</div>
            <div class="feature">📈 <strong>Track Progress:</strong> Monitor your performance over time</div>
            <div class="feature">🔒 <strong>Secure Testing:</strong> Experience proctored exams with integrity</div>
            
            <p>Good luck with your exams! We're here to support your learning journey.</p>
          </div>
          <div class="footer">
            <p>Need help? Contact our support team.<br>
            This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"Exam Platform" <${process.env.EMAIL_FROM}>`,
      to: userEmail,
      subject: '🎉 Welcome to Exam Platform - Get Started!',
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent:', info.messageId);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};
