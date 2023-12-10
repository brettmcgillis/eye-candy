import * as THREE from "three";

export function Halo({
  innerRadius = 1,
  outerRadius = 2,
  color = "blue",
  ...props
}) {
  return (
    <mesh {...props}>
      <ringGeometry args={[innerRadius, outerRadius, 50]} />
      <meshStandardMaterial color={color} side={THREE.DoubleSide} />
    </mesh>
  );
}

export function HaloSet({ ...props }) {
  return (
    <group {...props}>
      <Halo
        position={[0, 0, 0]}
        color="lightblue"
        innerRadius={0.5}
        outerRadius={1}
      />
      <Halo
        position={[0, 0, 0]}
        color="blue"
        innerRadius={1}
        outerRadius={1.5}
      />
      <Halo
        position={[0, 0, 0]}
        color="darkblue"
        innerRadius={1.5}
        outerRadius={2}
      />
    </group>
  );
}
