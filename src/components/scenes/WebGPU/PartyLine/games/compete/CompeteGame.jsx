import React, { memo, useCallback, useEffect, useRef } from 'react';

import BoardQuad from '../../components/BoardQuad';
import Cursors from '../../components/Cursors';
import useBoardPointer from '../../hooks/useBoardPointer';
import CompeteHud from './CompeteHud';
import Eraser, { trackEraserOp } from './Eraser';
import useGridBoard from './useGridBoard';

function CompeteGame({ c, party, rect, rectRef }) {
  const { meta, room, selfId } = party;
  const { game } = meta;
  const me = meta.players[selfId];
  const gridSize = game.round?.grid ?? c.competeGridSize;
  const board = useGridBoard(gridSize);
  const eraserRef = useRef(null);

  useEffect(() => {
    board.reset();
    room.getLog().forEach(board.apply);
    return room.subscribeOps(({ ops, reset }) => {
      if (reset) board.reset();
      ops.forEach((op) => {
        board.apply(op);
        if (!reset && op.k === 'e') trackEraserOp(eraserRef, op, board.size);
      });
    });
  }, [board, room]);

  const drawing = game.phase === 'drawing';
  const onBatch = useCallback(
    (points) => room.dispatch({ p: points, type: 'stroke' }),
    [room]
  );

  const localCursorRef = useBoardPointer({
    enabled: Boolean(me) && drawing,
    onBatch,
    onCursor: room.sendCursor,
    rectRef,
  });

  return (
    <>
      <BoardQuad ink={board.texture} paperColor={c.paperColor} rect={rect} />
      <Eraser eraserRef={eraserRef} rectRef={rectRef} />
      <Cursors
        localCursorRef={localCursorRef}
        players={meta.players}
        rectRef={rectRef}
        room={room}
        scale={c.pencilScale}
        selfId={selfId}
      />
      <CompeteHud
        game={game}
        hostName={meta.players[party.hostId]?.name}
        isHost={party.isHost}
        room={room}
        settings={meta.settings ?? {}}
      />
    </>
  );
}

export default memo(CompeteGame);
