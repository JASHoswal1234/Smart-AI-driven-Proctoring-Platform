import { fetchBaseQuery, createApi } from '@reduxjs/toolkit/query/react';

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000',
  credentials: 'include',
});

export const apiSlice = createApi({
  baseQuery,
  tagTypes: ['User', 'CheatingLog'],
  // it like a prent to other api
  // it a build in builder
  endpoints: (builder) => ({}),
});
