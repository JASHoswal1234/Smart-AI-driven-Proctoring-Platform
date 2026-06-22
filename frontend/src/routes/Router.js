import React from 'react';
import { Navigate, Route, createBrowserRouter, createRoutesFromElements } from 'react-router-dom';

/* ***Layouts**** */
import BlankLayout from '../layouts/blank/BlankLayout';
import FullLayout from '../layouts/full/FullLayout';
import ExamLayout from '../layouts/full/ExamLayout';

/* ****Pages***** */
import SamplePage from '../views/sample-page/SamplePage';
import Success from '../views/Success';

//Student Routes
import Dashboard from '../views/student/Dashboard';
import TestPage from '../views/student/TestPage';
import ExamPage from '../views/student/ExamPage';
import ExamDetails from '../views/student/ExamDetails';
import SystemCheck from '../views/student/SystemCheck';
import CodeDetails from '../views/student/CodeDetails';
import ResultPage from '../views/student/ResultPage';
import ExamAnalyticsPage from '../views/student/ExamAnalyticsPage';
import Coder from '../views/student/Coder';

//Auth Routes
import Error from '../views/authentication/Error';
import Register from '../views/authentication/Register';
import Login from '../views/authentication/Login';
import UserAccount from '../views/authentication/UserAccount';
import UserProfile from '../views/authentication/UserProfile';

// Teacher Routes
import CreateExamPage from '../views/teacher/CreateExamPage';
import ExamLogPage from '../views/teacher/ExamLogPage';
import AddQuestions from '../views/teacher/AddQuestions';
import PrivateRoute from '../views/authentication/PrivateRoute';
import TeacherRoute from '../views/authentication/TeacherRoute';

const Router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/">
      {/* Private Routes */}
      <Route element={<PrivateRoute />}>
        {/* Main layout */}
        <Route element={<FullLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="sample-page" element={<SamplePage />} />
          <Route path="Success" element={<Success />} />
          <Route path="exam" element={<ExamPage />} />
          <Route path="exam-analytics/:examId" element={<ExamAnalyticsPage />} />
          <Route path="result" element={<ResultPage />} />
          <Route path="user/profile" element={<UserProfile />} />
          <Route path="user/account" element={<UserAccount />} />
          <Route element={<TeacherRoute />}>
            <Route path="create-exam" element={<CreateExamPage />} />
            <Route path="add-questions" element={<AddQuestions />} />
            <Route path="exam-log" element={<ExamLogPage />} />
          </Route>
        </Route>
        <Route element={<ExamLayout />}>
          <Route path="exam/:examId" element={<ExamDetails />} />
          <Route path="exam/:examId/system-check" element={<SystemCheck />} />
          <Route path="exam/:examId/codedetails" element={<CodeDetails />} />
          <Route path="exam/:examId/:testId" element={<TestPage />} />
          <Route path="exam/:examId/code" element={<Coder />} />
        </Route>
      </Route>

      {/* Authentication layout */}
      <Route path="auth" element={<BlankLayout />}>
        <Route path="404" element={<Error />} />
        <Route path="register" element={<Register />} />
        <Route path="login" element={<Login />} />
      </Route>
    </Route>
  ),
);

export default Router;
