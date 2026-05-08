import React from 'react';
import { BiSolidInvader } from 'react-icons/bi';
import {
  FaBomb,
  FaBook,
  FaCloud,
  FaFlag,
  FaFlask,
  FaGhost,
  FaHandPaper,
  FaMobileAlt,
  FaMusic,
  FaPaw,
  FaPen,
  FaPlane,
  FaToolbox,
  FaTools,
} from 'react-icons/fa';
import {
  GiAtomCore,
  GiBrightExplosion,
  GiCandleLight,
  GiDiceEightFacesEight,
  GiDiceTwentyFacesTwenty,
  GiPaperBoat,
  GiPapers,
  GiPistolGun,
  GiPoliceBadge,
  GiRabbit,
  GiSewingString,
  GiSinkingShip,
  GiSmokeBomb,
  GiSpiderWeb,
} from 'react-icons/gi';
import { ImLifebuoy } from 'react-icons/im';
import { IoDice } from 'react-icons/io5';
import { LiaDumpsterFireSolid } from 'react-icons/lia';
import { MdDirectionsRun } from 'react-icons/md';
import {
  PiBirdDuotone,
  PiDiamondsFourFill,
  PiDiamondsFourThin,
  PiSkullDuotone,
  PiVirusDuotone,
} from 'react-icons/pi';
import { TbDeviceTvOldFilled, TbSquare, TbVectorSpline } from 'react-icons/tb';
import { WiSmoke } from 'react-icons/wi';
import { Link } from 'react-router-dom';

import { iconFile } from '../../../utils/appUtils';

/* ── compound icons ──────────────────────────────────────── */
function FoldedFrameIcon() {
  return (
    <>
      <TbSquare color="#111827" style={{ fontSize: '1em' }} />
      <TbSquare color="#374151" style={{ fontSize: '0.7em' }} />
      <TbSquare color="#6b7280" style={{ fontSize: '0.45em' }} />
    </>
  );
}
function MyceliumIcon() {
  return (
    <>
      <PiVirusDuotone color="#9ca3af" />
      <PiVirusDuotone color="#dc2626" style={{ transform: 'rotate(180deg)' }} />
    </>
  );
}
function CumulusIcon() {
  return (
    <>
      <PiSkullDuotone color="#94a3b8" />
      <FaCloud color="#7dd3fc" />
    </>
  );
}
function DiceIcon() {
  return (
    <>
      <GiDiceEightFacesEight color="#dc2626" />
      <IoDice color="#3b82f6" />
      <GiDiceTwentyFacesTwenty color="#ec4899" />
    </>
  );
}
function WatercolorIcon() {
  return (
    <>
      <PiDiamondsFourThin color="#111827" />
      <PiDiamondsFourFill color="#374151" />
      <PiDiamondsFourThin color="#111827" />
    </>
  );
}
function CardinalsIcon() {
  return (
    <>
      <PiBirdDuotone color="#dc2626" />
      <PiBirdDuotone color="#ef4444" />
    </>
  );
}
function ThatsAllFolks() {
  return (
    <>
      <GiPistolGun color="#374151" />
      <WiSmoke color="#9ca3af" />
    </>
  );
}
function FireIcon() {
  return (
    <img
      src={iconFile('fire-icon.svg')}
      alt="Fire"
      style={{ width: '1em', height: '1em', verticalAlign: 'middle' }}
    />
  );
}
function HotBoxIcon() {
  return (
    <>
      <FireIcon />
      <GiSmokeBomb color="#7dd3fc" />
    </>
  );
}
function MultiplayerIcon() {
  return (
    <>
      <MdDirectionsRun color="#10b981" />
      <MdDirectionsRun color="#6ee7b7" />
    </>
  );
}
function GhostStoriesIcon() {
  return (
    <>
      <FaBook color="#4f46e5" />
      <FaGhost color="#e2e8f0" />
    </>
  );
}
function LevaTitleIcon() {
  return (
    <>
      <FaBomb color="#374151" />
      <FireIcon />
      <GiBrightExplosion color="#fbbf24" />
    </>
  );
}
function ImgIcon({ src, alt }) {
  return (
    <img
      src={iconFile(src)}
      alt={alt}
      style={{
        width: '1em',
        height: '1em',
        verticalAlign: 'middle',
        objectFit: 'contain',
      }}
    />
  );
}

