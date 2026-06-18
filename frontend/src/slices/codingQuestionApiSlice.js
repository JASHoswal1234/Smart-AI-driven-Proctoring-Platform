import { apiSlice } from './apiSlice';

const CODING_QUESTIONS_URL = '/api/coding-questions';

export const codingQuestionApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createCodingQuestion: builder.mutation({
      query: (data) => ({
        url: CODING_QUESTIONS_URL,
        method: 'POST',
        body: data,
      }),
    }),
    getCodingQuestions: builder.query({
      query: (examId) => `${CODING_QUESTIONS_URL}/${examId}`,
    }),
    deleteCodingQuestion: builder.mutation({
      query: (id) => ({
        url: `${CODING_QUESTIONS_URL}/${id}`,
        method: 'DELETE',
      }),
    }),
  }),
});

export const {
  useCreateCodingQuestionMutation,
  useGetCodingQuestionsQuery,
  useDeleteCodingQuestionMutation,
} = codingQuestionApiSlice;
