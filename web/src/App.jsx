import React from 'react'
import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import Drive from './pages/Drive.jsx'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from './lib/api.js'

function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await api.get('/auth/me', { withCredentials: true })
      return data
    }
  })
}

function Nav() {
  const { data: me } = useMe()
  const navigate = useNavigate()
  const qc = useQueryClient()
  async function logout() {
    await api.post('/auth/logout', {}, { withCredentials: true })
    qc.invalidateQueries({ queryKey: ['me'] })
    navigate('/login')
  }
  return (
    <div className="nav">
      <Link to="/" className="brand">Dobby Drive</Link>
      <div className="spacer" />
      {me ? (
        <div className="row">
          <span className="muted">Hi, {me.name}</span>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <div className="row">
          <Link to="/login">Login</Link>
          <Link to="/signup" className="btn">Signup</Link>
        </div>
      )}
    </div>
  )
}

function Guarded({ children }) {
  const { data: me, isLoading } = useMe()
  if (isLoading) return <div className="container">Loading...</div>
  if (!me) return <Navigate to="/login" replace/>
  return children
}

export default function App() {
  return (
    <div className="app">
      <Nav />
      <Routes>
        <Route path="/" element={
          <Guarded><Drive/></Guarded>
        }/>
        <Route path="/login" element={<Login/>}/>
        <Route path="/signup" element={<Signup/>}/>
      </Routes>
    </div>
  )
}
