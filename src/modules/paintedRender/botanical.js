import botanical from './botanical.json';
import createPigmentTexture from './pigment';

export default function createBotanicalTexture() {
  return createPigmentTexture(botanical);
}
