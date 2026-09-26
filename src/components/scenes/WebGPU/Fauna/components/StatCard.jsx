import React, { memo } from 'react';

import { GENES, decode, fullBitmap } from '@modules/fauna';

import S from '../utils/cardStyles';

const toCss = (rgb) => `rgb(${rgb.map((v) => Math.round(v * 255)).join(',')})`;
const fixed = (v, digits = 2) => (Number.isFinite(v) ? v.toFixed(digits) : '—');

function Meter({ color, label, max = 1, value, text }) {
  const fill = Math.max(0, Math.min(1, value / max));

  return (
    <div style={S.row}>
      <span style={S.label}>{label}</span>
      <span style={S.bar}>
        <span
          style={{
            background: color,
            display: 'block',
            height: '100%',
            width: `${fill * 100}%`,
          }}
        />
      </span>
      <span style={S.value}>{text ?? fixed(value)}</span>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={S.row}>
      <span style={S.label}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function Bitmap({ color, genome }) {
  return (
    <div style={S.pixels}>
      {fullBitmap(genome, 0)
        .flat()
        .map((bit, i) => (
          <span
            // eslint-disable-next-line react/no-array-index-key
            key={i}
            style={{
              ...S.pixel,
              background: bit ? color : 'rgba(255,255,255,0.06)',
            }}
          />
        ))}
    </div>
  );
}

function StatCard({ creature, onClose, subtitle }) {
  const { genome, phenotype } = creature;
  const { features, stats, temperament } = phenotype;
  const base = toCss(phenotype.colors.base);
  const accent = toCss(phenotype.colors.accent);
  const live = creature.energy !== undefined;

  return (
    <>
      <div style={{ ...S.row, justifyContent: 'space-between' }}>
        <span style={{ color: '#9a978f' }}>{subtitle}</span>
        {onClose ? (
          <button onClick={onClose} style={S.close} type="button">
            deselect ×
          </button>
        ) : null}
      </div>
      <Bitmap color={base} genome={genome} />
      {live ? (
        <>
          <Meter
            color={accent}
            label="Energy"
            max={stats.capacity}
            value={creature.energy}
          />
          <Meter
            color={base}
            label="Age"
            max={stats.lifespan}
            text={`${Math.round(creature.age)}/${Math.round(stats.lifespan)}s`}
            value={creature.age}
          />
          <Stat
            label="State"
            value={creature.cause ? `dead · ${creature.cause}` : creature.state}
          />
          <Stat label="Generation" value={creature.generation} />
          <Stat label="Lineage" value={`#${creature.lineage}`} />
          <Stat
            label="Parents"
            value={
              creature.parents.length
                ? creature.parents.map((p) => `#${p}`).join(' + ')
                : 'founder'
            }
          />
          <Stat label="Children" value={creature.children} />
          <Stat label="Kills" value={creature.kills} />
        </>
      ) : null}
      <div style={S.section}>Body</div>
      <Stat label="Size" value={fixed(stats.size)} />
      <Stat label="Speed" value={`${fixed(stats.speed)} u/s`} />
      <Stat label="Sense" value={`${fixed(stats.sense, 1)} u`} />
      <Stat label="Armor" value={fixed(stats.armor)} />
      <Stat label="Attack" value={fixed(stats.attack)} />
      <Stat label="Metabolism" value={`${fixed(stats.metabolism, 3)} /s`} />
      <Stat label="Capacity" value={fixed(stats.capacity)} />
      <Stat label="Lifespan" value={`${Math.round(stats.lifespan)}s`} />
      <Stat label="Maturity" value={`${Math.round(stats.maturity)}s`} />
      <Stat
        label="Breeds above"
        value={`${Math.round(stats.fertilityThreshold * 100)}% energy`}
      />
      <Stat
        label="Eyes · legs"
        value={`${features.eyes} · ${features.animatedLegs}`}
      />
      <Stat label="Tentacles" value={features.tentacles} />
      <div style={S.section}>Temperament</div>
      {Object.entries(temperament).map(([name, value]) => (
        <Meter color={accent} key={name} label={name} value={value} />
      ))}
      <details style={{ marginTop: 10 }}>
        <summary style={{ color: '#9a978f', cursor: 'pointer' }}>
          All genes
        </summary>
        {Object.keys(GENES).map((name) => (
          <Stat
            key={name}
            label={name}
            value={fixed(decode(genome, name), 3)}
          />
        ))}
      </details>
    </>
  );
}

export default memo(StatCard);