/* ── sections ─────────────────────────────────────────────── */
const SECTIONS = [
  {
    title: 'UI / System',
    rows: [
      {
        label: 'Debug toggle (Scenemoji)',
        icon: () => <ImgIcon src="reversal-inner.png" alt="Debug" />,
        name: '/icons/reversal-inner.png',
      },
      {
        label: 'Leva title bar',
        icon: () => <LevaTitleIcon />,
        name: 'FaBomb #374151 · fire-icon.svg · GiBrightExplosion #fbbf24',
      },
      {
        label: 'Fallback / noScene',
        icon: () => <PiSkullDuotone color="#888" />,
        name: 'PiSkullDuotone #888',
      },
    ],
  },
  {
    title: 'Custom PNG Icons',
    rows: [
      {
        label: 'Turbo Flex',
        icon: () => <ImgIcon src="turbo_flex.png" alt="Turbo Flex" />,
        name: '/icons/turbo_flex.png',
      },
      {
        label: 'Reversal',
        icon: () => <ImgIcon src="reversal.png" alt="Reversal" />,
        name: '/icons/reversal.png',
      },
      {
        label: 'Reversal Inner',
        icon: () => <ImgIcon src="reversal-inner.png" alt="Reversal Inner" />,
        name: '/icons/reversal-inner.png',
      },
      {
        label: 'Reversal Outer',
        icon: () => <ImgIcon src="reversal-outer-empty.png" alt="Outer" />,
        name: '/icons/reversal-outer-empty.png',
      },
      {
        label: 'Bret',
        icon: () => <ImgIcon src="bret.png" alt="Bret" />,
        name: '/icons/bret.png',
      },
      {
        label: 'Bret Inner',
        icon: () => <ImgIcon src="bret-inner.png" alt="Bret Inner" />,
        name: '/icons/bret-inner.png',
      },
      {
        label: 'Bret Circled',
        icon: () => <ImgIcon src="bret-circled.png" alt="Bret Circled" />,
        name: '/icons/bret-circled.png',
      },
    ],
  },
  {
    title: 'Area Icons',
    rows: [
      {
        label: 'WIP',
        icon: () => <FaTools color="#94a3b8" />,
        name: 'FaTools #94a3b8',
      },
      {
        label: 'TestLab',
        icon: () => <FaFlask color="#22c55e" />,
        name: 'FaFlask #22c55e',
      },
      {
        label: 'Toolbox',
        icon: () => <FaToolbox color="#dc2626" />,
        name: 'FaToolbox #dc2626',
      },
    ],
  },
  {
    title: 'Showcase — WebGL',
    rows: [
      {
        label: 'Folded Frame',
        icon: () => <FoldedFrameIcon />,
        name: 'TbSquare #111827 / #374151 / #6b7280',
      },
      {
        label: 'LoGlow',
        icon: () => <ImgIcon src="bret-inner.png" alt="LoGlow" />,
        name: '/icons/bret-inner.png',
      },
      {
        label: 'All My Thoughts Are So Cumulus',
        icon: () => <CumulusIcon />,
        name: 'PiSkullDuotone #94a3b8 · FaCloud #7dd3fc',
      },
      {
        label: 'Paper Stack',
        icon: () => <GiPapers color="#111827" />,
        name: 'GiPapers #111827',
      },
      {
        label: "Quinn's Dice",
        icon: () => <DiceIcon />,
        name: 'GiDice8 #dc2626 · IoDice #3b82f6 · GiDice20 #ec4899',
      },
      {
        label: 'Mycelium',
        icon: () => <MyceliumIcon />,
        name: 'PiVirusDuotone #9ca3af · PiVirusDuotone #dc2626 (rotated)',
      },
      {
        label: 'Rosie',
        icon: () => <ImgIcon src="rose.png" alt="Rosie" />,
        name: 'rose.png',
      },
      {
        label: 'Cardinals',
        icon: () => <CardinalsIcon />,
        name: 'PiBirdDuotone #dc2626 · #ef4444',
      },
      {
        label: 'Watercolor Squares',
        icon: () => <WatercolorIcon />,
        name: 'PiDiamondsFourThin #111827 · Fill #374151 · Thin #111827',
      },
    ],
  },
  {
    title: 'Work In Progress — WebGL',
    rows: [
      {
        label: 'CRT Test',
        icon: () => <TbDeviceTvOldFilled color="#111827" />,
        name: 'TbDeviceTvOldFilled #111827',
      },
      {
        label: 'Dumpster Fire',
        icon: () => <LiaDumpsterFireSolid color="#111827" />,
        name: 'LiaDumpsterFireSolid #111827',
      },
      {
        label: 'Burning At Both Ends',
        icon: () => <GiCandleLight color="#fbbf24" />,
        name: 'GiCandleLight #fbbf24',
      },
      {
        label: "That's All Folks",
        icon: () => <ThatsAllFolks />,
        name: 'GiPistolGun #374151 · WiSmoke #9ca3af',
      },
      {
        label: 'Flying High',
        icon: () => <FaPlane color="#111827" />,
        name: 'FaPlane #111827',
      },
      {
        label: 'Police Presence',
        icon: () => <GiPoliceBadge color="#111827" />,
        name: 'GiPoliceBadge #111827',
      },
      {
        label: 'Still Pulling For You',
        icon: () => <GiSinkingShip color="#1e40af" />,
        name: 'GiSinkingShip #1e40af',
      },
      {
        label: 'Row It Alone',
        icon: () => <GiPaperBoat color="#93c5fd" />,
        name: 'GiPaperBoat #93c5fd',
      },
      {
        label: 'Staying Afloat',
        icon: () => <ImLifebuoy color="#ef4444" />,
        name: 'ImLifebuoy #ef4444',
      },
      {
        label: "Quinn's Playground",
        icon: () => <FaPaw color="#a78bfa" />,
        name: 'FaPaw #a78bfa',
      },
    ],
  },
  {
    title: 'Work In Progress — WebGPU',
    rows: [
      {
        label: 'All My Friends Are Ghosts',
        icon: () => <FaGhost color="#cbd5e1" />,
        name: 'FaGhost #cbd5e1',
      },
      {
        label: 'Surrender',
        icon: () => <FaFlag color="#e2e8f0" />,
        name: 'FaFlag #e2e8f0',
      },
      {
        label: 'Stay Hunted',
        icon: () => <GiRabbit color="#d1d5db" />,
        name: 'GiRabbit #d1d5db',
      },
      {
        label: 'Ghost Stories',
        icon: () => <GhostStoriesIcon />,
        name: 'FaBook #4f46e5 · FaGhost #e2e8f0',
      },
    ],
  },
  {
    title: 'Toolbox — WebGL',
    rows: [
      { label: 'Fire Test', icon: () => <FireIcon />, name: 'fire-icon.svg' },
      {
        label: 'Hot Box',
        icon: () => <HotBoxIcon />,
        name: 'fire-icon.svg · GiSmokeBomb #7dd3fc',
      },
      {
        label: 'Pen Plotter',
        icon: () => <FaPen color="#1e293b" />,
        name: 'FaPen #1e293b',
      },
      {
        label: 'Spline Editor',
        icon: () => <TbVectorSpline color="#a855f7" />,
        name: 'TbVectorSpline #a855f7',
      },
      {
        label: 'Smoke Test',
        icon: () => <GiSmokeBomb color="#93c5fd" />,
        name: 'GiSmokeBomb #93c5fd',
      },
      {
        label: 'Character Controller',
        icon: () => <MdDirectionsRun color="#10b981" />,
        name: 'MdDirectionsRun #10b981',
      },
      {
        label: 'Multiplayer Madness',
        icon: () => <MultiplayerIcon />,
        name: 'MdDirectionsRun #10b981 · #6ee7b7',
      },
    ],
  },
  {
    title: 'Toolbox — WebGPU',
    rows: [
      {
        label: 'Ghost Buster',
        icon: () => <FaGhost color="#cbd5e1" />,
        name: 'FaGhost #cbd5e1',
      },
      {
        label: 'Character Controller',
        icon: () => <MdDirectionsRun color="#10b981" />,
        name: 'MdDirectionsRun #10b981',
      },
      {
        label: 'Multiplayer Madness',
        icon: () => <MultiplayerIcon />,
        name: 'MdDirectionsRun #10b981 · #6ee7b7',
      },
    ],
  },
  {
    title: 'Test Lab — WebGL',
    rows: [
      {
        label: 'Fluid Test',
        icon: () => <ImLifebuoy color="#ef4444" />,
        name: 'ImLifebuoy #ef4444',
      },
      {
        label: 'Hand Stuff',
        icon: () => <FaHandPaper color="#fbbf24" />,
        name: 'FaHandPaper #fbbf24',
      },
      {
        label: 'PixelHater',
        icon: () => <BiSolidInvader color="#a855f7" />,
        name: 'BiSolidInvader #a855f7',
      },
      {
        label: 'Particle Lab',
        icon: () => <GiAtomCore color="#991b1b" />,
        name: 'GiAtomCore #991b1b',
      },
      {
        label: 'StrudelDoodle',
        icon: () => <FaMusic color="#e879f9" />,
        name: 'FaMusic #e879f9',
      },
      {
        label: 'Explosion Test',
        icon: () => <FaBomb color="#374151" />,
        name: 'FaBomb #374151',
      },
    ],
  },
  {
    title: 'Test Lab — WebGPU',
    rows: [
      {
        label: 'Network Test',
        icon: () => <GiSpiderWeb color="#94a3b8" />,
        name: 'GiSpiderWeb #94a3b8',
      },
      {
        label: 'Mobile Physics Test',
        icon: () => <FaMobileAlt color="#64748b" />,
        name: 'FaMobileAlt #64748b',
      },
      {
        label: 'The Loom',
        icon: () => <GiSewingString color="#e2e8f0" />,
        name: 'GiSewingString #e2e8f0',
      },
    ],
  },
];

