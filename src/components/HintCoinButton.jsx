import { useState } from 'react'
import { doc, updateDoc, increment } from 'firebase/firestore'
import { db } from '../firebase'

// "Deduct Hint Coins" responsibility from the module spec.
export default function HintCoinButton({ team, onDeducted }) {
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')

  async function handleDeduct() {
    setError('')
    if ((team.coins ?? 0) <= 0) {
      setError('This team has 0 coins left — cannot deduct further.')
      return
    }
    setWorking(true)
    try {
      const teamRef = doc(db, 'teams', team.id)
      await updateDoc(teamRef, { coins: increment(-1) , lastHintUsedAt: new Date().toISOString() })
      onDeducted({ ...team, coins: (team.coins ?? 0) - 1 })
    } catch (err) {
      console.error(err)
      setError('Could not update coins in Firebase.')
    }
    setWorking(false)
  }

  return (
    <div style={{ marginBottom: 16 }}>
      {error && <div className="error-banner">{error}</div>}
      <button className="ghost" onClick={handleDeduct} disabled={working || (team.coins ?? 0) <= 0}>
        {working ? 'Deducting...' : `Use 1 Hint Coin (${team.coins ?? 0} left)`}
      </button>
    </div>
  )
}