/** Called before initialisation */
function init() {
    let checkbox = document.getElementById('is-executing');
    checkbox.setAttribute('checked', 'checked');

    return {
        container: 'container',
        width: 1000,
        height: 600,
        componentInfo: 'c-info',
        evaluate: () => checkbox.checked,
        loop: (canvas, sc) => {
            if (sc) {
                let src = document.getElementById('c-algebra');
                src.innerHTML = '';
                src.insertAdjacentElement('beforeend', generateAlgebraTable(canvas));
            }
        },
    };
}

/** "Entry Point" */
function main(canvas) {
    let lg;

    lg = new Input('a', 50, 200);
    canvas.addComponent(lg);

    lg = new Input('b', 50, 400);
    canvas.addComponent(lg);

    lg = new LogicGate("and", 200, 300);
    canvas.addComponent(lg);

    lg = new Viewer(300, 300);
    canvas.addComponent(lg);

    lg = new LogicGate("buffer", 400, 300);
    canvas.addComponent(lg);

    lg = new Output('z', 550, 300);
    canvas.addComponent(lg);

    canvas.connectComponents(0, 0, 2, 0);
    canvas.connectComponents(1, 0, 2, 1);
    canvas.connectComponents(2, 0, 3, 0);
    canvas.connectComponents(3, 0, 4, 0);
    canvas.connectComponents(4, 0, 5, 0);
}

function generateAlgebraTable(canvas) {
    const table = document.createElement('table');
    table.insertAdjacentHTML('beforeend', `<tr><th>Algebraic</th><th>Substituted</th></tr>`);

    let count = 0;
    canvas.forEachComponent((c) => {
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

io.on('message', data => {
    console.log('[SERVER] %c' + data.msg, 'font-style:italic;color:gray;');
});