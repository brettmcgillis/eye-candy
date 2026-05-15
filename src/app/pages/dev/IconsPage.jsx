import React from 'react';
import { FaBomb } from 'react-icons/fa';
import { GiBrightExplosion } from 'react-icons/gi';
import { PiSkullDuotone } from 'react-icons/pi';
import { Link } from 'react-router-dom';

import { iconFile } from '../../../utils/appUtils';
import sceneRegistry, {
  AREAS,
  AREA_ICONS,
  CHANNELS,
  DEFAULT_SCENE_PATH,
} from '../../sceneRegistry';

const AREA_ICON_ORDER = ['wip', 'testlab', 'toolbox'];
const AREA_SECTION_ORDER = ['showcase', 'wip', 'toolbox', 'testlab'];
const CHANNEL_ORDER = ['webgl', 'webgpu'];

function FireIcon() {
  return (
    <img
      src={iconFile('fire-icon.svg')}
      alt="Fire"
      style={{ width: '1em', height: '1em', verticalAlign: 'middle' }}
    />
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

const STATIC_SECTIONS = [
  {
    title: 'UI / System',
    rows: [
      {
        label: 'Debug toggle (Scenemoji)',
        icon: () => <ImgIcon src="reversal-inner.png" alt="Debug" />,
      },
      {
        label: 'Leva title bar',
        icon: () => <LevaTitleIcon />,
      },
      {
        label: 'Fallback / noScene',
        icon: () => <PiSkullDuotone color="#888" />,
      },
    ],
  },
  {
    title: 'Custom PNG Icons',
    rows: [
      {
        label: 'Turbo Flex',
        icon: () => <ImgIcon src="turbo_flex.png" alt="Turbo Flex" />,
      },
      {
        label: 'Reversal',
        icon: () => <ImgIcon src="reversal.png" alt="Reversal" />,
      },
      {
        label: 'Reversal Inner',
        icon: () => <ImgIcon src="reversal-inner.png" alt="Reversal Inner" />,
      },
      {
        label: 'Reversal Outer',
        icon: () => <ImgIcon src="reversal-outer-empty.png" alt="Outer" />,
      },
      {
        label: 'Bret',
        icon: () => <ImgIcon src="bret.png" alt="Bret" />,
      },
      {
        label: 'Bret Inner',
        icon: () => <ImgIcon src="bret-inner.png" alt="Bret Inner" />,
      },
      {
        label: 'Bret Circled',
        icon: () => <ImgIcon src="bret-circled.png" alt="Bret Circled" />,
      },
    ],
  },
];

const AREA_SECTION = {
  title: 'Area Icons',
  rows: AREA_ICON_ORDER.map((area) => {
    return {
      label: AREAS[area],
      icon: AREA_ICONS[area],
    };
  }).filter((row) => row.icon),
};

const SCENE_SECTIONS = AREA_SECTION_ORDER.flatMap((area) => {
  return CHANNEL_ORDER.map((channel) => {
    const rows = (sceneRegistry.byArea[channel]?.[area] ?? [])
      .filter((scene) => scene.id !== 'noScene')
      .map((scene) => ({
        label: scene.label,
        icon: scene.icon,
      }));

    if (!rows.length) {
      return null;
    }

    return {
      title: `${AREAS[area]} — ${CHANNELS[channel]}`,
      rows,
    };
  }).filter(Boolean);
});

const SECTIONS = [...STATIC_SECTIONS, AREA_SECTION, ...SCENE_SECTIONS];

/* ── table components ─────────────────────────────────────── */
function Row({ label, icon: Icon }) {
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
          to={DEFAULT_SCENE_PATH}
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
        Scene and area icons come from the registry; UI and custom PNG
        references stay local to this page.
      </p>
      {SECTIONS.map((s) => (
        <Section key={s.title} {...s} />
      ))}
    </div>
  );
}
