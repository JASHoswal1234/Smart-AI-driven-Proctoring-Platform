import asyncHandler from "express-async-handler";
import CheatingLog from "../models/cheatingLogModel.js";

// @desc Save or update cheating log data
// @route POST /api/cheatingLogs
// @access Private
const saveCheatingLog = asyncHandler(async (req, res) => {
  const {
    totalViolations,
    examId,
    username,
    email,
    screenshots,
  } = req.body;

  console.log("=== CHEATING LOG SAVE REQUEST ===");
  console.log("Received cheating log data:", {
    totalViolations,
    examId,
    username,
    email,
    screenshotsCount: screenshots?.length || 0,
  });

  // Validate required fields
  if (!examId || !username || !email) {
    console.error("❌ Missing required fields:", { examId, username, email });
    res.status(400);
    throw new Error("Missing required fields: examId, username, or email");
  }

  try {
    // Find existing log or create new one (upsert)
    console.log(`🔍 Searching for existing log with examId: ${examId}, email: ${email}`);
    const existingLog = await CheatingLog.findOne({ examId, email });

    if (existingLog) {
      // Update existing log - take the maximum to ensure we don't lose data
      console.log("✅ Found existing log, updating...");
      console.log("📊 Existing violations:", existingLog.totalViolations);
      console.log("📊 New violations from request:", parseInt(totalViolations) || 0);
      
      // Take the maximum of existing and new count
      existingLog.totalViolations = Math.max(existingLog.totalViolations, parseInt(totalViolations) || 0);
      existingLog.username = username;
      
      console.log("📊 Updated violations (using Math.max):", existingLog.totalViolations);
      
      // Merge screenshots (avoid duplicates)
      if (screenshots && screenshots.length > 0) {
        const existingUrls = new Set(existingLog.screenshots.map(s => s.url));
        const newScreenshots = screenshots.filter(s => !existingUrls.has(s.url));
        console.log(`📸 Adding ${newScreenshots.length} new screenshots (${screenshots.length} received, ${existingLog.screenshots.length} already exist)`);
        existingLog.screenshots.push(...newScreenshots);
      }

      const savedLog = await existingLog.save();
      console.log("✅ Successfully updated cheating log in MongoDB:", savedLog._id);
      console.log("📊 Final saved violations:", savedLog.totalViolations);
      console.log("📸 Total screenshots:", savedLog.screenshots?.length || 0);
      console.log("=== END CHEATING LOG SAVE ===");
      res.status(200).json(savedLog);
    } else {
      // Create new log
      console.log("⚠️ No existing log found, creating new one...");
      const cheatingLog = new CheatingLog({
        totalViolations: parseInt(totalViolations) || 0,
        examId,
        username,
        email,
        screenshots: screenshots || [],
      });

      const savedLog = await cheatingLog.save();
      console.log("✅ Successfully saved new cheating log to MongoDB:", savedLog._id);
      console.log("📊 Initial violations:", savedLog.totalViolations);
      console.log("📸 Initial screenshots:", savedLog.screenshots?.length || 0);
      console.log("=== END CHEATING LOG SAVE ===");
      res.status(201).json(savedLog);
    }
  } catch (error) {
    console.error("❌ Failed to save cheating log to MongoDB:", error);
    console.error("Error details:", error.message);
    console.error("=== END CHEATING LOG SAVE (ERROR) ===");
    res.status(500);
    throw new Error(`Failed to save cheating log: ${error.message}`);
  }
});

// @desc Get all cheating log data for a specific exam
// @route GET /api/cheatingLogs/:examId
// @access Private
const getCheatingLogsByExamId = asyncHandler(async (req, res) => {
  const examId = req.params.examId;
  console.log(`=== FETCHING CHEATING LOGS FOR EXAM: ${examId} ===`);
  
  try {
    const cheatingLogs = await CheatingLog.find({ examId });
    console.log(`Found ${cheatingLogs.length} cheating logs for exam ${examId}`);
    
    if (cheatingLogs.length > 0) {
      console.log('Sample log:', cheatingLogs[0]);
    } else {
      console.log('No logs found in database for this exam');
    }
    
    res.status(200).json(cheatingLogs);
  } catch (error) {
    console.error('Error fetching cheating logs:', error);
    res.status(500);
    throw new Error(`Failed to fetch cheating logs: ${error.message}`);
  }
});

export { saveCheatingLog, getCheatingLogsByExamId };
