// A 36m reach of a stream, not a river: the frame has to hold a pool, the bar
// below it and the riffle breaking over that bar, so everything is sized to
// put one pool-riffle couplet inside it. Cells are 9cm at the default 384,
// which is fine enough that the standing wave at the tail of a riffle spans
// several of them.
export const WORLD_SIZE = 36;

// How far in from the upstream and downstream rims of the bed the reach is
// held at the inflow and outfall depths. Without the second band the far
// boundary is a wall, the reach ponds against it, and the backwater walks all
// the way up the channel. In metres rather than cells so both bands follow the
// rim of a circle or the V of a rotated hexagon.
export const INFLOW_REACH = 0.95;
export const OUTFLOW_REACH = 0.75;
