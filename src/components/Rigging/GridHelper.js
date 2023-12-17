import { _90_deg } from "../../utils/constants";

export function GridHelper({ x, y, z, size = 10, divisions = 10, ...props }) {
  return (
    <group {...props}>
      {x && <gridHelper args={[size, divisions]} rotation={[0, 0, 0]} />}
      {y && <gridHelper args={[size, divisions]} rotation={[0, 0, _90_deg]} />}
      {z && <gridHelper args={[size, divisions]} rotation={[_90_deg, 0, 0]} />}
    </group>
  );
}

export function PolarGridHelper({
  x,
  y,
  z,
  size = 10,
  divisions = 10,
  ...props
}) {
  return (
    <group {...props}>
      {x && <polarGridHelper args={[size, divisions]} rotation={[0, 0, 0]} />}
      {y && (
        <polarGridHelper args={[size, divisions]} rotation={[0, 0, _90_deg]} />
      )}
      {z && (
        <polarGridHelper args={[size, divisions]} rotation={[_90_deg, 0, 0]} />
      )}
    </group>
  );
}

function SuperGridHelper({}) {}
