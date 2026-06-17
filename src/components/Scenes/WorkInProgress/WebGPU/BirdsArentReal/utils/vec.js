// Leva vec3 controls hand back `{ x, y, z }` objects; three props want arrays.
// One tiny converter shared by the scene + its prop-driven child components.
const v3 = (o) => [o.x, o.y, o.z];

export default v3;
