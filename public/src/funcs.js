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