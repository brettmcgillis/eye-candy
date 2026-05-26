struct Particle {
    position: vec3f,
    v: vec3f,
    C: mat3x3f,
}

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

override fixedPointMultiplierInverse: f32;
override wallStiffness: f32;

fn decodeFixedPoint(fixedPoint: i32) -> f32 {
    return f32(fixedPoint) * fixedPointMultiplierInverse;
}

fn withinRange(value: f32, minValue: f32, maxValue: f32) -> bool {
    return value >= minValue - 1.0 && value <= maxValue + 1.0;
}

@group(0) @binding(0) var<storage, read_write> particles: array<Particle>;
@group(0) @binding(1) var<storage, read> cells: array<Cell>;
@group(0) @binding(2) var<uniform> sim: SimulationUniforms;
@group(0) @binding(3) var<uniform> numParticles: u32;

@compute @workgroup_size(64)
fn g2p(@builtin(global_invocation_id) id: vec3<u32>) {
    if (id.x < numParticles) {
        let dt = sim.impulseParams.z;
        let sizeY = i32(sim.domainSize.y);
        let sizeZ = i32(sim.domainSize.z);
        let particle = particles[id.x];
        let cellIndex = floor(particle.position);
        let cellDiff = particle.position - (cellIndex + 0.5f);
        let domainMin = vec3f(1.0, 1.0, 1.0);
        let domainMax = sim.domainSize.xyz - vec3f(2.0, 2.0, 2.0);
        var weights: array<vec3f, 3>;
        var velocity = vec3f(0.0, 0.0, 0.0);
        var B = mat3x3f(vec3f(0.0), vec3f(0.0), vec3f(0.0));

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
                    let cellIndex1D =
                        i32(cellX.x) * sizeY * sizeZ +
                        i32(cellX.y) * sizeZ +
                        i32(cellX.z);
                    let weightedVelocity = vec3f(
                        decodeFixedPoint(cells[cellIndex1D].vx),
                        decodeFixedPoint(cells[cellIndex1D].vy),
                        decodeFixedPoint(cells[cellIndex1D].vz)
                    ) * weight;

                    B = B + mat3x3f(
                        weightedVelocity * cellDist.x,
                        weightedVelocity * cellDist.y,
                        weightedVelocity * cellDist.z
                    );
                    velocity = velocity + weightedVelocity;
                }
            }
        }

        particles[id.x].v = velocity;
        particles[id.x].C = B * 4.0f;
        particles[id.x].position = clamp(
            particles[id.x].position + particles[id.x].v * dt,
            domainMin,
            domainMax
        );

        let xn = particles[id.x].position + particles[id.x].v * dt * 2.0;
        let insideYZ = withinRange(xn.y, sim.containMin.y, sim.containMax.y) &&
            withinRange(xn.z, sim.containMin.z, sim.containMax.z);
        let insideXZ = withinRange(xn.x, sim.containMin.x, sim.containMax.x) &&
            withinRange(xn.z, sim.containMin.z, sim.containMax.z);
        let insideXY = withinRange(xn.x, sim.containMin.x, sim.containMax.x) &&
            withinRange(xn.y, sim.containMin.y, sim.containMax.y);
        if (insideYZ && sim.openSides.x < 0.5 && xn.x < sim.containMin.x) {
            particles[id.x].v.x = particles[id.x].v.x + wallStiffness * (sim.containMin.x - xn.x);
        }
        if (insideYZ && sim.openSides.y < 0.5 && xn.x > sim.containMax.x) {
            particles[id.x].v.x = particles[id.x].v.x + wallStiffness * (sim.containMax.x - xn.x);
        }
        if (insideXY && sim.openSides.z < 0.5 && xn.z < sim.containMin.z) {
            particles[id.x].v.z = particles[id.x].v.z + wallStiffness * (sim.containMin.z - xn.z);
        }
        if (insideXY && sim.openSides.w < 0.5 && xn.z > sim.containMax.z) {
            particles[id.x].v.z = particles[id.x].v.z + wallStiffness * (sim.containMax.z - xn.z);
        }
        if (insideXZ && xn.y < sim.containMin.y) {
            particles[id.x].v.y = particles[id.x].v.y + wallStiffness * (sim.containMin.y - xn.y);
        }
        if (insideXZ && xn.y > sim.containMax.y) {
            particles[id.x].v.y = particles[id.x].v.y + wallStiffness * (sim.containMax.y - xn.y);
        }
        if (xn.y < sim.containMin.w) {
            particles[id.x].v.y = particles[id.x].v.y + wallStiffness * (sim.containMin.w - xn.y);
        }
    }
}
