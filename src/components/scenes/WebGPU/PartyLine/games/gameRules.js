import collabRules from './collab/rules';
import competeRules from './compete/rules';

const GAME_RULES = {
  ScribbleBattle: competeRules,
  ScribbleTogether: collabRules,
};

export default GAME_RULES;
