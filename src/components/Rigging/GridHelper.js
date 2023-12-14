import { _90_deg } from "../../utils/constants";

export function GridHelper({ size = 10, divisions = 10, ...props }) {
  return (
    <group {...props}>
      <gridHelper args={[size, divisions]} rotation={[0, 0, 0]} />
      <gridHelper args={[size, divisions]} rotation={[0, 0, _90_deg]} />
      <gridHelper args={[size, divisions]} rotation={[_90_deg, 0, 0]} />
    </group>
  );
}

export function PolarGridHelper({ size = 10, divisions = 10, ...props }) {
  return (
    <group {...props}>
      <polarGridHelper args={[size, divisions]} rotation={[0, 0, 0]} />
      <polarGridHelper args={[size, divisions]} rotation={[0, 0, _90_deg]} />
      <polarGridHelper args={[size, divisions]} rotation={[_90_deg, 0, 0]} />
    </group>
  );
}
