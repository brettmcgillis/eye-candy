# // Trucheterie

[Back to main TODO](../../../../../../TODO.md)

# // Intent/Use Cases

- Generative Truchet-tile patterns rendered as multi-stroke "engraved contour"
  line art (many parallel offset strokes per arc, not flat fill), in the
  style of a set of reference images the user collected from artists they
  follow. Square and triangular tile grids, ambient retiling animation
  (tiles flip/scale to reveal a new arrangement), and composition controls
  (border, clip shape, fill mode, color) all reachable from one scene.

# // TODO:

- [ ] do a subdivide retile mode. ie sometimes a large tile will flip into a subdivision, other times a set of small tiles will flip as one into a big tile.

# // Presets

# // Features

# // Bugs

- zrotation in triangle mode doesnt work well.
- straight tiles in triangular mode done line up.

# // Examples

```JS
//Multiscale truchet
const splitProbability = .70; //min=0 max=1 step=.05
const startRes = 4; //min=0 max=5 step=1
const minRes = 1; //min=0 max=5 step=1
const bigTileSize = 80; //min=10 max=200 step=10

// You can find the Turtle API reference here: https://turtletoy.net/syntax
Canvas.setpenopacity(.8);

// Global code will be evaluated once.
const turtle = new Turtle();
const polygons = new Polygons();
turtle.radians();

let width = bigTileSize;
let height = width / Math.sqrt(.75);

let columns = Math.ceil(200 / width);
let rows = Math.ceil(200 / height);

const hOffset = ((columns / 2) * width);
const vOffset = (rows / 2) * height;

const trns = (a, b) => [a[0] - hOffset, a[1] - vOffset];

let triangles = [];

// The walk function will be called until it returns false.
function walk(i) {
    let column = i % columns;
    let row = (i / columns)|0;
    let pointingLeft = (row % 2 == 0) === (column % 2 == 0);

    if((row * height / 2) - vOffset -height < 100) {
        generateTriangle(triangles, trns([(pointingLeft? column: column + 1) * width, row * height / 2]), pointingLeft? -Math.PI / 6: 5* Math.PI / 6, height, startRes);
        triangles.sort((a,b) => Math.random()-.5);
        return true;
    }

    let t = triangles.pop();
    t.draw(turtle);
    return triangles.length > 0;
}

function generateTriangle(triangles, position, heading, height, generation) {
    if(generation <= minRes || Math.random() > Math.pow(splitProbability, 1 + (startRes - generation))) {
        triangles.push(new Triangle(position, heading, height, generation));
    } else {
        generateTriangle(triangles, position, heading, height / 2, generation - 1);

        turtle.up();
        turtle.jump(position);
        turtle.seth(heading);
        turtle.forward(height / 2);
        generateTriangle(triangles, turtle.pos(), heading, height / 2, generation - 1);

        turtle.jump(position);
        turtle.seth(heading + (Math.PI/3));
        turtle.forward(height / 2);
        generateTriangle(triangles, turtle.pos(), heading, height / 2, generation - 1);

        turtle.jump(position);
        turtle.seth(heading + (Math.PI/6));
        turtle.forward(height * Math.sqrt(.75));
        turtle.seth(heading + Math.PI);
        generateTriangle(triangles, turtle.pos(), heading + Math.PI, height / 2, generation - 1);
    }
}

// vec2 helper functions
const add = (a, b) => [a[0]+b[0], a[1]+b[1]];
const sub = (a, b) => [a[0]-b[0], a[1]-b[1]];
const scl = (a, b) => [a[0]*b, a[1]*b];

class Triangle {
    constructor(position, heading, height, generation) {
        this.position = position;
        this.heading = heading;
        this.height = height;
        this.generation = generation;

        this.lanes = Math.pow(2, this.generation + 1);
        this.primaryCircles = generation == 0? 1: Math.ceil(this.lanes * .75);
    }
    draw(turtle) {
        turtle.up();
        turtle.jump(this.position);
        turtle.seth(this.heading);
        let positions = [];
        for(let i = 0; i < 3; i++) {
            positions.push([turtle.pos(), (this.heading) + (i * 2 *  Math.PI / 3)]);
            turtle.forward(this.height);
            turtle.right(Math.PI/1.5);
        }
        turtle.down();

        positions.sort((a,b) => Math.random()-.5);

        let laneWidth = (this.height/this.lanes) / 2;

        let circles = [this.primaryCircles * 2, this.lanes, this.primaryCircles * 2];
        for(let k = 0; k < 3; k++) {
            let pos = positions[k];

            for(let i = 0; i <= circles[k]; i++) {
                let p = polygons.create();
                p.addPoints(pos[0]);
                this.addCirclePoints(p, pos[0], (i+.5) * laneWidth, pos[1], pos[1] + (Math.PI / 3), 0);
                if(i%2 == 1) {
                    p.addHatching(0, .15); //black
                } else {
                   // p.addHatching(0, 1); //white
                }
                polygons.draw(turtle, p);
            }
        }
    }
    addCirclePoints(p, position, r, s, e, rotation = 0) {
        const f = 40;
        for (let i=0; i<=f; i++) {
            p.addPoints(add([Math.cos(s+(e-s)*i/f)*r, Math.sin(s+(e-s)*i/f)*r], position));
        }
        return p;
    }
}

////////////////////////////////////////////////////////////////
// Polygon Clipping utility code - Created by Reinder Nijhoff 2019
// (Polygon binning by Lionel Lemarie 2021)
// https://turtletoy.net/turtle/a5befa1f8d
////////////////////////////////////////////////////////////////
function Polygons(){const t=[],s=25,e=Array.from({length:s**2},t=>[]),n=class{constructor(){this.cp=[],this.dp=[],this.aabb=[]}addPoints(...t){let s=1e5,e=-1e5,n=1e5,h=-1e5;(this.cp=[...this.cp,...t]).forEach(t=>{s=Math.min(s,t[0]),e=Math.max(e,t[0]),n=Math.min(n,t[1]),h=Math.max(h,t[1])}),this.aabb=[s,n,e,h]}addSegments(...t){t.forEach(t=>this.dp.push(t))}addOutline(){for(let t=0,s=this.cp.length;t<s;t++)this.dp.push(this.cp[t],this.cp[(t+1)%s])}draw(t){for(let s=0,e=this.dp.length;s<e;s+=2)t.jump(this.dp[s]),t.goto(this.dp[s+1])}addHatching(t,s){const e=new n;e.cp.push([-1e5,-1e5],[1e5,-1e5],[1e5,1e5],[-1e5,1e5]);const h=Math.sin(t)*s,o=Math.cos(t)*s,a=200*Math.sin(t),i=200*Math.cos(t);for(let t=.5;t<150/s;t++)e.dp.push([h*t+i,o*t-a],[h*t-i,o*t+a]),e.dp.push([-h*t+i,-o*t-a],[-h*t-i,-o*t+a]);e.boolean(this,!1),this.dp=[...this.dp,...e.dp]}inside(t){let s=0;for(let e=0,n=this.cp.length;e<n;e++)this.segment_intersect(t,[.1,-1e3],this.cp[e],this.cp[(e+1)%n])&&s++;return 1&s}boolean(t,s=!0){const e=[];for(let n=0,h=this.dp.length;n<h;n+=2){const h=this.dp[n],o=this.dp[n+1],a=[];for(let s=0,e=t.cp.length;s<e;s++){const n=this.segment_intersect(h,o,t.cp[s],t.cp[(s+1)%e]);!1!==n&&a.push(n)}if(0===a.length)s===!t.inside(h)&&e.push(h,o);else{a.push(h,o);const n=o[0]-h[0],i=o[1]-h[1];a.sort((t,s)=>(t[0]-h[0])*n+(t[1]-h[1])*i-(s[0]-h[0])*n-(s[1]-h[1])*i);for(let n=0;n<a.length-1;n++)(a[n][0]-a[n+1][0])**2+(a[n][1]-a[n+1][1])**2>=.001&&s===!t.inside([(a[n][0]+a[n+1][0])/2,(a[n][1]+a[n+1][1])/2])&&e.push(a[n],a[n+1])}}return(this.dp=e).length>0}segment_intersect(t,s,e,n){const h=(n[1]-e[1])*(s[0]-t[0])-(n[0]-e[0])*(s[1]-t[1]);if(0===h)return!1;const o=((n[0]-e[0])*(t[1]-e[1])-(n[1]-e[1])*(t[0]-e[0]))/h,a=((s[0]-t[0])*(t[1]-e[1])-(s[1]-t[1])*(t[0]-e[0]))/h;return o>=0&&o<=1&&a>=0&&a<=1&&[t[0]+o*(s[0]-t[0]),t[1]+o*(s[1]-t[1])]}};return{list:()=>t,create:()=>new n,draw:(n,h,o=!0)=>{reducedPolygonList=function(n){const h={},o=200/s;for(var a=0;a<s;a++){const c=a*o-100,r=[0,c,200,c+o];if(!(n[3]<r[1]||n[1]>r[3]))for(var i=0;i<s;i++){const c=i*o-100;r[0]=c,r[2]=c+o,n[0]>r[2]||n[2]<r[0]||e[i+a*s].forEach(s=>{const e=t[s];n[3]<e.aabb[1]||n[1]>e.aabb[3]||n[0]>e.aabb[2]||n[2]<e.aabb[0]||(h[s]=1)})}}return Array.from(Object.keys(h),s=>t[s])}(h.aabb);for(let t=0;t<reducedPolygonList.length&&h.boolean(reducedPolygonList[t]);t++);h.draw(n),o&&function(n){t.push(n);const h=t.length-1,o=200/s;e.forEach((t,e)=>{const a=e%s*o-100,i=(e/s|0)*o-100,c=[a,i,a+o,i+o];c[3]<n.aabb[1]||c[1]>n.aabb[3]||c[0]>n.aabb[2]||c[2]<n.aabb[0]||t.push(h)})}(h)}}}
```

