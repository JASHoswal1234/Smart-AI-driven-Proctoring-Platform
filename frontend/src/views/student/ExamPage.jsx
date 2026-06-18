import React from 'react';
import { Helmet } from 'react-helmet';
import Exams from './Components/Exams';

const ExamPage = () => {
  return (
    <>
      <Helmet>
        <title>Exam Page</title>
        <meta name="description" content="Active Exams" />
      </Helmet>
      <Exams />
    </>
  );
};

export default ExamPage;
