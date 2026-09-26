import React, { memo, useEffect, useState } from 'react';

import OverlayPortal from '@app/scaffold/overlay/components/OverlayPortal';

import useNarrowScreen from '../hooks/useNarrowScreen';
import S, { panelStyle } from '../utils/cardStyles';
import StatCard from './StatCard';
import WorldHud from './WorldHud';

function summarize(lab, engine, creature) {
  if (lab) {
    return creature
      ? `Founder ${engine.founderIndex + 1}/${engine.founderCount} · ${creature.genome.plan}`
      : 'Rolling founders…';
  }

  if (creature) {
    return `#${creature.id} ${creature.genome.plan}${creature.hybrid ? ' · hybrid' : ''}`;
  }

  return engine.hud
    ? `${engine.hud.alive} alive · tap a creature`
    : 'No world yet';
}

function Overlay({ engine, onDeselect, view }) {
  const lab = view === 'lab';
  const narrow = useNarrowScreen();
  const [collapsed, setCollapsed] = useState(narrow);
  const creature = lab ? engine.founder : engine.inspected;

  useEffect(() => setCollapsed(narrow), [narrow]);

  return (
    <OverlayPortal datasetKey="faunaOverlayPortal">
      <div style={panelStyle(narrow, collapsed)}>
        <button
          onClick={() => setCollapsed((c) => !c)}
          style={S.header}
          type="button"
        >
          <span style={S.heading}>{lab ? 'Lab' : 'World'}</span>
          <span style={{ color: '#9a978f', flex: 1 }}>
            {summarize(lab, engine, creature)}
          </span>
          <span style={{ color: '#9a978f' }}>{collapsed ? '▴' : '▾'}</span>
        </button>
        {collapsed ? null : (
          <div style={S.body}>
            {!lab && engine.hud ? <WorldHud hud={engine.hud} /> : null}
            {creature ? (
              <StatCard
                creature={creature}
                onClose={lab ? null : onDeselect}
                subtitle={
                  lab
                    ? `Founder ${engine.founderIndex + 1} of ${engine.founderCount}`
                    : `${creature.phenotype.temperament.diet > 0.4 ? 'carnivore' : 'herbivore'}`
                }
              />
            ) : null}
          </div>
        )}
      </div>
    </OverlayPortal>
  );
}

export default memo(Overlay);