/* ── table components ─────────────────────────────────────── */
function Row({ label, icon: Icon, name }) {
  const swatch = name.match(/#([0-9a-fA-F]{3,6})/)?.[0];
  return (
    <tr>
      <td
        style={{
          padding: '0.4rem 0.75rem',
          borderBottom: '1px solid #f3f4f6',
          fontSize: '0.85rem',
          color: '#374151',
        }}
      >
        {label}
      </td>
      <td
        style={{
          padding: '0.4rem 0.75rem',
          borderBottom: '1px solid #f3f4f6',
          fontSize: '1.4rem',
        }}
      >
        <Icon />
      </td>
      <td
        style={{
          padding: '0.4rem 0.75rem',
          borderBottom: '1px solid #f3f4f6',
          fontSize: '0.72rem',
          color: '#6b7280',
          fontFamily: 'monospace',
        }}
      >
        {swatch ? (
          <>
            <span
              style={{
                display: 'inline-block',
                width: '0.65em',
                height: '0.65em',
                borderRadius: '50%',
                background: swatch,
                marginRight: '0.35em',
                verticalAlign: 'middle',
                border: '1px solid #d1d5db',
              }}
            />
            {name}
          </>
        ) : (
          name
        )}
      </td>
    </tr>
  );
}

function Section({ title, rows }) {
  return (
    <>
      <h2
        style={{
          color: '#6b7280',
          fontSize: '0.85rem',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          margin: '2rem 0 0.5rem',
          borderTop: '1px solid #e5e7eb',
          paddingTop: '1rem',
        }}
      >
        {title}
      </h2>
      <table
        style={{
          borderCollapse: 'collapse',
          width: '100%',
          maxWidth: 760,
          marginBottom: '1rem',
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                textAlign: 'left',
                fontSize: '0.75rem',
                color: '#6b7280',
                padding: '0.3rem 0.75rem',
              }}
            >
              Scene / Use
            </th>
            <th
              style={{
                textAlign: 'left',
                fontSize: '0.75rem',
                color: '#6b7280',
                padding: '0.3rem 0.75rem',
              }}
            >
              Icon
            </th>
            <th
              style={{
                textAlign: 'left',
                fontSize: '0.75rem',
                color: '#6b7280',
                padding: '0.3rem 0.75rem',
              }}
            >
              Component · color
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <Row key={r.label} {...r} />
          ))}
        </tbody>
      </table>
    </>
  );
}

/* ── page ─────────────────────────────────────────────────── */
export default function IconsPage() {
  return (
    <div
      style={{
        fontFamily: 'system-ui, sans-serif',
        background: '#ffffff',
        color: '#111827',
        padding: '2rem',
        minHeight: '100vh',
      }}
    >
      <nav style={{ marginBottom: '1.5rem' }}>
        <Link
          to="/loGlow"
          style={{
            color: '#6b7280',
            fontSize: '0.85rem',
            textDecoration: 'none',
          }}
        >
          ← back to app
        </Link>
      </nav>
      <h1 style={{ fontSize: '1.2rem', margin: '0 0 0.25rem' }}>
        Icon Reference
      </h1>
      <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: '0 0 0' }}>
        All scene, area, and UI icons with their colors
      </p>
      {SECTIONS.map((s) => (
        <Section key={s.title} {...s} />
      ))}
    </div>
  );
}
