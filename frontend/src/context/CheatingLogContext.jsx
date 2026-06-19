import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

const CheatingLogContext = createContext();

export const CheatingLogProvider = ({ children }) => {
  const { userInfo } = useSelector((state) => state.auth);
  const [cheatingLog, setCheatingLog] = useState({
    totalViolations: 0,
    noFaceCount: 0,
    multipleFaceCount: 0,
    cellPhoneCount: 0,
    prohibitedObjectCount: 0,
    tabSwitchCount: 0,
    lookingAwayCount: 0,
    screenshots: [],
    examId: '',
    username: userInfo?.name || '',
    email: userInfo?.email || '',
  });

  useEffect(() => {
    if (userInfo) {
      setCheatingLog((prev) => ({
        ...prev,
        username: userInfo.name,
        email: userInfo.email,
      }));
    }
  }, [userInfo]);

  const updateCheatingLog = (newLogOrFn) => {
    setCheatingLog((prev) => {
      const newLog = typeof newLogOrFn === 'function' ? newLogOrFn(prev) : newLogOrFn;
      return { ...prev, ...newLog };
    });
  };

  const resetCheatingLog = (examId) => {
    const resetLog = {
      totalViolations: 0,
      noFaceCount: 0,
      multipleFaceCount: 0,
      cellPhoneCount: 0,
      prohibitedObjectCount: 0,
      tabSwitchCount: 0,
      lookingAwayCount: 0,
      screenshots: [],
      examId: examId,
      username: userInfo?.name || '',
      email: userInfo?.email || '',
    };
    console.log('Reset cheating log:', resetLog); // Debug log
    setCheatingLog(resetLog);
  };

  return (
    <CheatingLogContext.Provider value={{ cheatingLog, updateCheatingLog, resetCheatingLog }}>
      {children}
    </CheatingLogContext.Provider>
  );
};

export const useCheatingLog = () => {
  const context = useContext(CheatingLogContext);
  if (!context) {
    throw new Error('useCheatingLog must be used within a CheatingLogProvider');
  }
  return context;
};
