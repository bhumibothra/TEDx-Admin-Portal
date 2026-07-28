import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import TeamLookup from './TeamLookup'
import QRScanner from './QRScanner'
import TeamCard from './TeamCard'
import ScoreForm from './ScoreForm'
import HintCoinButton from './HintCoinButton'
import Leaderboard from './Leaderboard'

export default function AdminDashboard({ admin, onLogout }) {
  const [assignedStall, setAssignedStall] = useState(null)
  const [team, setTeam] = useState(null)
  const [warning, setWarning] = useState('')
  const [view, setView] = useState('dashboard')
  const [hintUsedThisStall, setHintUsedThisStall] = useState(false)

  useEffect(() => {
    async function fetchAssignedStall() {
      try {
        const adminsRef = collection(db, 'admin_users')
        const q = query(adminsRef, where('Email', '==', admin.Email))
        const snap = await getDocs(q)
        if (!snap.empty) {
                setAssignedStall(snap.docs[0].data().stallAssigned)
        } 
        else {
                console.warn("Admin not found in admin_users collection")
        }
      } catch (err) {
        console.error('Could not fetch assigned stall:', err)
      }
    }
    fetchAssignedStall()
  }, [admin])

  function handleTeamFound(foundTeam) {
    setWarning('')
    setHintUsedThisStall(false)
    setTeam(foundTeam)
    setView('team')
  }

  async function handleQRScanned(teamId) {
    try {
      const teamRef = doc(db, 'teams', teamId)
      const snap = await getDoc(teamRef)
      if (!snap.exists()) {
        setWarning(`No team found with ID "${teamId}".`)
        setView('dashboard')
        return
      }
      handleTeamFound({ id: snap.id, ...snap.data() })
    } catch (err) {
      console.error(err)
      setWarning('Could not look up scanned team.')
      setView('dashboard')
    }
  }

  // Fixed at your assigned stall -- no dropdown, so you can't accidentally
  // verify the wrong stall. Falls back to Stall 1 only if lookup fails.
  const stallNumber = assignedStall || 1

  return (
    <div className="shell">
      <div className="topbar">
        <h1>TEDxpedition · Admin</h1>
        <span className="stall-tag">Stall {stallNumber}</span>
      </div>

      <div className="content">
        {view === 'dashboard' && (
          <>
            <p className="hint">
              Welcome, {admin.Name || admin.Email}. Your assigned stall is{' '}
              <strong>Stall {stallNumber}</strong>{!assignedStall && ' (default -- ask a senior to set your stallAssigned field)'}.
            </p>

            {warning && <div className="error-banner">{warning}</div>}

            <button className="primary" onClick={() => setView('scan')} style={{ marginBottom: 12 }}>
              Scan Team QR
            </button>

            <TeamLookup onTeamFound={handleTeamFound} />

            <button className="ghost" onClick={() => setView('leaderboard')} style={{ marginTop: 16 }}>
              View Leaderboard
            </button>
          </>
        )}

        {view === 'scan' && (
          <QRScanner onScanned={handleQRScanned} onCancel={() => setView('dashboard')} />
        )}

        {view === 'team' && team && (
          <>
            <TeamCard team={team} />
            <HintCoinButton
              team={team}
              onDeducted={(updatedTeam) => {
                setTeam(updatedTeam)
                setHintUsedThisStall(true)
              }}
            />
            <ScoreForm
              team={team}
              stallNumber={stallNumber}
              adminId={admin.id}
              hintUsed={hintUsedThisStall}
              onSubmitted={() => { setTeam(null); setView('dashboard') }}
              onCancel={() => { setTeam(null); setView('dashboard') }}
            />
          </>
        )}

        {view === 'leaderboard' && <Leaderboard onBack={() => setView('dashboard')} />}

        <button className="ghost" onClick={onLogout} style={{ marginTop: 24 }}>
          Log out
        </button>
      </div>
    </div>
  )
}
