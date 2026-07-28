import { useState } from 'react'
import { signInWithPopup } from 'firebase/auth'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db, auth, googleProvider } from '../firebase'

// Real flow from the spec: sign in with Google -> look up this email
// in the Users collection -> read their Role -> let them in if it's
// an admin-type role.
export default function AdminLogin({ onLoggedIn }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleGoogleLogin() {
    setError('')
    setLoading(true)
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const email = result.user.email

      const usersRef = collection(db, 'Users')
      const q = query(usersRef, where('Email', '==', email))
      const snap = await getDocs(q)

      if (snap.empty) {
        setError(`No user record found for ${email}. Ask a senior to add you to the Users collection with a Role.`)
        setLoading(false)
        return
      }

      const userDoc = snap.docs[0]
      const userData = { id: userDoc.id, ...userDoc.data() }

      // Only let admin-type roles into this portal.
      // Adjust this check once you know the exact Role values the team uses
      // (e.g. "Stall Admin", "Super Admin").
      if (!userData.Role || !userData.Role.toLowerCase().includes('admin')) {
        setError(`Your role (${userData.Role || 'none'}) doesn't have admin access.`)
        setLoading(false)
        return
      }

      onLoggedIn(userData)
    } catch (err) {
      console.error(err)
      setError('Google sign-in failed. Check the console for details.')
    }
    setLoading(false)
  }

  return (
    <div className="content">
      {error && <div className="error-banner">{error}</div>}
      <button className="primary" onClick={handleGoogleLogin} disabled={loading}>
        {loading ? 'Signing in...' : 'Sign in with Google'}
      </button>
      <p className="hint">
        Looks your email up in the <code>Users</code> collection to find
        your <code>Role</code>. You need a document there first (ask a
        senior, or add yourself while testing).
      </p>
    </div>
  )
}
