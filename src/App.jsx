import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate, Link } from 'react-router-dom'
import SustentusCustomerProjects from './components/SustentusCustomerProjects'
import { WebSocketProvider } from './contexts/WebSocketContext'

function Layout({ children }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check for saved theme preference or default to light
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(savedTheme === 'dark' || (!savedTheme && prefersDark));
  }, []);

  useEffect(() => {
    // Apply theme to document
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      isDark ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'
    }`}>
      <header className={`shadow-sm ring-1 ring-black/5 transition-colors duration-200 ${
        isDark ? 'bg-slate-800 ring-slate-700' : 'bg-white'
      }`}>
        <div className='mx-auto max-w-6xl px-6 py-4 flex items-center justify-between'>
          <Link to='/projects' className='text-xl font-bold'>Sustentus</Link>
          <nav className='flex items-center gap-4 text-sm'>
            <Link to='/projects' className='hover:underline'>Projects</Link>
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                isDark 
                  ? 'bg-slate-700 hover:bg-slate-600 text-yellow-300' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
              aria-label="Toggle theme"
            >
              {isDark ? '☀️' : '🌙'}
            </button>
          </nav>
        </div>
      </header>
      <main className='mx-auto max-w-6xl px-6 py-6'>{children}</main>
    </div>
  )
}

export default function App() {
  return (
    <WebSocketProvider>
      <Layout>
        <Routes>
          <Route path='/' element={<Navigate to='/projects' replace />} />
          <Route path='/projects' element={<SustentusCustomerProjects mode='list' />} />
          <Route path='/projects/:id' element={<SustentusCustomerProjects mode='detail' />} />
          <Route path='/projects/:id/:tab' element={<SustentusCustomerProjects mode='detail' />} />
          <Route path='*' element={<div className='text-sm text-slate-600'>Not Found</div>} />
        </Routes>
      </Layout>
    </WebSocketProvider>
  )
}
