import { useEffect, useState } from 'react'
import { ref, onValue } from 'firebase/database'
import { rtdb } from '../firebase'

// "Update Leaderboard" responsibility -- this component just DISPLAYS it.
// The actual writing happens in ScoreForm.jsx after each score submission.
// onValue gives live updates: whenever any admin submits a score anywhere,
// this list refreshes automatically without a page reload.
export default function Leaderboard({ onBack }) {
  const [teams, setTeams] = useState([])

  useEffect(() => {
    const leaderboardRef = ref(rtdb, 'leaderboard')
    const unsubscribe = onValue(leaderboardRef, (snapshot) => {
      const data = snapshot.val() || {}
      const list = Object.entries(data).map(([teamId, info]) => ({ teamId, ...info }))
      list.sort((a, b) => {
        const scoreDiff = (b.totalScore ?? 0) - (a.totalScore ?? 0)
        if (scoreDiff !== 0) return scoreDiff
        // Tie-breaker: lower totalTime (faster) ranks higher.
        return (a.totalTime ?? Infinity) - (b.totalTime ?? Infinity)
      })
      setTeams(list)
    })
    return () => unsubscribe()
  }, [])

  return (
    <div>
      {teams.length === 0 && <p className="hint">No teams on the leaderboard yet.</p>}
      {teams.map((t, i) => (
        <div key={t.teamId} className="team-card" style={{ marginBottom: 10, padding: 12 }}>
          <div className="stat-row" style={{ alignItems: 'center' }}>
            <div className="stat" style={{ flex: '0 0 40px', fontWeight: 700 }}>#{i + 1}</div>
            <div style={{ flex: 1 }}>
              <strong>{t.teamName || t.teamId}</strong>
              <div className="sub" style={{ marginBottom: 0 }}>Stall {t.currentStall ?? '—'}</div>
            </div>
            <div className="stat" style={{ flex: '0 0 70px' }}>
              <div className="num">{t.totalScore ?? 0}</div>
              <div className="label">Score</div>
            </div>
          </div>
        </div>
      ))}
      <button className="ghost" onClick={onBack} style={{ marginTop: 12 }}>Back to Dashboard</button>
    </div>
  )
}
