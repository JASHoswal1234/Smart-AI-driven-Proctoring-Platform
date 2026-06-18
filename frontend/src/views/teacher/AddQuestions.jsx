import React from 'react';
import PageContainer from 'src/components/container/PageContainer';
import AddQuestionFormRefactored from './components/AddQuestionFormRefactored';

const AddQuestions = () => {
  return (
    <PageContainer title="Add Questions" description="Create and manage exam questions">
      <AddQuestionFormRefactored />
    </PageContainer>
  );
};

export default AddQuestions;
