// Pure display component -- shows the fetched team's key stats.
export default function TeamCard({ team }) {
  return (
    <div className="team-card">
      <h2>{team.teamName || team.id}</h2>
      <div className="sub">Team ID: {team.id} · Status: {team.status || 'unknown'}</div>
      <div className="stat-row">
        <div className="stat">
          <div className="num">{team.coins ?? '—'}</div>
          <div className="label">Coins</div>
        </div>
        <div className="stat">
          <div className="num">{team.currentStall ?? '—'}</div>
          <div className="label">Current Stall</div>
        </div>
        <div className="stat">
          <div className="num">{team.totalScore ?? 0}</div>
          <div className="label">Total Score</div>
        </div>
      </div>
    </div>
  )
}