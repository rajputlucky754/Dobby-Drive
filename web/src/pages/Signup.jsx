import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'

export default function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const nav = useNavigate()
  const qc = useQueryClient()

  async function submit(e) {
    e.preventDefault()
    setError(null)
    try {
      await api.post('/auth/signup', { name, email, password }, { withCredentials: true })
      qc.invalidateQueries({ queryKey: ['me'] })
      nav('/')
    } catch (e) {
      setError(e.response?.data?.message || e.message)
    }
  }

  return (
    <div className="container">
      <div className="card" style={{maxWidth: 420, margin: '40px auto'}}>
        <h2>Signup</h2>
        <form onSubmit={submit} className="col">
          <input placeholder="Name" value={name} onChange={e=>setName(e.target.value)}/>
          <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/>
          <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)}/>
          {error && <div className="muted" style={{color:'#ff9b9b'}}>{error}</div>}
          <button>Create account</button>
        </form>
        <hr className="sep"/>
        <div className="muted">Have an account? <Link to="/login">Login</Link></div>
      </div>
    </div>
  )
}
