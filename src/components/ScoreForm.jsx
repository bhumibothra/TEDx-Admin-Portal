import { useState, useEffect } from 'react'
import { doc, updateDoc, setDoc, increment, getDoc, writeBatch } from 'firebase/firestore'
import { ref, update as rtdbUpdate } from 'firebase/database'
import { db, rtdb } from '../firebase'

const TOTAL_STALLS = 7

function timeBonus(seconds) {
  const minutes = seconds / 60
  if (minutes <= 1) return 50
  if (minutes <= 2) return 40
  if (minutes <= 3) return 30
  if (minutes <= 4) return 20
  if (minutes <= 5) return 10
  return 0
}

export default function ScoreForm({ team, stallNumber, adminId, hintUsed, onSubmitted, onCancel }) {
  const [score, setScore] = useState('')
  const [bonus, setBonus] = useState('0')
  const [penalty, setPenalty] = useState('0')
  const [seconds, setSeconds] = useState('')
  const [remarks, setRemarks] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [checkingDuplicate, setCheckingDuplicate] = useState(true)
  const [alreadyCompleted, setAlreadyCompleted] = useState(false)

  // Block wrong-stall submissions outright (not just a warning).
  const stallMismatch = team.currentStall && team.currentStall !== stallNumber

  // Check on load whether this stall was already scored for this team,
  // to prevent double-submitting and double-adding to totalScore.
  useEffect(() => {
    async function checkDuplicate() {
      setCheckingDuplicate(true)
      try {
        const progressRef = doc(db, 'team_progress', team.id)
        const snap = await getDoc(progressRef)
        const stallKey = `stall${stallNumber}`
        if (snap.exists() && snap.data()[stallKey]?.completed) {
          setAlreadyCompleted(true)
        }
      } catch (err) {
        console.error(err)
      }
      setCheckingDuplicate(false)
    }
    checkDuplicate()
  }, [team.id, stallNumber])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (stallMismatch) {
      setError(`Blocked: team is at Stall ${team.currentStall}, not Stall ${stallNumber}.`)
      return
    }
    if (alreadyCompleted) {
      setError('This stall was already scored for this team. Submission blocked to prevent duplicate scoring.')
      return
    }

    const scoreNum = Number(score)
    const bonusNum = Number(bonus) || 0
    const penaltyNum = Number(penalty) || 0
    const secondsNum = Number(seconds) || 0
    const autoTimeBonus = seconds ? timeBonus(secondsNum) : 0

    if (score === '' || Number.isNaN(scoreNum)) {
      setError('Enter a score before submitting.')
      return
    }

    const totalForThisStall = scoreNum + bonusNum + autoTimeBonus - penaltyNum
    const stallKey = `stall${stallNumber}`
    const isFinalStall = stallNumber >= TOTAL_STALLS
    const now = new Date().toISOString();
    setSaving(true)
    try {
      // Firestore batch write: team_progress and teams update together,
      // atomically -- if one fails, neither is applied. (Realtime Database's
      // leaderboard mirror is a separate product, so it stays a second step
      // right after -- can't be combined into the same Firestore batch.)
      const batch = writeBatch(db)

      const progressRef = doc(db, 'team_progress', team.id)
      batch.set(
        progressRef,
        {
          [stallKey]: {
            startedAt: null,
            endedAt: now,
            timeTaken: secondsNum || null,
            score: scoreNum,
            completed: true,
            hintUsed: !!hintUsed,
            verifiedBy: adminId || "unknown",
            remarks: remarks || null,
          },
        },
        { merge: true }
      )

      const teamRef = doc(db, 'teams', team.id)
      const teamUpdate = {
        totalScore: increment(totalForThisStall),
        status: 'playing',
        totalTime: increment(secondsNum),
        updatedAt: now,
      }
      if (isFinalStall) {
        teamUpdate.status = 'finished'
        teamUpdate.finishTime = now
      } else {
        teamUpdate.currentStall = stallNumber + 1
      }
      batch.update(teamRef, teamUpdate)

      await batch.commit()

      const freshTeamSnap = await getDoc(teamRef)
      const freshTeam = freshTeamSnap.data()

      await rtdbUpdate(ref(rtdb, `leaderboard/${team.id}`), {
        teamName: freshTeam.teamName || team.teamName || team.id,
        totalScore: freshTeam.totalScore ?? totalForThisStall,
        totalTime: freshTeam.totalTime ?? null,
        currentStall: freshTeam.currentStall ?? stallNumber,
        status: freshTeam.status,
      })

      setSuccess(
        isFinalStall
          ? `Saved. ${team.teamName || team.id} has finished the event!`
          : `Saved. ${team.teamName || team.id} moves to Stall ${stallNumber + 1}. Leaderboard updated.`
      )
      onSubmitted()
    } catch (err) {
      console.error(err)
      setError('Could not save to Firebase. Check the console for details.')
    }
    setSaving(false)
  }

  if (checkingDuplicate) {
    return <p className="hint">Checking previous progress...</p>
  }

  return (
    <form onSubmit={handleSubmit}>
      {stallMismatch && (
        <div className="error-banner">
          This team is at Stall {team.currentStall}, not Stall {stallNumber}. Submission is blocked.
        </div>
      )}
      {alreadyCompleted && !stallMismatch && (
        <div className="error-banner">
          Stall {stallNumber} was already scored for this team. Submission is blocked.
        </div>
      )}

      <div className="field">
        <label>Score (out of stall max)</label>
        <input type="number" value={score} onChange={(e) => setScore(e.target.value)} placeholder="e.g. 80" />
      </div>

      <div className="stat-row" style={{ marginBottom: 16 }}>
        <div className="field" style={{ flex: 1, marginBottom: 0 }}>
          <label>Bonus</label>
          <input type="number" value={bonus} onChange={(e) => setBonus(e.target.value)} />
        </div>
        <div className="field" style={{ flex: 1, marginBottom: 0 }}>
          <label>Penalty</label>
          <input type="number" value={penalty} onChange={(e) => setPenalty(e.target.value)} />
        </div>
      </div>

      <div className="field">
        <label>Time taken (seconds) — optional, auto-adds time bonus</label>
        <input type="number" value={seconds} onChange={(e) => setSeconds(e.target.value)} placeholder="e.g. 95" />
      </div>

      <div className="field">
        <label>Remarks (optional)</label>
        <input type="text" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="e.g. Great teamwork" />
      </div>

      {error && <div className="error-banner">{error}</div>}
      {success && <div className="success-banner">{success}</div>}

      <button className="primary" type="submit" disabled={saving || stallMismatch || alreadyCompleted}>
        {saving ? 'Saving...' : 'Submit & Unlock Next Clue'}
      </button>
      <button className="ghost" type="button" onClick={onCancel}>
        Cancel
      </button>
    </form>
  )
}
