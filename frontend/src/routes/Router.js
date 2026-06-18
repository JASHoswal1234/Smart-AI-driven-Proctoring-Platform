import React from 'react';
import { Navigate, Route, createBrowserRouter, createRoutesFromElements } from 'react-router-dom';
import Loadable from '../layouts/full/shared/loadable/Loadable';

/* ***Layouts**** */
const BlankLayout = Loadable(() => import('../layouts/blank/BlankLayout'));
const FullLayout = Loadable(() => import('../layouts/full/FullLayout'));
const ExamLayout = Loadable(() => import('../layouts/full/ExamLayout'));

/* ****Pages***** */
const SamplePage = Loadable(() => import('../views/sample-page/SamplePage'));
const Success = Loadable(() => import('../views/Success'));

//Student Routes
const Dashboard = Loadable(() => import('./../views/student/Dashboard'));
const TestPage = Loadable(() => import('./../views/student/TestPage'));
const ExamPage = Loadable(() => import('./../views/student/ExamPage'));
const ExamDetails = Loadable(() => import('./../views/student/ExamDetails'));
const CodeDetails = Loadable(() => import('../views/student/CodeDetails'));
const ResultPage = Loadable(() => import('./../views/student/ResultPage'));
const ExamAnalyticsPage = Loadable(() => import('./../views/student/ExamAnalyticsPage'));
const Coder = Loadable(() => import('../views/student/Coder'));

//Auth Routes
const Error = Loadable(() => import('../views/authentication/Error'));
const Register = Loadable(() => import('../views/authentication/Register'));
const Login = Loadable(() => import('../views/authentication/Login'));
const UserAccount = Loadable(() => import('../views/authentication/UserAccount'));
const UserProfile = Loadable(() => import('../views/authentication/UserProfile'));

// Teacher Routes
const CreateExamPage = Loadable(() => import('./../views/teacher/CreateExamPage'));
const ExamLogPage = Loadable(() => import('./../views/teacher/ExamLogPage'));
const AddQuestions = Loadable(() => import('./../views/teacher/AddQuestions'));
const PrivateRoute = Loadable(() => import('src/views/authentication/PrivateRoute'));
const TeacherRoute = Loadable(() => import('src/views/authentication/TeacherRoute'));

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
