const capitalise = str => str[0].toUpperCase() + str.slice(1).toLowerCase();

/** get HTML table of component info */
const getComponentInfo = component => {
    const table = document.createElement("table");
    const lines = component.getPopupText();
    for (const line of lines) {
        table.insertAdjacentHTML("beforeend", `<tr><th>${line[0]}</th><td>${line[1]}</td></tr>`);
    }
    return table;
};

/**
 * Get HTML string depending upon state
 * @param {0 | 1} state
 * @return {string} HTML span element
 */
const getHTMLState = state => `<span class='status-${state ? 'on' : 'off'}'>${state}</span>`;

/** Get HTML string for unknown */
const getHTMLUnknown = () => '<span class="unknown">?</span>';

/** Return object for input connection
 * @param {number} x        X coordinate of connection node
 * @param {number} y        Y coordinate of connection node
*/
const createInputConnObj = (x, y) => ({
    x, y, // Pos
    c: null, // Component
    ci: NaN, // Conn index of component
    h: false, // Is highlighted?
});

/** Return object for output connection
 * @param {number} x        X coordinate of connection node
 * @param {number} y        Y coordinate of connection node
*/
const createOutputConnObj = (x, y) => ({
    x, y, // Pos
    c: [], // Array of connected components
    ci: [], // Array of associated conn indexes (matches to this.c array)
    h: false, // Is highlighted
});

/** Generate algebra table
 * @param {Workspace} ws workspace object
 * @return {HTMLDivElement}
 */
function generateAlgebraTable(ws) {
    const div = document.createElement('div');

    let count = 0;
    ws.forEachComponent((c) => {
        if (c.constructor.name == 'Output') {
            count++;
            let str = c.backtrace();
            if (str[0] == '(') str = str.substr(1, str.length - 2);

            let strSub = c.backtrace(true);
            if (strSub[0] == '(') strSub = strSub.substr(1, strSub.length - 2);

            let state = Component.StyledAlgebra ? getHTMLState(c.state) : c.state;

            div.insertAdjacentHTML('beforeend', `<p>${c.label} = ${str} = ${strSub} = ${state}</p>`);
        }
    });
    if (count == 0) div.insertAdjacentHTML('beforeend', `<p><i>No output components</i></p>`);

    return div;
}

/**
 * Hide or unhide DOM element
 * @param {HTMLElement} element     Element to hide
 * @param {boolean} hide Whether to hide (true) or undhide (false) ?
 */
const hide = (element, hide) => {
    if (hide) {
        element.setAttribute('hidden', 'hidden');
    } else {
        element.removeAttribute('hidden');
    }
};
const isHidden = element => element.getAttribute('hidden') == 'hidden';

/** 
 * Round to nearest number
 * @param {number} number number to round
 * @param {number} nearest number to round nearest to
 * @return {number} Rounded number
*/
const round = (number, nearest) => Math.ceil(number / nearest) * nearest;

/** Get connection node from info (type same as Workspace.connNdoeOver) */
const getConn = (workspace, tuple) => workspace.getComponent(tuple[0])[tuple[1] ? "inputs" : "outputs"][tuple[2]];

/**
 * Given a conn object, remove the connection
 * - NB modified the object
 * @param {Component} comp  Source component
 * @param {boolean} isInput     Is connection from input>
 * @param {object} cindex       Index of connection
 */
function removeConn(comp, isInput, cindex) {
    const obj = comp[isInput ? 'inputs' : 'outputs'][cindex];

    if (Array.isArray(obj.c)) {
        // OUTPUT connection
        for (let i = 0; i < obj.c.length; i++) {
            // Remove conn object stored in output.c[i].inputs array
            obj.c[i].inputs[obj.ci[i]].c = null;
            obj.c[i].inputs[obj.ci[i]].ci = NaN;
        }
        obj.c.length = 0;
        obj.ci.length = 0;
    } else if (obj.c) {
        // INPUT connection
        // Find stored index in input component, and remove their copy of a connection object
        let index = obj.c.outputs[obj.ci].c.indexOf(comp);
        console.log(index)
        if (index != -1) {
            obj.c.outputs[obj.ci].c.splice(index, 1);
            obj.c.outputs[obj.ci].ci.splice(index, 1);
        }

        // Remove our version
        obj.c = null;
        obj.ci = NaN;
    }
    console.log(obj)
}

/** Round given coordinate (number) to an appropriate degree */
const roundCoord = n => app.opts.gridw == 0 || isNaN(app.opts.gridw) ? Math.round(n) : round(n, app.opts.gridw);

/**
 * Create bezier curve for two coordinates
 * @param {[number, number]} start      Start coords
 * @param {[number, number]} end        End coords
*/
const drawCurve = (start, end) => {
    let crv = app.opts.curviness;
    bezier(...start, start[0] + crv, start[1], end[0] - crv, end[1], ...end);
};

/**
 * What are we over right now?
 * - Assume active workspace as app.workspace
 * @param {number} x
 * @param {number} y
 * @return {null | Component | [number, boolean, number]} Nothing, component, or conn reference
 */
const getThingOver = (x, y) => {
    let obj = null;
    app.workspace.forEachComponent((c, cid) => {
        // Is in vicinity?
        if (c.isOver(x, y, app.opts.cnodew)) {
            // Is over connection?
            let conno = c.isOverConn(x, y);
            if (conno) {
                conno.unshift(cid);
                obj = conno;
                return false;
            } else if (c.isOver(x, y)) {
                obj = c;
                return false;
            }
        }
    });
    return obj;
};