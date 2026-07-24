import React, { lazy } from 'react';
import { GiDiceEightFacesEight, GiDiceTwentyFacesTwenty } from 'react-icons/gi';
import { IoDice } from 'react-icons/io5';

function SceneIcon() {
  return (
    <>
      <GiDiceEightFacesEight color="#dc2626" size={26} />
      <IoDice color="#3b82f6" size={26} />
      <GiDiceTwentyFacesTwenty color="#ec4899" size={26} />
    </>
  );
}

export default {
  id: 'dice',
  label: "Quinn's Dice",
  channel: 'webgl',
  area: 'showcase',
  icon: SceneIcon,
  Component: lazy(() => import('./QuinnsDice')),
};
