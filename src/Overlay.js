function Overlay() {
    const date = new Date();
    return (
      <div style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', width: '100%', height: '100%' }}>
        <div style={{ position: 'absolute', top: 40, left: 40, fontSize: '13px' }}>🤘 — 🔥 — 💀</div>
        <div style={{ position: 'absolute', bottom: 40, left: 40, fontSize: '13px' }}>Brett McGillis</div>
        <div style={{ position: 'absolute', bottom: 40, right: 40, fontSize: '13px' }}>{`${date.getDate()} | ${date.getMonth() + 1} | ${date.getFullYear()}`}</div>
      </div>
    )
  }
  
  export default Overlay;