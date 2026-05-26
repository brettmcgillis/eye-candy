struct Cell {
    vx: i32,
    vy: i32,
    vz: i32,
    mass: i32,
}

struct SimulationUniforms {
    domainSize: vec4f,
    containMin: vec4f,
    containMax: vec4f,
    openSides: vec4f,
    impulseCenter: vec4f,
    impulseDir: vec4f,
    impulseParams: vec4f,
}

override fixedPointMultiplier: f32;
override fixedPointMultiplierInverse: f32;
override gravity: f32;

fn encodeFixedPoint(floatingPoint: f32) -> i32 {
    return i32(floatingPoint * fixedPointMultiplier);
}

fn decodeFixedPoint(fixedPoint: i32) -> f32 {
    return f32(fixedPoint) * fixedPointMultiplierInverse;
}

fn decodeCellPosition(index: u32, domainSize: vec3u) -> vec3f {
    let yz = domainSize.y * domainSize.z;
    let x = index / yz;
    let y = (index / domainSize.z) % domainSize.y;
    let z = index % domainSize.z;

    return vec3f(f32(x), f32(y), f32(z));
}

@group(0) @binding(0) var<storage, read_write> cells: array<Cell>;
@group(0) @binding(1) var<uniform> sim: SimulationUniforms;

@compute @workgroup_size(64)
fn updateGrid(@builtin(global_invocation_id) id: vec3<u32>) {
    if (id.x < arrayLength(&cells) && cells[id.x].mass > 0) {
        let dt = sim.impulseParams.z;
        let domainSize = vec3u(sim.domainSize.xyz);
        let cellPos = decodeCellPosition(id.x, domainSize);
        let impulseDiff = sim.impulseCenter.xyz - cellPos;
        let impulseRadius = sim.impulseParams.x;
        let impulseStrength = select(
            0.0,
            smoothstep(
                impulseRadius * impulseRadius,
                0.0,
                dot(impulseDiff, impulseDiff)
            ) * sim.impulseParams.y,
            sim.impulseCenter.w > 0.5
        );
        let mass = decodeFixedPoint(cells[id.x].mass);
        var floatV = vec3f(
            decodeFixedPoint(cells[id.x].vx),
            decodeFixedPoint(cells[id.x].vy),
            decodeFixedPoint(cells[id.x].vz)
        ) / mass;

        floatV = vec3f(
            floatV.x + impulseStrength * sim.impulseDir.x,
            floatV.y + impulseStrength * sim.impulseDir.y - gravity * dt,
            floatV.z + impulseStrength * sim.impulseDir.z
        );

        cells[id.x].vx = encodeFixedPoint(floatV.x);
        cells[id.x].vy = encodeFixedPoint(floatV.y);
        cells[id.x].vz = encodeFixedPoint(floatV.z);

        if (cellPos.x < 2.0 || cellPos.x > sim.domainSize.x - 3.0) {
            cells[id.x].vx = 0;
        }
        if (cellPos.y < 2.0 || cellPos.y > sim.domainSize.y - 3.0) {
            cells[id.x].vy = 0;
        }
        if (cellPos.z < 2.0 || cellPos.z > sim.domainSize.z - 3.0) {
            cells[id.x].vz = 0;
        }
    }
}
