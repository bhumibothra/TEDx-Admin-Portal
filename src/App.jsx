import { useState } from 'react'
import AdminLogin from './components/AdminLogin'
import AdminDashboard from './components/AdminDashboard'

export default function App() {
  const [admin, setAdmin] = useState(null)

  if (!admin) {
    return (
      <div className="shell">
        <div className="topbar">
          <h1>TEDxpedition · Admin</h1>
        </div>
        <AdminLogin onLoggedIn={setAdmin} />
      </div>
    )
  }

  return <AdminDashboard admin={admin} onLogout={() => setAdmin(null)} />
}
