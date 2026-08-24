import React from 'react';
import { FaBomb } from 'react-icons/fa';
import { GiBrightExplosion } from 'react-icons/gi';
import { PiSkullDuotone } from 'react-icons/pi';

import { iconFile } from '@utils/appUtils';

import sceneRegistry, {
  AREAS,
  AREA_ICONS,
  CHANNELS,
} from '../../../app/sceneRegistry';
import DevPageHeaderBar from '../../shell/DevPageHeaderBar';
import './IconsPage.css';

const AREA_ICON_ORDER = ['wip', 'testlab', 'toolbox'];
const AREA_SECTION_ORDER = ['showcase', 'wip', 'toolbox', 'testlab'];
const CHANNEL_ORDER = ['webgl', 'webgpu'];

function FireIcon() {
  return (
    <img
      className="icons-page__icon"
      src={iconFile('fire-icon.svg')}
      alt="Fire"
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
  return <img className="icons-page__icon" src={iconFile(src)} alt={alt} />;
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
      <td className="icons-page__cell">{label}</td>
      <td className="icons-page__cell icons-page__cell--icon">
        <Icon />
      </td>
    </tr>
  );
}

function Section({ title, rows }) {
  return (
    <>
      <h2 className="icons-page__section-title">{title}</h2>
      <table className="icons-page__table">
        <thead>
          <tr>
            <th className="icons-page__heading">Scene / Use</th>
            <th className="icons-page__heading">Icon</th>
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
    <div className="dev-page icons-page">
      <DevPageHeaderBar title="Iconography" />
      {SECTIONS.map((s) => (
        <Section key={s.title} {...s} />
      ))}
    </div>
  );
}
