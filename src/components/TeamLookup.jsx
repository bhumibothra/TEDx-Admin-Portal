import { useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'

export default function TeamLookup({ onTeamFound }) {
  const [teamId, setTeamId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLookup(e) {
    e.preventDefault()
    setError('')
    if (!teamId.trim()) return

    setLoading(true)
    try {
      const teamRef = doc(db, 'teams', teamId.trim())
      const teamSnap = await getDoc(teamRef)

      if (!teamSnap.exists()) {
        setError(`No team found with ID "${teamId.trim()}".`)
        setLoading(false)
        return
      }

      onTeamFound({ id: teamSnap.id, ...teamSnap.data() })
    } catch (err) {
      console.error(err)
      setError('Could not reach Firebase.')
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleLookup}>
      <div className="field">
        <label>Team ID</label>
        <input
          type="text"
          placeholder="e.g. TEAM001"
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
        />
      </div>
      {error && <div className="error-banner">{error}</div>}
      <button className="primary" type="submit" disabled={loading}>
        {loading ? 'Looking up...' : 'Find Team'}
      </button>
    </form>
  )
}