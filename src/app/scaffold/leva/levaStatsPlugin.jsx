import { Components, createPlugin, useInputContext } from 'leva/plugin';
import StatsImpl from 'three/examples/jsm/libs/stats.module.js';

import React, { useEffect, useRef } from 'react';

const { Label, Row } = Components;

let activeStatsList = [];

export function tickLevaStatsPlugin() {
  activeStatsList.forEach((stats) => stats.update());
}

function LevaStatsInput() {
  const { label, settings } = useInputContext();
  const mountRef = useRef(null);

  useEffect(() => {
    const panels = Array.isArray(settings?.panels) ? settings.panels : [0];
    const statsList = panels.map((panel) => {
      const stats = new StatsImpl();
      stats.showPanel(Number(panel) || 0);
      stats.dom.style.position = 'relative';
      stats.dom.style.top = 'auto';
      stats.dom.style.left = 'auto';
      return stats;
    });

    if (mountRef.current) {
      statsList.forEach((stats) => mountRef.current.appendChild(stats.dom));
    }
    activeStatsList = statsList;

    return () => {
      if (activeStatsList === statsList) activeStatsList = [];
      if (mountRef.current) {
        statsList.forEach((stats) => {
          if (mountRef.current.contains(stats.dom)) {
            mountRef.current.removeChild(stats.dom);
          }
        });
      }
    };
  }, [settings?.panels]);

  return (
    <Row input>
      <Label align="top">{label}</Label>
      <div
        ref={mountRef}
        style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
      />
    </Row>
  );
}

export const levaStatsPlugin = createPlugin({
  component: LevaStatsInput,
  normalize: (input) => ({
    value: 0,
    settings: {
      panels:
        typeof input === 'object' &&
        input !== null &&
        'panels' in input &&
        Array.isArray(input.panels)
          ? input.panels.map((panel) => Number(panel) || 0)
          : [0, 1, 2],
    },
  }),
  sanitize: (value) => value,
});
