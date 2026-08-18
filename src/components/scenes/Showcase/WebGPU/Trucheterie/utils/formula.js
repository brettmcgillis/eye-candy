/* eslint-disable */
// Vendored verbatim from the TurtleToy blob-field reference (todo.md,
// 'Turtlelib Jurgen Formula v 3' — https://turtletoy.net/turtle/187a81ec7d).
// Parses/solves the reference's `sizeFunction` control string. Its
// Math.random() token resolves against the global Math, which is what
// utils/seedrandom.js temporarily replaces.
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

export default Formula;
