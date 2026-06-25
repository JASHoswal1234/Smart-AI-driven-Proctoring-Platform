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

    // Calculate grade
    const grade = percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B' : percentage >= 60 ? 'C' : percentage >= 50 ? 'D' : 'F';
    
    // Format date
    const examDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const examTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    
    // Calculate progress bar width
    const progressWidth = Math.round(percentage);

    const htmlContent = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Exam Results - ProctAI</title>
  <style type="text/css">
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; background-color: #F8FAFC; }
    table { border-collapse: collapse; }
    img { border: 0; display: block; }
    .wrapper { width: 100%; background-color: #F8FAFC; }
    .email-container { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; }
    
    /* Typography */
    .heading { font-size: 32px; font-weight: 700; color: #0F172A; margin: 0; padding: 0; line-height: 1.2; }
    .body-text { font-size: 16px; color: #0F172A; line-height: 1.6; margin: 0; padding: 0; }
    .secondary-text { font-size: 16px; color: #64748B; line-height: 1.6; margin: 0; padding: 0; }
    .small-text { font-size: 14px; color: #64748B; line-height: 1.5; margin: 0; padding: 0; }
    .label { font-size: 12px; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.08em; margin: 0; padding: 0; }
    
    /* Components */
    .divider { height: 1px; background-color: #E5E7EB; }
    .button { display: inline-block; padding: 14px 28px; background-color: #2563EB; color: #FFFFFF !important; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; }
    .button:hover { background-color: #1d4ed8; }
    
    /* Progress Bar */
    .progress-container { width: 100%; height: 8px; background-color: #E5E7EB; border-radius: 10px; overflow: hidden; }
    .progress-bar { height: 8px; background-color: #2563EB; border-radius: 10px; }
    
    /* Info Table */
    .info-table { width: 100%; border: 1px solid #E5E7EB; border-radius: 10px; }
    .info-table td { padding: 12px 16px; border-bottom: 1px solid #E5E7EB; }
    .info-table tr:last-child td { border-bottom: none; }
    
    /* Performance Table */
    .perf-table { width: 100%; border: 1px solid #E5E7EB; border-radius: 10px; }
    .perf-table td { padding: 14px 16px; border-bottom: 1px solid #E5E7EB; }
    .perf-table tr:last-child td { border-bottom: none; }
    .perf-table .metric-label { font-weight: 600; color: #0F172A; }
    .perf-table .metric-value { font-weight: 700; color: #0F172A; text-align: right; }
    
    /* Insight Box */
    .insight-box { border: 1px solid #E5E7EB; border-radius: 10px; padding: 20px; background-color: #FFFFFF; }
    
    /* Mobile Responsive */
    @media only screen and (max-width: 600px) {
      .heading { font-size: 24px !important; }
      .body-text, .secondary-text { font-size: 15px !important; }
      .button { display: block !important; width: 100% !important; text-align: center; }
      .mobile-padding { padding: 20px !important; }
      .mobile-stack { display: block !important; width: 100% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0;">
  <table role="presentation" class="wrapper" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <!-- Email Container -->
        <table role="presentation" class="email-container" width="600" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; box-shadow: 0 2px 8px rgba(15,23,42,.05);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px; border-bottom: 1px solid #E5E7EB;" class="mobile-padding">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="font-size: 20px; font-weight: 700; color: #0F172A; margin: 0; padding: 0;">ProctAI</p>
                  </td>
                  <td align="right">
                    <p class="label" style="color: #2563EB; margin: 0;">EXAM RESULTS</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Greeting -->
          <tr>
            <td style="padding: 40px 40px 24px 40px;" class="mobile-padding">
              <h1 class="heading">Hi ${userName.split(' ')[0]},</h1>
              <p class="secondary-text" style="margin-top: 16px;">Your assessment has been completed successfully. Here's a summary of your performance.</p>
            </td>
          </tr>
          
          <!-- Exam Information Table -->
          <tr>
            <td style="padding: 0 40px 32px 40px;" class="mobile-padding">
              <table role="presentation" class="info-table" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width: 40%;">
                    <p class="label">EXAM</p>
                  </td>
                  <td>
                    <p class="body-text" style="font-weight: 600;">${examDetails.title || 'Exam'}</p>
                  </td>
                </tr>
                <tr>
                  <td>
                    <p class="label">DATE</p>
                  </td>
                  <td>
                    <p class="body-text">${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  </td>
                </tr>
                <tr>
                  <td>
                    <p class="label">TIME</p>
                  </td>
                  <td>
                    <p class="body-text">${examTime}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Overall Score Section -->
          <tr>
            <td style="padding: 0 40px 32px 40px;" class="mobile-padding">
              <p class="label" style="margin-bottom: 12px;">OVERALL SCORE</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom: 12px;">
                    <p style="font-size: 48px; font-weight: 700; color: #2563EB; margin: 0; line-height: 1;">${percentage.toFixed(1)}%</p>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div class="progress-container">
                      <div class="progress-bar" style="width: ${progressWidth}%;"></div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Performance Summary Table -->
          <tr>
            <td style="padding: 0 40px 32px 40px;" class="mobile-padding">
              <p class="label" style="margin-bottom: 12px;">PERFORMANCE SUMMARY</p>
              <table role="presentation" class="perf-table" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td class="metric-label">Total Score</td>
                  <td class="metric-value">${totalScore} / ${maxPossible}</td>
                </tr>
                <tr>
                  <td class="metric-label">MCQ</td>
                  <td class="metric-value">${mcqScore}</td>
                </tr>
                <tr>
                  <td class="metric-label">Subjective</td>
                  <td class="metric-value">${subjectiveScore}</td>
                </tr>
                <tr>
                  <td class="metric-label">Grade</td>
                  <td class="metric-value">${grade}</td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Performance Insight -->
          <tr>
            <td style="padding: 0 40px 32px 40px;" class="mobile-padding">
              <div class="insight-box">
                <p class="label" style="margin-bottom: 12px;">PERFORMANCE INSIGHT</p>
                <p class="body-text">${performance.message}</p>
              </div>
            </td>
          </tr>
          
          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding: 0 40px 40px 40px;" class="mobile-padding">
              <a href="#" class="button">View Detailed Results</a>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; border-top: 1px solid #E5E7EB; background-color: #F8FAFC;" class="mobile-padding">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <p class="small-text">Questions? <a href="mailto:adminproctai@gmail.com" style="color: #2563EB; text-decoration: none;">adminproctai@gmail.com</a></p>
                    <p class="small-text" style="margin-top: 8px;">© ${new Date().getFullYear()} ProctAI</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
        
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const mailOptions = {
      from: `"ProctAI" <${process.env.EMAIL_FROM}>`,
      to: userEmail,
      subject: `Your Exam Results - ${examDetails.title || 'Exam'} (${percentage.toFixed(1)}%)`,
      html: htmlContent,
      text: `
Hi ${userName}!

Your exam results are ready:

Exam: ${examDetails.title || 'N/A'}
Date: ${examDate}
Time: ${examTime}

Overall Score: ${percentage.toFixed(1)}%
Total Score: ${totalScore} / ${maxPossible}
MCQ Score: ${mcqScore}
Subjective Score: ${subjectiveScore}
Grade: ${grade}

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
