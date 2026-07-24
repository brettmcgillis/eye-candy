import { folder, monitor } from 'leva';

// Debug + diagnostics. Gizmos visualise the live attractor field in space;
// readouts surface the runtime signals that are otherwise invisible (presence
// state, people count, motion energy) so the scene is tunable while testing.
export default function getDebugControls(snapshot, { statsRef }) {
  return folder(
    {
      showAttractors: {
        label: 'Show Attractors',
        value: snapshot.showAttractors,
      },
      colorBySource: {
        label: 'Colour By Source',
        value: snapshot.colorBySource,
      },
      showImpulseLeads: {
        label: 'Show Impulses',
        value: snapshot.showImpulseLeads,
      },
      attractorGizmoScale: {
        label: 'Gizmo Scale',
        value: snapshot.attractorGizmoScale,
        min: 0.1,
        max: 4,
        step: 0.05,
      },
      attractorOpacity: {
        label: 'Gizmo Opacity',
        value: snapshot.attractorOpacity,
        min: 0.02,
        max: 1,
        step: 0.02,
      },
      showBounds: { label: 'Show Bounds', value: snapshot.showBounds },
      Readouts: folder(
        {
          people: monitor(() => statsRef.current.people, { graph: false }),
          attractors: monitor(() => statsRef.current.attractors, {
            graph: false,
          }),
          // 0 dormant · 1 sensed · 2 forming · 3 dissolving · -1 off
          presence: monitor(() => statsRef.current.presence, { graph: false }),
          bodyEnergy: monitor(() => statsRef.current.bodyEnergy, {
            graph: true,
            interval: 60,
          }),
          agitate: monitor(() => statsRef.current.agitate, {
            graph: true,
            interval: 60,
          }),
        },
        { collapsed: false }
      ),
    },
    { collapsed: true }
  );
}
