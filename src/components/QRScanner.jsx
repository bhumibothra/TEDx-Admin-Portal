import { useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

// Opens the camera and reads a QR code. Assumes the Team QR encodes
// the teamId as plain text (or as JSON like {"teamId":"TEAM001"}).
export default function QRScanner({ onScanned, onCancel }) {
  const scannerRef = useRef(null)
  const regionId = 'qr-reader-region'

  useEffect(() => {
    const html5Qr = new Html5Qrcode(regionId)
    scannerRef.current = html5Qr

    html5Qr
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 220 },
        (decodedText) => {
          let teamId = decodedText.trim()
          try {
            const parsed = JSON.parse(decodedText)
            if (parsed.teamId) teamId = parsed.teamId
          } catch {
            // not JSON, that's fine
          }
          html5Qr.stop().then(() => onScanned(teamId))
        },
        () => {
          // fires continuously while no QR is found -- ignore
        }
      )
      .catch((err) => {
        console.error('Camera could not start:', err)
      })

    return () => {
      html5Qr.stop().catch(() => {})
    }
  }, [onScanned])

  function handleCancel() {
    scannerRef.current?.stop().catch(() => {})
    onCancel()
  }

  return (
    <div>
      <div id={regionId} style={{ width: '100%', borderRadius: 12, overflow: 'hidden' }} />
      <p className="hint">Point the camera at the team's QR code.</p>
      <button className="ghost" onClick={handleCancel}>Cancel Scan</button>
    </div>
  )
}