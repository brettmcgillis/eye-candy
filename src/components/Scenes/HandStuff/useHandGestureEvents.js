// useHandGestureEvents.js
import { useEffect, useRef } from 'react';

export default function useHandGestureEvents(
  handState,
  {
    onLeftPinchStart,
    onLeftPinchEnd,
    onRightPinchStart,
    onRightPinchEnd,
    onPinchStart,
    onPinchEnd,

    onLeftCloseStart,
    onLeftCloseEnd,
    onRightCloseStart,
    onRightCloseEnd,
    onCloseStart,
    onCloseEnd,

    onLeftExpandStart,
    onLeftExpandEnd,
    onRightExpandStart,
    onRightExpandEnd,
    onExpandStart,
    onExpandEnd,
  } = {}
) {
  const prev = useRef({
    leftPinch: false,
    rightPinch: false,
    pinch: false,

    leftClosed: false,
    rightClosed: false,
    closed: false,

    leftExpanded: false,
    rightExpanded: false,
    expanded: false,
  });

  useEffect(() => {
    if (!handState) return;

    function detect(key, current, start, end) {
      const was = prev.current[key];

      if (!was && current && start) start(handState);
      if (was && !current && end) end(handState);

      prev.current[key] = current;
    }

    detect('leftPinch', handState.leftPinch, onLeftPinchStart, onLeftPinchEnd);
    detect(
      'rightPinch',
      handState.rightPinch,
      onRightPinchStart,
      onRightPinchEnd
    );
    detect('pinch', handState.pinch, onPinchStart, onPinchEnd);

    detect(
      'leftClosed',
      handState.leftClosed,
      onLeftCloseStart,
      onLeftCloseEnd
    );
    detect(
      'rightClosed',
      handState.rightClosed,
      onRightCloseStart,
      onRightCloseEnd
    );
    detect('closed', handState.closed, onCloseStart, onCloseEnd);

    detect(
      'leftExpanded',
      handState.leftExpanded,
      onLeftExpandStart,
      onLeftExpandEnd
    );
    detect(
      'rightExpanded',
      handState.rightExpanded,
      onRightExpandStart,
      onRightExpandEnd
    );
    detect('expanded', handState.expanded, onExpandStart, onExpandEnd);
  }, [handState]);

  return handState;
}
