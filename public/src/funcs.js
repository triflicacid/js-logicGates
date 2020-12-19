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
    x, y,
    c: null,
    ci: NaN,
});

/** Return object for output connection
 * @param {number} x        X coordinate of connection node
 * @param {number} y        Y coordinate of connection node
*/
const createOutputConnObj = (x, y) => ({
    x, y,
    c: [],
    ci: [],
});

/** Generate algebra table
 * @param {Workspace} ws workspace object
 * @return {HTMLTableElement} Table
 */
function generateAlgebraTable(ws) {
    const table = document.createElement('table');
    table.insertAdjacentHTML('beforeend', `<tr><th>Algebraic</th><th>Substituted</th></tr>`);

    let count = 0;
    ws.forEachComponent((c) => {
        if (c.constructor.name == 'Output') {
            count++;
            let str = c.backtrace();
            if (str[0] == '(') str = str.substr(1, str.length - 2);

            let strSub = c.backtrace(true);
            if (strSub[0] == '(') strSub = strSub.substr(1, strSub.length - 2);

            let state = Component.StyledAlgebra ? getHTMLState(c.state) : c.state;

            table.innerHTML += `<tr><td>${c.label} = ${str}</td><td>${c.label} = ${strSub} = ${state}</td></tr>`;
        }
    });
    if (count == 0) table.insertAdjacentHTML('beforeend', `<td colspan='5'><i>No output components</i></td>`);

    return table;
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