IRREGULAR / BLOB FIELD EXAMPLE

```JS
const seed = 'Change me, empty seed means random every run'; //type=string
const gridSize = 25; //min=10 max=50 step=1
const pathsPerUnit = 6; //min=1 max=20 step=1
const sizeFunction = '1+(gridSize/9)*Math.random()'; //type=string
const distributionCount = .1; //min=0 max=1 step=.01
const connectivity = .95; //min=0 max=1 step=.01
const oneFill = .25; //min=0 max=1 step=.01
const holes = 0; //min=0 max=1 step=.01
const meatballs = 2; //min=0 max=2 step=1 (Not if not connected, I'm a veggie!, Yes please)
const debug = 0; //min=0 max=3 step=1 (None, Cells, Connections, Both)

// You can find the Turtle API reference here: https://turtletoy.net/syntax
Canvas.setpenopacity(1);

// Global code will be evaluated once.
turtlelib_init();
const turtle = new Turtle();
const polygons = new Polygons();
seed == ''? R.seedRandom(): R.seed(seed);

const config = {
    gridSize: gridSize,
    canvasSize: 190,
    cellSize: 190 / gridSize,
    pathDiv: pathsPerUnit,
    fill: oneFill,
    attempts: 100,
    allowSatelites: meatballs,
    sizeDistribution: fn(sizeFunction),
    distributionCount: distributionCount,
    connectivity: connectivity,
    debugCells: (debug & 1) == 1,
    debugMicroConnectors: (debug & 2) == 2,
    destruction: holes / 10
};

const grid = new Grid(config.gridSize);

const popCount = (config.distributionCount * config.gridSize**2) | 0;
grid.populate(popCount, (cellCount) => config.sizeDistribution.solve({gridSize: config.gridSize, cellCount: cellCount})|0);

const openCells = grid.grid.flatMap((row, c) => row.map((v, r) => [c, r, v]))
    .filter(e => e[2] == 0)
    .map(e => [e[0], e[1], (e[0] - grid.mid)**2+(e[1] - grid.mid)**2])
    .sort((a,b) => a[2] < b[2]?-1:1);

for(let i = 0; i < Math.max(popCount == 0? 1: 0, config.fill * openCells.length); i++) {
    grid.cells.push(new Cell(grid, openCells[i][0]-grid.mid, openCells[i][1]-grid.mid, 1));
    grid.grid[openCells[i][0]][openCells[i][1]] = grid.cells.length;
}
grid.destroyGrid(grid.cells.length * config.destruction | 0);
grid.checkNeighborConnections();
grid.destroyConnections(1-config.connectivity);

grid.checkNeighborConnections();
if(config.allowSatelites == 1) {
    grid.destroySatelites();
}

grid.cells.forEach(e => {e.column += grid.mid;e.row+=grid.mid})
grid.cells.sort((a, b) => a.row == b.row? (a.column < b.column? -1: 1): (a.row < b.row)? -1: 1);

//console.log('\n'+grid.grid[0].map((c, i) => grid.grid.map(r => r[i])).map((column, c) => column.map(v => (new Intl.NumberFormat('en-US', {minimumIntegerDigits: (''+grid.cells.reduce((a, c) => a < c.id? c.id: a, 0)).length, minimumFractionDigits: 0})).format(v)).join(',')).join('\n'));

// The walk function will be called until it returns false.
function walk(i) {
    grid.cells[i].draw(polygons, turtle);
    return i < grid.cells.length - 1;
}

function Grid(size) {
    class Grid {
        constructor(size) {
            this.size = size;
            this.grid = Array.from({length: config.gridSize}, (e,c) => Array.from({length: config.gridSize}, (e,r) => 0));
            this.cells = [];
        }
        get mid() {
            return this.size / 2 | 0;
        }
        populate(n, sizeFn = () => Math.random()**3 * 3 + 1 | 0) {
            function getCoordinatesFromOriginInDirectionToBoundary(direction, boundary) {
                const r = Math.SQRT2 * (boundary+1);
                const dx = r * Math.cos(direction);
                const dy = r * Math.sin(direction);
                const dMax = Math.max(Math.abs(dx), Math.abs(dy));
                const dxs = dx / dMax;
                const dys = dy / dMax;

                const pts = [];
                for(let i = 0; i <= dMax; i++) {
                    const pt = [
                        Math.round(i * dxs),
                        Math.round(i * dys)
                    ];
                    if(pt[0] < -boundary || boundary < pt[0] || pt[1] < -boundary || boundary < pt[1]) break;
                    pts.push(pt);
                }
                return pts;
            }

            function getRelativeCoordinatesFromOriginInDirectionToBoundary(direction, boundary) {
                const t = getCoordinatesFromOriginInDirectionToBoundary(direction, boundary);
                return Array.from({length: t.length - 1}).map((e, i) => [t[i+1][0] - t[i][0], t[i+1][1] - t[i][1]]);
            }

            for(let i = 0, attempt = 0; i < n && attempt < config.attempts; i++, attempt++) {
                const size = sizeFn(this.cells.length);
                const cell = new Cell(this, -(size / 2 | 0), -(size / 2 | 0), size);

                const moves = getRelativeCoordinatesFromOriginInDirectionToBoundary(Math.random() * 2 * Math.PI, config.gridSize / 2 | 0);

                let available = this.cellAvailability(cell);
                while(!available && moves.length > 0) {
                    let move = moves.shift();
                    cell.column += move[0];
                    cell.row += move[1];
                    available = this.cellAvailability(cell);
                }

                if(!available) {
                    i--;
                    continue;
                }

                if(this.mid+cell.column < 0 || config.gridSize - cell.size < this.mid+cell.column ||
                   this.mid+cell.row < 0 || config.gridSize - cell.size < this.mid+cell.row) {
                    i--;
                    continue;
                }

                attempt = 0;

                this.cells.push(cell);

                for(let c = 0; c < cell.size; c++) {
                    for(let r = 0; r < cell.size; r++) {
                        const checkCol = this.mid+c+cell.column;
                        const checkRow = this.mid+r+cell.row;
                        this.grid[checkCol][checkRow] = this.cells.length;
                    }
                }
            }
        }
        getMicroCellAvailability(checkCol, checkRow) {
            if (checkCol < 0 || config.gridSize <= checkCol ||
                checkRow < 0 || config.gridSize <= checkRow) {
                    return false;
            }

            return this.grid[checkCol][checkRow];
        }
        cellAvailability(cell) {
            for(let c = 0; c < cell.size; c++) {
                for(let r = 0; r < cell.size; r++) {
                    const checkCol = this.mid+c+cell.column;
                    const checkRow = this.mid+r+cell.row;
                    const av = this.getMicroCellAvailability(checkCol, checkRow);
                    if(av === false || av > 0) {
                        return false;
                    }
                }
            }
            return true;
        }
        destroyGrid(n) {
            for(let i = 0, attempt = 0; i < n && this.cells.length > 0 && attempt < config.attempts; i++, attempt++) {
                const col = (config.gridSize * Math.random() | 0);
                const row = (config.gridSize * Math.random() | 0);

                const cellId = this.grid[col][row];
                if(cellId == 0 || (attempt < config.attemps / 2 && this.cells[cellId - 1].size > 1)) {
                    i--;
                    continue;
                }
                attempt = 0;
                this.cells[cellId - 1].destroy();
            }
        }
        checkNeighborConnections() {
            const type = {COL: 1, ROW: 2};

            this.cells.forEach(cell => {
                //check if there's a cell adjacent to this cell's side.
                [
                    [type.COL, -1],
                    [type.ROW, cell.size],
                    [type.COL, cell.size],
                    [type.ROW, -1]
                ].forEach((e, i) => {
                    for(let j = 0; j < cell.size; j++) {
                        const checkCol = this.mid+(e[0] == type.COL? j: 0) + cell.column + (e[0] == type.COL? 0: e[1]);
                        const checkRow = this.mid+(e[0] == type.ROW? j: 0) + cell.row    + (e[0] == type.ROW? 0: e[1]);
                        if(!this.getMicroCellAvailability(checkCol, checkRow)) {
                            cell.connectors[i] = false;
                        }
                    }
                });
            });

            let changed = true;
            while(changed) {
                changed = false;
                this.cells.forEach(cell => {
                    const neighbors = [
                        [type.COL, -1],
                        [type.ROW, cell.size],
                        [type.COL, cell.size],
                        [type.ROW, -1]
                    ];
                    //check if the cell's adjacent side to this cell has an active connector
                    for(let c = 0; c < cell.connectors.length; c++) {
                        if(!cell.connectors[c]) continue;

                        for(let j = 0; j < cell.size; j++) {
                            const checkCol = this.mid+(neighbors[c][0] == type.COL? j: 0) + cell.column + (neighbors[c][0] == type.COL? 0: neighbors[c][1]);
                            const checkRow = this.mid+(neighbors[c][0] == type.ROW? j: 0) + cell.row    + (neighbors[c][0] == type.ROW? 0: neighbors[c][1]);
                            const otherCellId = this.getMicroCellAvailability(checkCol, checkRow);
                            if(!this.cells[otherCellId - 1].connectors[(c+2)%4]) {
                                cell.connectors[c] = false;
                                changed = true;
                            }
                        }
                    }
                });
            }
        }
        destroyConnections(percentage) {
            const getConnectors = () => this.cells.flatMap(c => c.connectors.map((e, i) => [i, e]).filter(e => e[1]).map(e => [c.id, e[0]]));

            const originalConnectors = getConnectors();
            const n = originalConnectors.length * percentage;
            let connectors = originalConnectors.map(e => [...e]);
            while(originalConnectors.length - connectors.length < n) {
                const pick = Math.random() * connectors.length | 0;
                this.cells[connectors[pick][0] - 1].connectors[connectors[pick][1]] = false;
                this.checkNeighborConnections();
                connectors = getConnectors();
            }
        }
        destroySatelites() {
            const type = {COL: 1, ROW: 2};

            //this.cells.filter(c => c.activeConnectorCount == 0).forEach(c => c.destroy());
            const connected = [this.cells.find(c => c.activeConnectorCount).id];
            for(let i = 0; i < connected.length; i++) {
                const cell = this.cells[connected[i] - 1];


                //if not the first cell and this cell has two active connectors
                if(i > 0 && cell.connectors.reduce((a,c) => a + (c?1:0), 0) == 2) {
                    //and the two connectors are on opposite sides
                    if (cell.connectors.map((e, i) => [i, e]).filter(e => e[1]).reduce((a, c) => a + c[0], 0) % 2 == 0) {
                        //then skip seeking for this cell
                        continue;
                    }
                }

                const neighbors = [
                    [type.COL, -1],
                    [type.ROW, cell.size],
                    [type.COL, cell.size],
                    [type.ROW, -1]
                ];
                //check if the cell's adjacent side to this cell has an active connector
                for(let c = 0; c < cell.connectors.length; c++) {
                    if(!cell.connectors[c]) continue;

                    for(let j = 0; j < cell.size; j++) {
                        const checkCol = this.mid+(neighbors[c][0] == type.COL? j: 0) + cell.column + (neighbors[c][0] == type.COL? 0: neighbors[c][1]);
                        const checkRow = this.mid+(neighbors[c][0] == type.ROW? j: 0) + cell.row    + (neighbors[c][0] == type.ROW? 0: neighbors[c][1]);
                        const otherCellId = this.getMicroCellAvailability(checkCol, checkRow);
                        if(this.cells[otherCellId - 1].connectors[(c+2)%4]) {
                            if(!connected.some(c => c == otherCellId)) {
                                connected.push(otherCellId);
                            }
                        }
                    }
                }
            }

            this.cells.filter(c => !connected.includes(c.id)).forEach(c => c.destroy());
            this.checkNeighborConnections();
        }
    }
    return new Grid(size);
}

function Cell(grid, column, row, size) {
    class Cell {
        constructor(grid, column, row, size) {
            this.id = grid.cells.length + 1;
            this.grid = grid;
            this.column = column;
            this.row = row;
            this.size = size;
            this.connectors = [true, true, true, true]; //top, right, bottom, left
            this.destroyed = false;
        }
        get activeConnectorCount() {
            return this.connectors.reduce((a, c) => a+(c?1:0), 0);
        }
        destroy() {
            this.destroyed = true;
            this.connectors = [false, false, false, false];
        }
        getConnections() {
            //[[type, startEdge], ...]
            switch(this.connectors.filter(e => e).length) {
                case 0:
                    return [[0, 0]];
                case 1:
                    return [[1, this.connectors.map((e, i) => [i, e]).filter(e => e[1])[0][0]]];
                case 2:
                    const adjacent = this.connectors.map((e, i, a) => [i, e && a[(i+3)%a.length]]).filter(e => e[1]);
                    if(adjacent.length == 1) {
                        return [[2, adjacent[0][0]]];
                    }
                    return this.connectors.map((e, i) => [i, e]).filter(e => e[1]).map(e => [1, e[0]]);
                case 3:
                    const twoPossibilities = this.connectors.map((e, i, a) => [i, e && a[(i+3)%a.length]]).filter(e => e[1]).map(e => [2, e[0]]);

                    return twoPossibilities;
                    //or 1 2-connections and 1 1-connection
                case 4:
                    return Math.random() < .5? [[2, 0], [2, 2]]: [[2, 1], [2, 3]];
                default:
                    throw new Error('How... is... this... possible?!?!?!?!');
            }
        }
        draw(polygons, turtle) {
            if(this.destroyed) return;
            if(config.allowSatelites == 0 && !this.connectors.some(e => e)) return;

            const cellOffset = [-config.canvasSize/2, -config.canvasSize/2];

            const s = Math.max(this.size, 1);
            const ref = [[0, 0], [s, 0], [s, s], [0, s]];
            const cr = ref.map(e => V.scale(V.add(e, [this.column, this.row]), config.cellSize));
            const corners = cr.map(e => V.add(e, cellOffset));
            const cellCenter = corners.reduce((a, c) => V.add(a, V.scale(c, 1/corners.length)), [0, 0]);

            if(config.debugMicroConnectors) {
                (() => {
                    let microConnectors = [[corners[0][0] + (config.cellSize/2), corners[0][1] + (config.cellSize/7)]].map(pt => V.add(pt, V.scale(cellCenter, -1)));
                    for(let i = 1; i < this.size; i++) {
                        microConnectors.push(V.add(microConnectors[microConnectors.length - 1], [config.cellSize, 0]));
                    }

                    const rot90 = V.rot2d(-Math.PI/2);

                    for(let i = 0; i < this.connectors.length; i++) {
                        if(this.connectors[i]) {
                            microConnectors.forEach(pt => PT.drawPoint(turtle, V.add(pt, cellCenter), config.cellSize / 20));
                        }
                        microConnectors = microConnectors.map(e => V.trans(rot90, e));
                    }
                })();
            }
            const connections = this.getConnections();
            connections.sort((a, b) => Math.random() < .5? -1: 1);
            let single = false;
            connections.forEach(c => {
                const arcs = [];
                const odd = ((config.pathDiv * this.size) & 1) == 1? .5: 0;
                switch(c[0]) {
                    case 0:
                        single = true;
                    case 1:
                        for(let i = 0, max = this.size * config.pathDiv / 2 | 0; i <= max; i++) {
                            const r = config.cellSize * ((i+odd) / config.pathDiv);
                            arcs.push(
                                PT.arc(r, (single?2:1)*Math.PI, 0, Math.max(12, ((single?4:2)*Math.PI*r|0)+1), true)
                                  .map(pt => V.add(pt, [0, single?0: -this.size*config.cellSize/2]))
                            );
                        }
                        break;
                    case 2:
                        for(let i = 1, max = this.size * config.pathDiv; i <= max; i++) {
                            const rr = config.cellSize * i / config.pathDiv;
                            arcs.push(
                                PT.arc(rr, Math.PI / 2, 0, Math.max(12, (2*Math.PI*rr|0)+1), true)
                                  .map(pt => V.add(pt, V.scale([config.cellSize, config.cellSize], -this.size/2)))
                            );
                        }
                }

                const rot = V.rot2d( c[1] * -Math.PI/2);
                arcs.forEach(arc => {
                    const p = polygons.create();
                    const pts = (single? [...arc]: [V.scale([config.cellSize, config.cellSize], -this.size/2), ...arc])
                        .map(pt => V.trans(rot, pt))
                        .map(pt => V.add(pt, cellCenter));
                    p.addPoints(...pts);
                    if(single) {
                        p.addOutline();
                    } else {
                        pts.map((e, i, a) => [e, a[(i+1)%a.length]])
                           .filter((e,i, a) => i > 0 && i < a.length - 1)
                           .forEach(seg => p.addSegments(...seg));
                    }
                    polygons.draw(turtle, p);
                });
            });

            if(config.debugCells) {
                (() => {
                    const p = polygons.create();
                    p.addPoints(...corners);
                    PT.drawTour(turtle, corners);
                    p.addHatching(1, 5);
                    p.addHatching(-1, 5);
                    polygons.draw(turtle, p);
                })();
            }
        }
    }
    return new Cell(grid, column, row, size);
}

// Below is automatically maintained by Turtlelib 1.0
// Changes below this comment might interfere with its correct functioning.
function turtlelib_init() {
	turtlelib_ns_80dcba45dd_Jurgen_Polygons();
	turtlelib_ns_c6665b0e9b_Jurgen_Vector_Math();
	turtlelib_ns_c5f8fa95ed_Jurgen_Intersection();
	turtlelib_ns_13b81fd40e_Jurgen_Randomness();
	turtlelib_ns_2d89bd6d64_Jurgen_Path_tools();
	turtlelib_ns_ed7b692d39_Jurgen_Formula();
}
// Turtlelib Jurgen Polygons v 1 - start - {"id":"80dcba45dd","package":"Jurgen","name":"Polygons","version":"1"}
function turtlelib_ns_80dcba45dd_Jurgen_Polygons() {
////////////////////////////////////////////////////////////////
// Polygon Clipping utility code - Created by Reinder Nijhoff 2019
// (Polygon binning by Lionel Lemarie 2021) https://turtletoy.net/turtle/95f33bd383
// (Delegated Hatching by Jurgen Westerhof 2024) https://turtletoy.net/turtle/d068ad6040
// (Deferred Polygon Drawing by Jurgen Westerhof 2024) https://turtletoy.net/turtle/6f3d2bc0b5
// https://turtletoy.net/turtle/a5befa1f8d
//
// const polygons = new Polygons();
// const p = polygons.create();
// polygons.draw(turtle, p);
// polygons.list();
// polygons.startDeferSession();
// polygons.stopDeferring();
// polygons.finalizeDeferSession(turtle);
//
// p.addPoints(...[[x,y],]);
// p.addSegments(...[[x,y],]);
// p.addOutline();
// p.addHatching(angle, distance); OR p.addHatching(HatchObject); where HatchObject has a method 'hatch(PolygonClass, thisPolygonInstance)'
// p.inside([x,y]);
// p.boolean(polygon, diff = true);
// p.segment_intersect([x,y], [x,y], [x,y], [x,y]);
////////////////////////////////////////////////////////////////
function Polygons(){const t=[],s=25,e=Array.from({length:s**2},t=>[]),n=class{constructor(){this.cp=[],this.dp=[],this.aabb=[]}addPoints(...t){let s=1e5,e=-1e5,n=1e5,h=-1e5;(this.cp=[...this.cp,...t]).forEach(t=>{s=Math.min(s,t[0]),e=Math.max(e,t[0]),n=Math.min(n,t[1]),h=Math.max(h,t[1])}),this.aabb=[s,n,e,h]}addSegments(...t){t.forEach(t=>this.dp.push(t))}addOutline(){for(let t=0,s=this.cp.length;t<s;t++)this.dp.push(this.cp[t],this.cp[(t+1)%s])}draw(t){for(let s=0,e=this.dp.length;s<e;s+=2)t.jump(this.dp[s]),t.goto(this.dp[s+1])}addHatching(t, s) {if(typeof t == 'object') return t.hatch(n, this);const e=new n;e.cp.push([-1e5,-1e5],[1e5,-1e5],[1e5,1e5],[-1e5,1e5]);const h=Math.sin(t)*s,o=Math.cos(t)*s,a=200*Math.sin(t),i=200*Math.cos(t);for(let t=.5;t<150/s;t++) {e.dp.push([h*t+i,o*t-a],[h*t-i,o*t+a]);e.dp.push([-h*t+i,-o*t-a],[-h*t-i,-o*t+a]);}e.boolean(this,!1);this.dp=[...this.dp,...e.dp]}inside(t){let s=0;for(let e=0,n=this.cp.length;e<n;e++)this.segment_intersect(t,[.1,-1e3],this.cp[e],this.cp[(e+1)%n])&&s++;return 1&s}boolean(t,s=!0){const e=[];for(let n=0,h=this.dp.length;n<h;n+=2){const h=this.dp[n],o=this.dp[n+1],a=[];for(let s=0,e=t.cp.length;s<e;s++){const n=this.segment_intersect(h,o,t.cp[s],t.cp[(s+1)%e]);!1!==n&&a.push(n)}if(0===a.length)s===!t.inside(h)&&e.push(h,o);else{a.push(h,o);const n=o[0]-h[0],i=o[1]-h[1];a.sort((t,s)=>(t[0]-h[0])*n+(t[1]-h[1])*i-(s[0]-h[0])*n-(s[1]-h[1])*i);for(let n=0;n<a.length-1;n++)(a[n][0]-a[n+1][0])**2+(a[n][1]-a[n+1][1])**2>=.001&&s===!t.inside([(a[n][0]+a[n+1][0])/2,(a[n][1]+a[n+1][1])/2])&&e.push(a[n],a[n+1])}}return(this.dp=e).length>0}segment_intersect(t,s,e,n){const h=(n[1]-e[1])*(s[0]-t[0])-(n[0]-e[0])*(s[1]-t[1]);if(0===h)return!1;const o=((n[0]-e[0])*(t[1]-e[1])-(n[1]-e[1])*(t[0]-e[0]))/h,a=((s[0]-t[0])*(t[1]-e[1])-(s[1]-t[1])*(t[0]-e[0]))/h;return o>=0&&o<=1&&a>=0&&a<=1&&[t[0]+o*(s[0]-t[0]),t[1]+o*(s[1]-t[1])]}};const y=function(n,j=[]){const h={},o=200/s;for(var a=0;a<s;a++){const c=a*o-100,r=[0,c,200,c+o];if(!(n[3]<r[1]||n[1]>r[3]))for(var i=0;i<s;i++){const c=i*o-100;r[0]=c,r[2]=c+o,n[0]>r[2]||n[2]<r[0]||e[i+a*s].forEach(s=>{const e=t[s];n[3]<e.aabb[1]||n[1]>e.aabb[3]||n[0]>e.aabb[2]||n[2]<e.aabb[0]||j.includes(s)||(h[s]=1)})}}return Array.from(Object.keys(h),s=>t[s])};return{list:()=>t,create:()=>new n,draw:(n,h,o=!0)=>{rpl=y(h.aabb, this.dei === undefined? []: Array.from({length: t.length - this.dei}).map((e, i) => this.dsi + i));for(let t=0;t<rpl.length&&h.boolean(rpl[t]);t++);const td=n.isdown();if(this.dsi!==undefined&&this.dei===undefined)n.pu();h.draw(n),o&&function(n){t.push(n);const h=t.length-1,o=200/s;e.forEach((t,e)=>{const a=e%s*o-100,i=(e/s|0)*o-100,c=[a,i,a+o,i+o];c[3]<n.aabb[1]||c[1]>n.aabb[3]||c[0]>n.aabb[2]||c[2]<n.aabb[0]||t.push(h)})}(h);if(td)n.pd();},startDeferSession:()=>{if(this.dei!==undefined)throw new Error('Finalize deferring before starting new session');this.dsi=t.length;},stopDeferring:()=>{if(this.dsi === undefined)throw new Error('Start deferring before stopping');this.dei=t.length;},finalizeDeferSession:(n)=>{if(this.dei===undefined)throw new Error('Stop deferring before finalizing');for(let i=this.dsi;i<this.dei;i++) {rpl = y(t[i].aabb,Array.from({length:this.dei-this.dsi+1}).map((e,j)=>i+j));for(let j=0;j<rpl.length&&t[i].boolean(rpl[j]);j++);t[i].draw(n);}this.dsi=undefined;this.dei=undefined;}}}
this.Polygons = Polygons;
}
// Turtlelib Jurgen Polygons v 1 - end
// Turtlelib Jurgen Vector Math v 4 - start - {"id":"c6665b0e9b","package":"Jurgen","name":"Vector Math","version":"4"}
function turtlelib_ns_c6665b0e9b_Jurgen_Vector_Math() {
/////////////////////////////////////////////////////////
// Vector functions - Created by Jurgen Westerhof 2024 //
/////////////////////////////////////////////////////////
class Vector {
    static add  (a,b) { return a.map((v,i)=>v+b[i]); }
    static sub  (a,b) { return a.map((v,i)=>v-b[i]); }
    static mul  (a,b) { return a.map((v,i)=>v*b[i]); }
    static div  (a,b) { return a.map((v,i)=>v/b[i]); }
    static scale(a,s) { return a.map(v=>v*s); }

    static det(m)                { return m.length == 1? m[0][0]: m.length == 2 ? m[0][0]*m[1][1]-m[0][1]*m[1][0]: m[0].reduce((r,e,i) => r+(-1)**(i+2)*e*this.det(m.slice(1).map(c => c.filter((_,j) => i != j))),0); }
    static angle(a)              { return Math.PI - Math.atan2(a[1], -a[0]); } //compatible with turtletoy heading
    static rot2d(angle)          { return [[Math.cos(angle), -Math.sin(angle)], [Math.sin(angle), Math.cos(angle)]]; }
    static rot3d(yaw,pitch,roll) { return [[Math.cos(yaw)*Math.cos(pitch), Math.cos(yaw)*Math.sin(pitch)*Math.sin(roll)-Math.sin(yaw)*Math.cos(roll), Math.cos(yaw)*Math.sin(pitch)*Math.cos(roll)+Math.sin(yaw)*Math.sin(roll)],[Math.sin(yaw)*Math.cos(pitch), Math.sin(yaw)*Math.sin(pitch)*Math.sin(roll)+Math.cos(yaw)*Math.cos(roll), Math.sin(yaw)*Math.sin(pitch)*Math.cos(roll)-Math.cos(yaw)*Math.sin(roll)],[-Math.sin(pitch), Math.cos(pitch)*Math.sin(roll), Math.cos(pitch)*Math.cos(roll)]]; }
    static trans(matrix,a)       { return a.map((v,i) => a.reduce((acc, cur, ci) => acc + cur * matrix[ci][i], 0)); }
    //Mirror vector a in a ray through [0,0] with direction mirror
    static mirror2d(a,mirror)    { return [Math.atan2(...mirror)].map(angle => this.trans(this.rot2d(angle), this.mul([-1,1], this.trans(this.rot2d(-angle), a)))).pop(); }

    static equals(a,b)   { return !a.some((e, i) => e != b[i]); }
    static approx(a,b,p) { return this.len(this.sub(a,b)) < (p === undefined? .001: p); }
    static norm  (a)     { return this.scale(a,1/this.len(a)); }
    static len   (a)     { return Math.hypot(...a); }
    static lenSq (a)     { return a.reduce((a,c)=>a+c**2,0); }
    static lerp  (a,b,t) { return a.map((v, i) => v*(1-t) + b[i]*t); }
    static dist  (a,b)   { return Math.hypot(...this.sub(a,b)); }

    static dot  (a,b)   { return a.reduce((a,c,i) => a+c*b[i], 0); }
    static cross(...ab) { return ab[0].map((e, i) => ab.map(v => v.filter((ee, ii) => ii != i))).map((m,i) => (i%2==0?-1:1)*this.det(m)); }

    static clamp(a,min,max) { return a.map((e,i) => Math.min(Math.max(e, min[i]), max[i])) };
    static rotateClamp(a,min,max) { return a.map((e,i) => {const d = max[i]-min[i];if(d == 0) return min[i];while(e < min[i]) { e+=d; }while(e > max[i]) { e-=d; }return e;});
    }
}
this.V = Vector;
}
// Turtlelib Jurgen Vector Math v 4 - end
// Turtlelib Jurgen Intersection v 4 - start - {"id":"c5f8fa95ed","package":"Jurgen","name":"Intersection","version":"4"}
function turtlelib_ns_c5f8fa95ed_Jurgen_Intersection() {
///////////////////////////////////////////////////////////////
// Intersection functions - Created by Jurgen Westerhof 2024 //
///////////////////////////////////////////////////////////////
class Intersection {
    //a-start, a-direction, b-start, b-direction
    //returns false on no intersection or [[intersection:x,y], scalar a-direction, scalar b-direction
    static info(as, ad, bs, bd) { const d = V.sub(bs, as), det = -V.det([bd, ad]); if(det === 0) return false; const res = [V.det([d, bd]) / det, V.det([d, ad]) / det]; return [V.add(as, V.scale(ad, res[0])), ...res]; }
    static ray(a, b, c, d) { return this.info(a, b, c, d); }
    static segment(a,b,c,d, inclusiveStart = true, inclusiveEnd = true) { const i = this.info(a, V.sub(b, a), c, V.sub(d, c)); return i === false? false: ( (inclusiveStart? 0<=i[1] && 0<=i[2]: 0<i[1] && 0<i[2]) && (inclusiveEnd?   i[1]<=1 && i[2]<=1: i[1]<1 && i[2]<1) )?i[0]:false;}
    static tour(tour, segmentStart, segmentDirection) { return tour.map((e, i, a) => [i, this.info(e, V.sub(a[(i+1)%a.length], e), segmentStart, segmentDirection)]).filter(e => e[1] !== false && 0 <= e[1][1] && e[1][1] <= 1).filter(e => 0 <= e[1][2]).map(e => ({position: e[1][0],tourIndex: e[0],tourSegmentPortion: e[1][1],segmentPortion: e[1][2],}));}
    static inside(tour, pt) { return tour.map((e,i,a) => this.segment(e, a[(i+1)%a.length], pt, [Number.MAX_SAFE_INTEGER, 0], true, false)).filter(e => e !== false).length % 2 == 1; }
    static circles(centerA, radiusA, centerB, radiusB) {const result = {intersect_count: 0,intersect_occurs: true,one_is_in_other: false,are_equal: false,point_1: [null, null],point_2: [null, null],};const dx = centerB[0] - centerA[0];const dy = centerB[1] - centerA[1];const dist = Math.hypot(dy, dx);if (dist > radiusA + radiusB) {result.intersect_occurs = false;}if (dist < Math.abs(radiusA - radiusB) && !N.approx(dist, Math.abs(radiusA - radiusB))) {result.intersect_occurs = false;result.one_is_in_other = true;}if (V.approx(centerA, centerB) && radiusA === radiusB) {result.are_equal = true;}if (result.intersect_occurs) {const centroid = (radiusA**2 - radiusB**2 + dist * dist) / (2.0 * dist);const x2 = centerA[0] + (dx * centroid) / dist;const y2 = centerA[1] + (dy * centroid) / dist;const prec = 10000;const h = (Math.round(radiusA**2 * prec)/prec - Math.round(centroid**2 * prec)/prec)**.5;const rx = -dy * (h / dist);const ry = dx * (h / dist);result.point_1 = [x2 + rx, y2 + ry];result.point_2 = [x2 - rx, y2 - ry];if (result.are_equal) {result.intersect_count = Infinity;} else if (V.equals(result.point_1, result.point_2)) {result.intersect_count = 1;} else {result.intersect_count = 2;}}return result;}
}
this.Intersection = Intersection;
}
// Turtlelib Jurgen Intersection v 4 - end
// Turtlelib Jurgen Randomness v 2 - start - {"id":"13b81fd40e","package":"Jurgen","name":"Randomness","version":"2"}
function turtlelib_ns_13b81fd40e_Jurgen_Randomness() {
///////////////////////////////////////////////////////////////
// Pseudorandom functions - Created by Jurgen Westerhof 2024 //
///////////////////////////////////////////////////////////////
class Random {
    static #apply(seed) {
        // Seedable random number generator by David Bau: http://davidbau.com/archives/2010/01/30/random_seeds_coded_hints_and_quintillions.html
        !function(a,b,c,d,e,f,g,h,i){function j(a){var b,c=a.length,e=this,f=0,g=e.i=e.j=0,h=e.S=[];for(c||(a=[c++]);d>f;)h[f]=f++;for(f=0;d>f;f++)h[f]=h[g=s&g+a[f%c]+(b=h[f])],h[g]=b;(e.g=function(a){for(var b,c=0,f=e.i,g=e.j,h=e.S;a--;)b=h[f=s&f+1],c=c*d+h[s&(h[f]=h[g=s&g+b])+(h[g]=b)];return e.i=f,e.j=g,c})(d)}function k(a,b){var c,d=[],e=typeof a;if(b&&"object"==e)for(c in a)try{d.push(k(a[c],b-1))}catch(f){}return d.length?d:"string"==e?a:a+"\0"}function l(a,b){for(var c,d=a+"",e=0;e<d.length;)b[s&e]=s&(c^=19*b[s&e])+d.charCodeAt(e++);return n(b)}function m(c){try{return o?n(o.randomBytes(d)):(a.crypto.getRandomValues(c=new Uint8Array(d)),n(c))}catch(e){return[+new Date,a,(c=a.navigator)&&c.plugins,a.screen,n(b)]}}function n(a){return String.fromCharCode.apply(0,a)}var o,p=c.pow(d,e),q=c.pow(2,f),r=2*q,s=d-1,t=c["seed"+i]=function(a,f,g){var h=[];f=1==f?{entropy:!0}:f||{};var o=l(k(f.entropy?[a,n(b)]:null==a?m():a,3),h),s=new j(h);return l(n(s.S),b),(f.pass||g||function(a,b,d){return d?(c[i]=a,b):a})(function(){for(var a=s.g(e),b=p,c=0;q>a;)a=(a+c)*d,b*=d,c=s.g(1);for(;a>=r;)a/=2,b/=2,c>>>=1;return(a+c)/b},o,"global"in f?f.global:this==c)};if(l(c[i](),b),g&&g.exports){g.exports=t;try{o=require("crypto")}catch(u){}}else h&&h.amd&&h(function(){return t})}(this,[],Math,256,6,52,"object"==typeof module&&module,"function"==typeof define&&define,"random");
        Math.seedrandom(seed);
    }
    static seedRandom() { this.#apply(new Date().getMilliseconds()); }
    static seedDaily() { this.#apply(new Date().toDateString()); }
    static seed(seed) { this.#apply(seed); }
    static getInt(min, max) { if(max == undefined) {max = min + 1; min = 0; } const [mi, ma] = [Math.min(min, max), Math.max(min, max)]; return (mi + Math.random() * (ma - mi)) | 0;}
    static get(min, max) {if(min == undefined) {return Math.random();}if(max == undefined) {max = min;min = 0;}const [mi, ma] = [Math.min(min, max), Math.max(min, max)];return mi + Math.random() * (ma - mi);}
    static fraction(whole) { return this.get(0, whole); }
    static getAngle(l = 1) { return l * this.get(0, 2*Math.PI); }
    // Standard Normal variate using Box-Muller transform.
    static getGaussian(mean=.5, stdev=.1) {const u = 1 - this.get(); /* Converting [0,1) to (0,1] */const v = this.get();const z = ( -2.0 * Math.log( u ) )**.5 * Math.cos( 2.0 * Math.PI * v );/* Transform to the desired mean and standard deviation: */return z * stdev + mean;}
    static skew(value, skew = 0) { /*skew values (from 0 to 1) by a skew from -1 to 1, respectively right and left skewed (resp more values to left or to right), 0 is not skewed*/return (skew < 0)? value - (this.skew(1-value, -skew) - (1-value)): Math.pow(value, 1-Math.abs(skew));}
    static getNormalDistributed(skew = 0) { /*skew values (from 0 to 1) by a skew from -1 to 1, respectively right and left skewed (resp more values to left or to right), 0 is not skewed*/let v = -1;while(v < 0 || 1 <= v) { v = this.getGaussian(.5, .1) };return this.skew(v, skew);}
}
this.R = Random;
}
// Turtlelib Jurgen Randomness v 2 - end
// Turtlelib Jurgen Path tools v 3 - start - {"id":"2d89bd6d64","package":"Jurgen","name":"Path tools","version":"3"}
function turtlelib_ns_2d89bd6d64_Jurgen_Path_tools() {
///////////////////////////////////////////////////////
// Path functions - Created by Jurgen Westerhof 2024 //
///////////////////////////////////////////////////////
class PathTools {
    static bezier(p1, cp1, cp2, p2, steps = null) {steps = (steps === null? Math.max(3, (V.len(V.sub(cp1, p1)) + V.len(V.sub(cp2, cp1)) + V.len(V.sub(p2, cp2))) | 0): steps) - 1; return Array.from({length: steps + 1}).map((v, i, a, f = i/steps) => [[V.lerp(p1, cp1, f),V.lerp(cp1, cp2, f),V.lerp(cp2, p2, f)]].map(v => V.lerp(V.lerp(v[0], v[1], f), V.lerp(v[1], v[2], f), f))[0]);}
    // https://stackoverflow.com/questions/18655135/divide-bezier-curve-into-two-equal-halves#18681336
    static splitBezier(p1, cp1, cp2, p2, t=.5) {const e = V.lerp(p1, cp1, t);const f = V.lerp(cp1, cp2, t);const g = V.lerp(cp2, p2, t);const h = V.lerp(e, f, t);const j = V.lerp(f, g, t);const k = V.lerp(h, j, t);return [[p1, e, h, k], [k, j, g, p2]];}
    static circular(radius,verticeCount,rotation=0) {return Array.from({length: verticeCount}).map((e,i,a,f=i*2*Math.PI/verticeCount+rotation) => [radius*Math.cos(f),radius*Math.sin(f)])}
    static circle(r){return this.circular(r,Math.max(12, r*2*Math.PI|0));}
    static arc(radius, extend = 2 * Math.PI, clockWiseStart = 0, steps = null, includeLast = false) { return [steps == null? Math.max(20, (radius*extend+1)|0): steps].map(steps => Array.from({length: steps}).map((v, i, a) => [radius * Math.cos(clockWiseStart + extend*i/(a.length-(includeLast?1:0))), radius * Math.sin(clockWiseStart + extend*i/(a.length-(includeLast?1:0)))])).pop(); }
    static draw(turtle, path) {path.forEach((pt, i) => turtle[i==0?'jump':'goto'](pt));}
    static drawTour(turtle, path) {this.draw(turtle, path.concat([path[0]]));}
    static drawPoint(turtle, pt, r = .1) {this.drawTour(turtle, this.circle(r).map(e => V.add(e, pt)));}
    static drawArrow(turtle, s, d, width = 6, length = 3) {turtle.jump(s);const arrowHeadBase = V.add(s,d);turtle.goto(arrowHeadBase);turtle.goto(V.add(arrowHeadBase, V.trans(V.rot2d(-V.angle(d)), [-length, width/2])));turtle.jump(V.add(arrowHeadBase, V.trans(V.rot2d(-V.angle(d)), [-length, -width/2])));turtle.goto(arrowHeadBase);}
    static circlesTangents(c1_center, c1_radius, c2_center, c2_radius, internal = false) {let middle_circle = [V.scale(V.sub(c1_center, c2_center), .5)].map(hwp => [V.add(c2_center, hwp), V.len(hwp)]).pop();if(!internal && c1_radius == c2_radius) {let target = V.sub(c2_center, c1_center);let scaledTarget = V.scale(target, c1_radius/V.len(target));let partResult = [V.add(c1_center, V.trans(V.rot2d(Math.PI/2), scaledTarget)),V.add(c1_center, V.trans(V.rot2d(Math.PI/-2), scaledTarget))];return [partResult,partResult.map(pt => V.add(pt, target))]}let swap = !internal && c2_radius > c1_radius;if(swap) {let t = [[...c1_center], c1_radius];c1_center = c2_center;c1_radius = c2_radius;c2_center = t[0];c2_radius = t[1];}let internal_waypoints = Intersection.circles(c1_center, c1_radius + (internal?c2_radius:-c2_radius), ...middle_circle);if(!internal_waypoints.intersect_occurs) return [];const circlePointAtDirection2 = (circle_center, radius, direction) => V.add(circle_center, V.scale(direction, radius/V.len(direction)));const result = [[circlePointAtDirection2(c1_center, c1_radius, V.sub(internal_waypoints.point_1, c1_center)),circlePointAtDirection2(c1_center, c1_radius, V.sub(internal_waypoints.point_2, c1_center))],[circlePointAtDirection2(c2_center, c2_radius, internal?V.sub(c1_center, internal_waypoints.point_1):V.sub(internal_waypoints.point_1, c1_center)),circlePointAtDirection2(c2_center, c2_radius, internal?V.sub(c1_center, internal_waypoints.point_2):V.sub(internal_waypoints.point_2, c1_center))]];return swap? [[result[1][1],result[1][0]],[result[0][1],result[0][0]]]: result;}
    static vectors(path) {return Array.from({length: path.length - 1}).map((e, i) => V.sub(path[i+1], path[i]));}
    static path(vectors) {return vectors.reduce((a,c) => a.length==0?[c]:[...a, V.add(c, a[a.length-1])], []);}
    static redistributeLinear(path, length = .5) {const p = path.map(pt => [...pt]);const result = [[...p[0]]];let pointer = 1;doneAll: while(pointer < p.length) {let l = length;while(pointer < p.length) {const distance = V.len(V.sub(p[pointer], p[pointer - 1]));if(distance < l) {l-=distance;pointer++;continue;}if(distance == l) {if(pointer < p.length - 1) result.push([...p[pointer]]);pointer++;break doneAll;}if(l < distance) {const newPoint = V.lerp(p[pointer-1], p[pointer], l/distance);if(pointer < p.length - 1) result.push([...newPoint]);p[pointer - 1] = newPoint;break;}}}result.push(p.pop());return result;}
    static length(path) { return this.lengths(path).reduce((c, a) => a + c, 0); }
    static lengths(path) { return path.map((e, i, a) => V.len(V.sub(e, a[(i+1)%a.length]))).filter((e, i, a) => i < a.length - 1); }
    static intersectInfoRay(path, origin, direction) {const vectors = this.vectors(path);const ri = vectors.map((e, i) => [i, Intersection.info(origin, direction, path[i], e)]).filter(e => 0 <= e[1][2] && e[1][2] <= 1 && 0 < e[1][1]).sort(e => e[1][1]);if(ri.length == 0) return false;const hit = ri[0];const lengths = this.lengths(path);const length = lengths.reduce((a, c) => a + c, 0);let l = 0;for(let i = 0; i < hit[0]; i++) {l += lengths[i];}return [hit[1][0], (l + (lengths[hit[0]] * hit[1][2])) / length, hit[1][1]];}
    static lerp(path, part) {if(part < 0 || 1 < part) throw new Error('Range of part is 0 to 1, got ' + path);const lengths = this.lengths(path);const length = lengths.reduce((a, c) => a + c, 0);let l = length * part;for(let i = 0; i < lengths.length; i++) {if(lengths[i] < l) {l-=lengths[i];continue;}return V.lerp(path[i], path[i+1], l / V.len(V.sub(path[i+1], path[i])));}return [...path[path.length - 1]];}
    static boundingBox(path) { return path.reduce((a, c) => [[Math.min(c[0], a[0][0]), Math.min(c[1], a[0][1])],[Math.max(c[0], a[1][0]), Math.max(c[1], a[1][1])]], [path[0], path[0]]); }
}
this.PT = PathTools;
}
// Turtlelib Jurgen Path tools v 3 - end
// Turtlelib Jurgen Formula v 3 - start - {"id":"ed7b692d39","package":"Jurgen","name":"Formula","version":"3"}
function turtlelib_ns_ed7b692d39_Jurgen_Formula() {
/////////////////////////////////////////////////////////////////
// Formula parser and solver - Created by Jurgen Westerhof 2024
// https://turtletoy.net/turtle/187a81ec7d
/////////////////////////////////////////////////////////////////
function Formula(string) {
    const types = {
        'Function': 'Function',
        'Literal': 'Literal',
        'Variable': 'Variable',
        'Arithmetic': 'Arithmetic',
        'Unary': 'Unary',
    };
    const operators = [ //ordered by operator precedence (PEMDAS)
        ['**', (a, b) => a**b],
        ['*', (a, b) => a*b],
        ['/', (a, b) => a/b],
        ['%', (a, b) => a%b],
        ['+', (a, b) => a+b],
        ['-', (a, b) => a-b],
        ['<<', (a, b) => a<<b],
        ['>>', (a, b) => a>>b],
        ['|', (a, b) => a|b],
        ['^', (a, b) => a^b],
        ['&', (a, b) => a&b],
    ];
    class Formula {
        #variables;
        #parsed;
        #raw;
        #ready;
        constructor(string) {
            this.#raw = string;
            this.#variables = [];
            this.#parsed = this.tokenize(string);
        }
        getVariables() {
            return this.#variables.map(e => e);
        }
        getParsed() {
            const clone = (v) => (typeof v == 'object')? v.map(vv => clone(vv)): v;
            return this.#parsed.map(v => clone(v));
        }
        tokenize(str) {
            const tokens = [];
            let m;

            nextToken: for(let i = 0; i < str.length; i++) {
                //Skip whitespace
                if(/\s/.test(str[i])) continue;
                //Parse Math namespace
                if(str.substr(i, 5) == 'Math.') {
                    i += 5;
                    m = new RegExp(`^.{${i}}(?<payload>(?<const>[A-Z][A-Z0-9]*)|(?<fn>[a-z][a-z0-9]*)).*?`).exec(str);
                    if(Math[m.groups.payload] === undefined) {
                        console.error(`Math.${m.groups.payload} is undefined`);
                    }
                    if(m.groups.const) {
                        tokens.push([types.Literal, Math[m.groups.payload]]);
                    } else {
                        tokens.push([types.Function, m.groups.payload]);
                    }
                    i+=m.groups.payload.length-1;
                    continue nextToken;
                }
                //Parse variable
                // taking a shortcut here: unicode in variable names not accepted: https://stackoverflow.com/questions/1661197/what-characters-are-valid-for-javascript-variable-names
                m = new RegExp('^' + '\.'.repeat(i) + '(?<payload>[a-zA-Z_$][0-9a-zA-Z_$]*).*').exec(str);
                if(m !== null) {
                    tokens.push([types.Variable, m.groups.payload]);
                    if(!this.#variables.includes(m.groups.payload)) {
                        this.#variables.push(m.groups.payload);
                    }
                    i+= m.groups.payload.length - 1;
                    continue nextToken;
                }
                //Parse unary
                if((tokens.length == 0 || tokens[tokens.length - 1][0] == types.Arithmetic) && (str[i] == '-' || str[i] == '+' || str[i] == '~')) {
                    tokens.push([types.Unary, str[i]]);
                    continue nextToken;
                }
                //Parse (group) (including function parameters)
                if(str[i] == '(') {
                    const isFunction = (tokens.length > 0 && tokens[tokens.length - 1][0] == types.Function);
                    let cnt = 1;
                    let k = i + 1;
                    let j = 0;
                    let fnArgs = [];
                    for(; 0 < cnt && k+j < str.length; j++) {
                        if(str[k+j] == '(') cnt++;
                        if(str[k+j] == ')') cnt--;
                        if(str[k+j] == ',' && cnt == 1) {
                            fnArgs.push(this.tokenize(str.substr(i+1, j)));
                            i += j+1;
                            k += j+1;
                            j=0;
                        }
                    }
                    if(cnt == 0) {
                        if(isFunction) {
                            fnArgs.push(this.tokenize(str.substr(i+1, j-1)));
                            tokens[tokens.length - 1].push(fnArgs)
                        } else {
                            tokens.push(this.tokenize(str.substr(i+1, j-1)));
                        }
                        i += j;
                        continue nextToken;
                    }
                    console.error(`Opened bracket at character ${i} not closed: ${str.substr(i)}`);
                    throw new Error(`Opened bracket at character ${i} not closed: ${str.substr(i)}`);
                }
                //Parse literal
                m = new RegExp(`^.{${i}}(?<payload>\\d+(\\.\\d+)?|\\.\\d+).*?`).exec(str);
                if(m !== null) {
                    tokens.push([types.Literal, +m.groups.payload]);
                    i+=m.groups.payload.length-1;
                    continue nextToken;
                }
                //Parse operator
                m = new RegExp(`^.{${i}}(?<payload>\\${operators.map(o => o[0].split('').join('\\')).join('|\\')})`).exec(str);
                if(m !== null) {
                    tokens.push([types.Arithmetic, m.groups.payload]);
                    i+=m.groups.payload.length-1;
                    continue nextToken;
                }
                //Something I didn't think of occured
                console.error(`Unable to parse '${str}' because a character at ${i}: ${str[i]}`);
                throw new Error(`Unable to parse '${str}' because a character at ${i}: ${str[i]}`);
            }
            return tokens;
        }
        solve(variableMap = {}) {
            return this.solveInt(
                this.#parsed,
                //Map required variables to values assuming 0 if not set
                this.#variables.reduce((a, c) => {
                    let val = 0;
                    if(variableMap[c] === undefined) {
                        console.warn(`Variable ${c} not set in argument to solve() of ${this.#raw}.`);
                        throw new Error(`Variable ${c} not set in argument to solve() of ${this.#raw}.`);
                    } else {
                        val = variableMap[c];
                    }
                    return {...a, [c]: val};
                }, {})
            );
        }
        solveInt(tokenss, variableMap) {
            if(tokenss.length == 0) return 0;

            const clone = (v) => (typeof v == 'object')? v.map(vv => clone(vv)): v;
            const tokens = tokenss.map(v => clone(v));

            //Resolve functions
            for(let i = 0; i < tokens.length; i++) {
                if(tokens[i][0] == types.Function) {
                    const literals = tokens[i][2].map(v => this.solveInt(v, variableMap));
                    tokens[i] = [types.Literal, Math[tokens[i][1]].apply(null, literals)];
                }
            }
            //Resolve (group)s
            for(let i = 0; i < tokens.length; i++) {
                if(typeof tokens[i][0] == 'object') {
                    tokens[i] = [types.Literal, this.solveInt(tokens[i], variableMap)];
                }
                if(tokens[i][0] == types.Variable) {
                    tokens[i] = [types.Literal, typeof variableMap[tokens[i][1]] == 'function'? variableMap[tokens[i][1]](variableMap): variableMap[tokens[i][1]]];
                }
            }
            //Resolve unary
            for(let i = 0; i < tokens.length; i++) {
                if(tokens[i][0] == types.Unary) {
                    switch(tokens[i][1]) {
                        case '-':
                        case '+':
                            tokens[i+1][1] = tokens[i+1][1]*(tokens[i][1]=='-'?-1:1);
                            break;
                        case '~':
                            tokens[i+1][1] = ~tokens[i+1][1];
                    }
                    tokens.splice(i, 1);
                    i--;
                }
            }
            //Resolve operators
            operators.forEach(op => {
                for(let i = 0; i < tokens.length; i++) {
                    if(tokens[i][0] == types.Arithmetic && tokens[i][1] == op[0]) {
                        tokens[i-1][1] = op[1](tokens[i-1][1], tokens[i+1][1]);
                        tokens.splice(i, 2);
                        i-=2;
                    }
                }
            });
            //Get solution
            if(tokens.length == 1 && tokens[0][0] == types.Literal) {
                return tokens[0][1];
            }
            //Something I didn't think of occured
            console.error('Something went wrong solving token ' + i, tokens);
            throw new Error('Something went wrong solving token ' + i);
        }
    }
    return new Formula(string);
}
this.fn = Formula;
}
// Turtlelib Jurgen Formula v 3 - end
```
