import { sendResultEmail } from './emailService.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

console.log('📧 Email User:', process.env.EMAIL_USER);
console.log('🔑 Email Pass:', process.env.EMAIL_PASS ? '***configured***' : 'NOT SET');

// Test function to send a sample email
const testEmail = async () => {
  const testResultData = {
    totalScore: 85,
    percentage: 85.5,
    mcqScore: 70,
    subjectiveScore: 15,
    maxPossible: 100,
  };

  const examDetails = {
    title: 'Sample Test Exam'
  };

  try {
    console.log('🧪 Testing email functionality...');
    console.log('📧 Sending test email...');
    
    const result = await sendResultEmail(
      'raghavmulay0@gmail.com',
      'Test Student',
      examDetails,
      testResultData
    );

    if (result.success) {
      console.log('✅ Test email sent successfully!');
      console.log('📨 Message ID:', result.messageId);
      console.log('\n📬 Check your inbox at: raghavmulay0@gmail.com');
    } else {
      console.log('❌ Test email failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Test email failed:', error);
  }
};

testEmail();
