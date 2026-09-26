import React, { memo } from 'react';

import S from '../utils/cardStyles';

function Line({ label, value }) {
  return (
    <div style={S.row}>
      <span style={S.label}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function WorldHud({ hud }) {
  const minutes = Math.floor(hud.time / 60);
  const seconds = String(Math.floor(hud.time % 60)).padStart(2, '0');
  const causes = Object.entries(hud.causes)
    .map(([cause, n]) => `${n} ${cause}`)
    .join(', ');

  return (
    <>
      <Line label="Time" value={`${minutes}:${seconds}`} />
      <Line
        label="Plans"
        value={`${hud.plans.invader} inv · ${hud.plans.blob} blob · ${hud.plans.swimmer} swim`}
      />
      <Line label="Generation" value={hud.maxGeneration} />
      <Line label="Lineages" value={hud.lineages} />
      <Line label="Hybrids" value={hud.hybrids} />
      <Line label="Births" value={hud.births} />
      <Line label="Deaths" value={hud.deaths} />
      {causes ? <div style={{ color: '#9a978f' }}>{causes}</div> : null}
    </>
  );
}

export default memo(WorldHud);
