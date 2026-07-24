struct Particle {
    position: vec3f,
    v: vec3f,
    C: mat3x3f,
}

struct Cell {
    vx: atomic<i32>,
    vy: atomic<i32>,
    vz: atomic<i32>,
    mass: atomic<i32>,
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

fn encodeFixedPoint(floatingPoint: f32) -> i32 {
    return i32(floatingPoint * fixedPointMultiplier);
}

@group(0) @binding(0) var<storage, read> particles: array<Particle>;
@group(0) @binding(1) var<storage, read_write> cells: array<Cell>;
@group(0) @binding(2) var<uniform> sim: SimulationUniforms;
@group(0) @binding(3) var<uniform> numParticles: u32;

@compute @workgroup_size(64)
fn p2g_1(@builtin(global_invocation_id) id: vec3<u32>) {
    if (id.x < numParticles) {
        var weights: array<vec3f, 3>;

        let particle = particles[id.x];
        let cellIndex = floor(particle.position);
        let cellDiff = particle.position - (cellIndex + 0.5f);
        let sizeY = i32(sim.domainSize.y);
        let sizeZ = i32(sim.domainSize.z);

        weights[0] = 0.5f * (0.5f - cellDiff) * (0.5f - cellDiff);
        weights[1] = 0.75f - cellDiff * cellDiff;
        weights[2] = 0.5f * (0.5f + cellDiff) * (0.5f + cellDiff);

        for (var gx = 0; gx < 3; gx = gx + 1) {
            for (var gy = 0; gy < 3; gy = gy + 1) {
                for (var gz = 0; gz < 3; gz = gz + 1) {
                    let weight = weights[gx].x * weights[gy].y * weights[gz].z;
                    let cellX = vec3f(
                        cellIndex.x + f32(gx) - 1.0,
                        cellIndex.y + f32(gy) - 1.0,
                        cellIndex.z + f32(gz) - 1.0
                    );
                    let cellDist = (cellX + 0.5f) - particle.position;
                    let Q = particle.C * cellDist;
                    let massContrib = weight;
                    let velContrib = massContrib * (particle.v + Q);
                    let cellIndex1D =
                        i32(cellX.x) * sizeY * sizeZ +
                        i32(cellX.y) * sizeZ +
                        i32(cellX.z);

                    atomicAdd(&cells[cellIndex1D].mass, encodeFixedPoint(massContrib));
                    atomicAdd(&cells[cellIndex1D].vx, encodeFixedPoint(velContrib.x));
                    atomicAdd(&cells[cellIndex1D].vy, encodeFixedPoint(velContrib.y));
                    atomicAdd(&cells[cellIndex1D].vz, encodeFixedPoint(velContrib.z));
                }
            }
        }
    }
}
