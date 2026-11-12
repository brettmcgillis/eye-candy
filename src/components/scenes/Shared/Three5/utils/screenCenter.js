const center = [0, 0];

export default function screenCenter(_object, _camera, size) {
  center[0] = size.width / 2;
  center[1] = size.height / 2;
  return center;
}
