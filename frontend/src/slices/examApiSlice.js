import { apiSlice } from './apiSlice';

// Define the base URL for the exams API
const EXAMS_URL = '/api/users';

// Inject endpoints for the exam slice
export const examApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get all exams
    getExams: builder.query({
      query: () => ({
        url: `${EXAMS_URL}/exam`,
        method: 'GET',
      }),
    }),
    // Create a new exam
    createExam: builder.mutation({
      query: (data) => ({
        url: `${EXAMS_URL}/exam`,
        method: 'POST',
        body: data,
      }),
    }),
    // Get questions for a specific exam
    getQuestions: builder.query({
      query: (examId) => ({
        url: `${EXAMS_URL}/exam/questions/${examId}`,
        method: 'GET',
      }),
    }),
    // Create a new question for an exam
    createQuestion: builder.mutation({
      query: (data) => ({
        url: `${EXAMS_URL}/exam/questions`,
        method: 'POST',
        body: data,
      }),
    }),

    // Bulk create questions
    bulkCreateQuestions: builder.mutation({
      query: (data) => ({
        url: `${EXAMS_URL}/exam/questions/bulk`,
        method: 'POST',
        body: data,
      }),
    }),
    //Delete an exam
    deleteExam: builder.mutation({
      query: (examId) => ({
        url: `${EXAMS_URL}/exam/${examId}`,
        method: 'DELETE',
        credentials: 'include',
      }),
    }),
    // Get user results to check completed exams
    getUserResults: builder.query({
      query: () => ({
        url: `${EXAMS_URL}/results/user`,
        method: 'GET',
      }),
    }),

    // Get all results for a specific exam (teacher only)
    getResultsByExamId: builder.query({
      query: (examId) => ({
        url: `${EXAMS_URL}/results/exam/${examId}`,
        method: 'GET',
      }),
      providesTags: (result, error, examId) => [
        { type: 'Result', id: examId },
        { type: 'Result', id: 'LIST' },
      ],
    }),

    // Get all results across all exams (teacher only)
    getAllResults: builder.query({
      query: () => ({
        url: `${EXAMS_URL}/results/all`,
        method: 'GET',
      }),
      providesTags: [{ type: 'Result', id: 'LIST' }],
    }),
  }),
});

// Export the generated hooks for each endpoint
export const {
  useGetExamsQuery,
  useCreateExamMutation,
  useGetQuestionsQuery,
  useCreateQuestionMutation,
  useBulkCreateQuestionsMutation,
  useDeleteExamMutation,
  useGetUserResultsQuery,
  useGetResultsByExamIdQuery,
  useGetAllResultsQuery,
} = examApiSlice;
