// A 36m reach of a stream, not a river: the frame has to hold a pool, the bar
// below it and the riffle breaking over that bar, so everything is sized to
// put one pool-riffle couplet inside it. Cells are 9cm at the default 384,
// which is fine enough that the standing wave at the tail of a riffle spans
// several of them.
export const WORLD_SIZE = 36;

// Rows at the upstream edge held at the inflow depth, and rows at the
// downstream edge held at the outfall depth. Without the second band the far
// boundary is a wall, the reach ponds against it, and the backwater walks all
// the way up the channel.
export const INFLOW_CELLS = 10;
export const OUTFLOW_CELLS = 8;
