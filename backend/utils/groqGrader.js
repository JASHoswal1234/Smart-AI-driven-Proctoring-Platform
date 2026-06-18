import Groq from "groq-sdk";

let groq;

const getGroqClient = () => {
  if (!groq) {
    const apiKey = process.env.GROQ_API_KEY;
    console.log('[GROQ] Initializing client with API key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'MISSING');
    
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is not set in environment variables');
    }
    
    groq = new Groq({
      apiKey: apiKey,
    });
    console.log('[GROQ] Client initialized successfully');
  }
  return groq;
};

export const gradeSubjectiveAnswer = async (question, modelAnswer, studentAnswer, maxMarks) => {
  try {
    // Truncate student answer to 2000 chars
    const truncatedAnswer = studentAnswer.slice(0, 2000);

    const prompt = `You are a fair and understanding exam grader. Grade the student's answer based on CORRECTNESS and UNDERSTANDING, not exact word matching.

GRADING PRINCIPLES:
- Score MUST be an integer between 0 and ${maxMarks}.
- Award points for CORRECT INFORMATION, even if worded differently than the model answer.
- Focus on factual accuracy and understanding, NOT on exact phrasing or grammar.
- Minor spelling/capitalization errors should NOT reduce the score if the content is correct.
- If the student demonstrates understanding of the topic, give appropriate credit.
- Only deduct points for MISSING KEY INFORMATION or FACTUALLY INCORRECT statements.
- If the answer is completely unrelated or empty, give Score: 0.

FEEDBACK GUIDELINES:
- Be specific about what key points are missing or incorrect.
- Acknowledge correct information provided.
- Keep feedback under 40 words but make it constructive.
- Do NOT criticize grammar, spelling, or capitalization unless it affects meaning.

OUTPUT FORMAT (exactly two lines, nothing else):
Score: <integer>
Feedback: <specific constructive feedback>

QUESTION: ${question}
MODEL ANSWER: ${modelAnswer}
STUDENT ANSWER: ${truncatedAnswer}

Grade fairly based on correctness:`;

    const completion = await getGroqClient().chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.4, // Balanced for consistency and variety
      max_tokens: 200,
    });

    const response = completion.choices[0]?.message?.content || "";

    // Parse Score and Feedback using regex
    const scoreMatch = response.match(/Score:\s*(\d+)/i);
    const feedbackMatch = response.match(/Feedback:\s*(.+)/i);

    let score = scoreMatch ? parseInt(scoreMatch[1], 10) : 0;
    const feedback = feedbackMatch ? feedbackMatch[1].trim() : "AI grading unavailable";

    // Clamp score
    score = Math.max(0, Math.min(score, maxMarks));

    return { score, feedback };
  } catch (error) {
    console.error("Groq API error:", error);
    return { score: 0, feedback: "AI grading unavailable" };
  }
};
