import { _90_deg } from "../../utils/constants";

export function GridHelper() {
  return (
    <group>
      <gridHelper rotation={[0, 0, 0]} />
      <gridHelper rotation={[0, 0, _90_deg]} />
      <gridHelper rotation={[_90_deg, 0, 0]} />
    </group>
  );
}

export default GridHelper;
