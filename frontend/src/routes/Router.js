import React, { lazy } from 'react';
import { Navigate, Route, createBrowserRouter, createRoutesFromElements } from 'react-router-dom';
import Loadable from '../layouts/full/shared/loadable/Loadable';

/* ***Layouts**** */
const BlankLayout = Loadable(lazy(() => import('../layouts/blank/BlankLayout')));
const FullLayout = Loadable(lazy(() => import('../layouts/full/FullLayout')));
const ExamLayout = Loadable(lazy(() => import('../layouts/full/ExamLayout')));

/* ****Pages***** */
// const Dashboard = Loadable(lazy(() => import('../views/dashboard/Dashboard')));
const SamplePage = Loadable(lazy(() => import('../views/sample-page/SamplePage')));
const Success = Loadable(lazy(() => import('../views/Success')));

// const Icons = Loadable(lazy(() => import('../views/icons/Icons')));
// const TypographyPage = Loadable(lazy(() => import('../views/utilities/TypographyPage')));
// const Shadow = Loadable(lazy(() => import('../views/utilities/Shadow')));
//Student Routes

const Dashboard = Loadable(lazy(() => import('./../views/student/Dashboard')));
const TestPage = Loadable(lazy(() => import('./../views/student/TestPage')));
const ExamPage = Loadable(lazy(() => import('./../views/student/ExamPage')));
const ExamDetails = Loadable(lazy(() => import('./../views/student/ExamDetails')));
const CodeDetails = Loadable(lazy(() => import('../views/student/CodeDetails')));
const ResultPage = Loadable(lazy(() => import('./../views/student/ResultPage')));
const ExamAnalyticsPage = Loadable(lazy(() => import('./../views/student/ExamAnalyticsPage')));
const Coder = Loadable(lazy(() => import('../views/student/Coder')));
//Auth Routes
const Error = Loadable(lazy(() => import('../views/authentication/Error')));
const Register = Loadable(lazy(() => import('../views/authentication/Register')));
const Login = Loadable(lazy(() => import('../views/authentication/Login')));
const UserAccount = Loadable(lazy(() => import('../views/authentication/UserAccount')));
const UserProfile = Loadable(lazy(() => import('../views/authentication/UserProfile')));

// Teacher Routes
const CreateExamPage = Loadable(lazy(() => import('./../views/teacher/CreateExamPage')));
const ExamLogPage = Loadable(lazy(() => import('./../views/teacher/ExamLogPage')));
const AddQuestions = Loadable(lazy(() => import('./../views/teacher/AddQuestions')));
const PrivateRoute = Loadable(lazy(() => import('src/views/authentication/PrivateRoute')));
const TeacherRoute = Loadable(lazy(() => import('src/views/authentication/TeacherRoute')));

const Router = createBrowserRouter(
  createRoutesFromElements(
    // Every router we create will now go in here as
    // they going to be child of our main App component
    <>
      {/* // Private Routes */}
      <Route path="" element={<PrivateRoute />}>
        {/* // Main layout */}
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
          <Route path="" element={<TeacherRoute />}>
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
      <Route path="/auth" element={<BlankLayout />}>
        <Route path="404" element={<Error />} />
        <Route path="/auth/register" element={<Register />} />
        <Route path="/auth/login" element={<Login />} />
        {/* <Route path="*" element={<Navigate to="/auth/404" />} /> */}
      </Route>
    </>,
  ),
);

export default Router;
