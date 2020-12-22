/** ============================= ENTRY POINT ============================= */
function setup() {
    app.p5canvas = createCanvas(1000, 666);
    app.p5canvas.parent(app.html.canvasContainer);
    app.init();

    initLogicGateData();

    Sounds.create('click', './sound/click.mp3');
    Sounds.create('error', './sound/error.mp3');

    frameRate(app.fps);

    if (typeof window.main == 'function') {
        app.tryCatchWrap(window.main);
    }
}

let lastChangeAlteredValue = true;
function draw() {
    if (app.workspace) {
        if (app.file.name && app.workspace.contentAltered != lastChangeAlteredValue) {
            lastChangeAlteredValue = app.workspace.contentAltered;
            app.statusbar.item('Up-To-Date', app.workspace.contentAltered ? 'No' : 'Yes');
        }

        // Evaluate / show info
        if (app.workspace.stateChanged) {
            app.workspace.evaluate();
            app.workspace.stateChanged = false;

            // app.html.booleanAlgebraTable.innerHTML = '';
            // app.html.booleanAlgebraTable.insertAdjacentElement('beforeend', generateAlgebraTable(app.workspace));
        }

        if (app.workspace.componentOver && !app.workspace.componentDragging) app.workspace.componentOverTicks++;

        // Render
        app.workspace.render();
    } else {
        background(51);
        textSize(30);
        noStroke();
        fill(250);
        textAlign(CENTER);
        text('No workspace is currently open', width / 2, height / 2);
    }
}

function mousePressed() {
    if (app.isFrozen || !isHidden(app.html.cover)) return;

    if (app.insertData) {
        app.stopInsert(mouseX, mouseY);
        return;
    } else if (Label.selected) {
        Label.selected.event_click();
    }

    if (!app.workspace) return;
    app.workspace.componentOverTicks = 0;

    if (app.workspace.componentOver) {
        if (!app.opts.readonly && app.workspace.componentOver.event_mstart()) {
            app.workspace.componentDragging = true;
            app.workspace.componentBeenMoved = false;
        }
    } else if (app.workspace.connNodeOver) {
        // Only allow creating connection from output
        if (!app.opts.readonly && !app.workspace.connNodeOver[1]) {
            app.workspace.connTo = [NaN, NaN];
        }
    }
}

function mouseMoved() {
    if (!app.workspace || app.isFrozen || !isHidden(app.html.cover)) return;

    if (!app.workspace.componentDragging && app.workspace.connTo == null && (mouseX != app.workspace.overCoords[0] || mouseY != app.workspace.overCoords[1])) {
        app.workspace.componentDragging = false;
        app.workspace.componentBeenMoved = false;
        app.workspace.componentOver = null;
        app.workspace.componentOverTicks = NaN;
        if (app.workspace.connNodeOver) {
            getConn(app.workspace, app.workspace.connNodeOver).h = false;
            app.workspace.connNodeOver = null;
        }
        if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) return;

        let over = getThingOver(mouseX, mouseY);
        if (over instanceof Component) {
            // Component
            app.workspace.componentOver = over;
            app.workspace.componentOverTicks = 0;
        } else if (over) {
            // Connection reference
            app.workspace.connNodeOver = over;
            getConn(app.workspace, over).h = true;
        }
    }
}

function mouseDragged() {
    if (!app.workspace || app.isFrozen || app.opts.readonly || !isHidden(app.html.cover)) return;

    if (app.workspace.componentDragging) {
        if (mouseX < app.workspace.componentDragging.w / 2 || mouseX > width - app.workspace.componentDragging.w / 2
            || mouseY < app.workspace.componentDragging.h / 2 || mouseY > height - app.workspace.componentDragging.h / 2) return;
        app.workspace.componentOver.x = roundCoord(mouseX);
        app.workspace.componentOver.y = roundCoord(mouseY);
        app.workspace.componentBeenMoved = true;
        app.workspace.overCoords[0] = mouseX;
        app.workspace.overCoords[1] = mouseY;
        app.workspace.contentAltered = true;
        app.workspace.componentOver.event_drag();
    } else if (app.workspace.connTo != null) {
        const r = app.opts.cnodew / 2;
        if (mouseX < r || mouseX > width - r || mouseY < r || mouseY > height - r) return;
        app.workspace.connTo[0] = Math.round(mouseX);
        app.workspace.connTo[1] = Math.round(mouseY);
    }
}

function mouseReleased() {
    if (!app.workspace || app.isFrozen || !isHidden(app.html.cover)) return;

    // Clicked?
    if (app.workspace.componentOver && !app.workspace.componentBeenMoved) {
        app.workspace.componentOver.event_click();
        if (app.workspace.componentOver instanceof Label) Label.selected = app.workspace.componentOver;
        app.workspace.componentDragging = false;
    } else if (app.workspace.componentDragging) {
        app.workspace.componentDragging = false;
        app.workspace.componentBeenMoved = false;
        app.workspace.componentOver.event_mstop();
    } else if (app.workspace.connTo) {
        // Is over destination node?
        let over = getThingOver(mouseX, mouseY);
        if (Array.isArray(over)) {
            let conn = getConn(app.workspace, over);

            // NB only connectes output -> input
            if (!app.workspace.connNodeOver[1] && !Array.isArray(conn.c)) {
                // Is input connector, and not connected
                if (conn.c == null) {
                    app.workspace.connectComponents(app.workspace.connNodeOver[0], app.workspace.connNodeOver[2], over[0], over[2]);
                    app.workspace.contentAltered = true;
                } else console.log("Already connected");
            } else console.log("Can only connect output -> input");
        } else console.log("Destination is not a node");
        app.workspace.connTo = null;
    }
}

function keyPressed(event) {
    if (!app.workspace || app.opts.readonly || !isHidden(app.html.cover)) return;

    if (key == 'Delete') {
        if (app.workspace.componentOver) {
            if (app.workspace.componentOver.event_delete() && confirm(`Delete ${app.workspace.componentOver.name}?`)) {
                app.workspace.removeComponent(app.workspace.componentOver);
                app.workspace.stateChanged = true;
                app.workspace.contentAltered = true;
                app.workspace.componentOver = false;
            }
        } else if (app.workspace.connNodeOver) {
            // Remove all connections?
            removeConn(app.workspace._els[app.workspace.connNodeOver[0]], app.workspace.connNodeOver[1], app.workspace.connNodeOver[2]);
            app.workspace.contentAltered = true;
        }
    } else if (Label.selected) {
        Label.selected.type(event);
        app.workspace.contentAltered = true;
        return false;
    }
}