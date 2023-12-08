import './Overlay.css';

function Overlay() {
    const date = new Date();
    return (
      <div className='Overlay'>
        <div className='Top-Left'>🤘 — 🔥 — 💀</div>
        <div className='Bottom-Left'>Brett McGillis</div>
        <div className='Bottom-Right'>{`${date.getDate()} | ${date.getMonth() + 1} | ${date.getFullYear()}`}</div>
      </div>
    )
  }
  
  export default Overlay;