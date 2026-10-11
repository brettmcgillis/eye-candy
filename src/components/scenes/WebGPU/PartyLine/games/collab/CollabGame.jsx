import React, { memo, useCallback, useEffect, useRef, useState } from 'react';

import BoardQuad from '../../components/BoardQuad';
import Cursors from '../../components/Cursors';
import useBoardPointer from '../../hooks/useBoardPointer';
import { isInkIndex } from '../../utils/palette';
import { quantize } from '../../utils/quantize';
import CollabHud from './CollabHud';
import EraserRing from './EraserRing';
import { BRUSH_WIDTHS } from './rules';
import useCollabCanvas from './useCollabCanvas';

function CollabGame({ c, party, rect, rectRef }) {
  const { meta, room, selfId } = party;
  const me = meta.players[selfId];
  const [brush, setBrush] = useState(1);
  const [pickedInk, setInk] = useState(null);
  const [erasing, setErasing] = useState(false);
  const ink = isInkIndex(pickedInk) ? pickedInk : (me?.color ?? 0);
  const toolRef = useRef({ erasing, ink });
  toolRef.current = { erasing, ink };
  const board = useCollabCanvas(c.collabResolution);

  useEffect(() => {
    board.reset();
    room.getLog().forEach(board.drawOp);
    return room.subscribeOps(({ ops, reset }) => {
      if (reset) board.reset();
      ops.forEach((op) => {
        if (!reset && op.pid === selfId) return;
        board.drawOp(op);
      });
    });
  }, [board, room, selfId]);

  const width = BRUSH_WIDTHS[brush];
  const onBatch = useCallback(
    (points) => {
      if (!me) return;
      board.drawStroke(points, ink, width, erasing);
      room.dispatch({
        c: ink,
        erase: erasing,
        p: points,
        type: 'stroke',
        w: width,
      });
    },
    [board, erasing, ink, me, room, width]
  );
  const onCursor = useCallback(
    (data) =>
      room.sendCursor(
        data && [...data, toolRef.current.ink, toolRef.current.erasing ? 1 : 0]
      ),
    [room]
  );

  const localCursorRef = useBoardPointer({
    enabled: Boolean(me),
    onBatch,
    onCursor,
    rectRef,
  });

  useEffect(() => {
    const local = localCursorRef.current;
    if (!local.visible) return;
    onCursor([quantize(local.u), quantize(local.v), local.down ? 1 : 0]);
  }, [erasing, ink, localCursorRef, onCursor]);

  return (
    <>
      <BoardQuad ink={board.texture} paperColor={c.paperColor} rect={rect} />
      <EraserRing
        active={erasing}
        boardSize={rect.size}
        localCursorRef={localCursorRef}
        rectRef={rectRef}
        width={width}
      />
      <Cursors
        localCursorRef={localCursorRef}
        localErasing={erasing}
        localInk={ink}
        players={meta.players}
        rectRef={rectRef}
        room={room}
        scale={c.pencilScale}
        selfId={selfId}
      />
      <CollabHud
        board={board}
        brush={brush}
        game={meta.game}
        erasing={erasing}
        ink={ink}
        isHost={party.isHost}
        me={me}
        onBrush={setBrush}
        onErase={setErasing}
        onInk={(index) => {
          setInk(index);
          setErasing(false);
        }}
        paperColor={c.paperColor}
        promptSeconds={meta.settings?.collabPromptSeconds}
        room={room}
      />
    </>
  );
}

export default memo(CollabGame);
