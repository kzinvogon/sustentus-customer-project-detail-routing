import React from 'react'
import { Routes, Route, Navigate, Link } from 'react-router-dom'
import SustentusCustomerProjects from './components/SustentusCustomerProjects'

function Layout({ children }) {
  return (
    <div className='min-h-screen bg-slate-50'>
      <header className='bg-white shadow-sm ring-1 ring-black/5'>
        <div className='mx-auto max-w-6xl px-6 py-4 flex items-center justify-between'>
          <Link to='/projects' className='text-xl font-bold'>Sustentus</Link>
          <nav className='flex items-center gap-4 text-sm'>
            <Link to='/projects' className='hover:underline'>Projects</Link>
          </nav>
        </div>
      </header>
      <main className='mx-auto max-w-6xl px-6 py-6'>{children}</main>
    </div>
  )
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path='/' element={<Navigate to='/projects' replace />} />
        <Route path='/projects' element={<SustentusCustomerProjects mode='list' />} />
        <Route path='/projects/:id' element={<SustentusCustomerProjects mode='detail' />} />
        <Route path='/projects/:id/:tab' element={<SustentusCustomerProjects mode='detail' />} />
        <Route path='*' element={<div className='text-sm text-slate-600'>Not Found</div>} />
      </Routes>
    </Layout>
  )
}
