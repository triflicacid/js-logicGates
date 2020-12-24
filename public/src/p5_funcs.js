/** ============================= ENTRY POINT ============================= */
function setup() {
    app.p5canvas = createCanvas(1000, 666);
    app.p5canvas.parent(app.html.canvasContainer);
    app.init();

    frameRate(app.fps);
}

let lastChangeAlteredValue = true;
function draw() {
    if (app.workspace) {
        if (app.file.name && app.workspace.contentAltered != lastChangeAlteredValue) {
            lastChangeAlteredValue = app.workspace.contentAltered;
            app.statusbar.item('Up-To-Date', app.workspace.contentAltered ? 'No' : 'Yes');
        }

        if (app.workspace.stateChanged) app.workspace.evaluate();
        incTicks();

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

function incTicks() {
    if (app.isFrozen || !isHidden(app.html.cover) || !app.workspace.componentOver || app.workspace.componentDragging) return;
    app.workspace.componentOverTicks++;
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
            app.history.push();
            app.workspace.componentDragging = true;
            app.workspace.componentBeenMoved = false;
        }
    } else if (app.workspace.connNodeOver) {
        // Only allow creating connection from output
        if (!app.opts.readonly && !app.workspace.connNodeOver[1]) {
            app.history.push();
            app.workspace.connTo = [NaN, NaN];
        }
    }
}

function mouseMoved() {
    if (!app.workspace) return;
    if (!isNaN(app.workspace.componentOverTicks)) app.workspace.componentOverTicks = 0;
    if (app.isFrozen || !isHidden(app.html.cover)) return;

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
    if (!app.workspace) return;
    if (!isNaN(app.workspace.componentOverTicks)) app.workspace.componentOverTicks = 0;
    if (app.isFrozen || app.opts.readonly || !isHidden(app.html.cover)) return;

    if (app.workspace.componentDragging) {
        if (mouseX < app.workspace.componentDragging.w / 2 || mouseX > width - app.workspace.componentDragging.w / 2
            || mouseY < app.workspace.componentDragging.h / 2 || mouseY > height - app.workspace.componentDragging.h / 2) return;
        app.workspace.componentOver.x = roundCoord(mouseX);
        app.workspace.componentOver.y = roundCoord(mouseY);
        app.workspace.componentBeenMoved = true;
        app.workspace.overCoords[0] = mouseX;
        app.workspace.overCoords[1] = mouseY;
        app.history.registerChange(true);
        app.workspace.componentOver.event_drag();
    } else if (app.workspace.connTo != null) {
        const r = app.opts.cnodew / 2;
        if (mouseX < r || mouseX > width - r || mouseY < r || mouseY > height - r) return;
        app.workspace.connTo[0] = Math.round(mouseX);
        app.workspace.connTo[1] = Math.round(mouseY);

        // Hover over another node
        let over = getThingOver(mouseX, mouseY);
        if (over != null && !(over instanceof Component)) {
            app.workspace.connNodeOver2 = over;
            getConn(app.workspace, over).h = true;
        } else {
            // Clear hover node?
            if (app.workspace.connNodeOver2) {
                getConn(app.workspace, app.workspace.connNodeOver2).h = false;
                app.workspace.connNodeOver2 = null;
            }
        }
    }
}

function mouseReleased() {
    if (!app.workspace || app.isFrozen || !isHidden(app.html.cover)) return;

    // Clicked?
    if (app.workspace.componentOver && !app.workspace.componentBeenMoved) {
        app.workspace.componentOver.event_click();
        if (app.workspace.componentOver instanceof Label) Label.selected = app.workspace.componentOver;
        app.workspace.componentDragging = false;
        app.history.registerChange(true);
    } else if (app.workspace.componentDragging) {
        app.workspace.componentDragging = false;
        app.workspace.componentBeenMoved = false;
        app.workspace.componentOver.event_mstop();
        app.history.registerChange(true);
    } else if (app.workspace.connTo) {
        let ok = false;

        // Is over destination node?
        let over = getThingOver(mouseX, mouseY);
        if (Array.isArray(over)) {
            let conn = getConn(app.workspace, over);

            // NB only connectes output -> input
            if (!app.workspace.connNodeOver[1] && !Array.isArray(conn.c)) {
                // Is input connector, and not connected
                if (conn.c == null) {
                    console.log(app.workspace.connNodeOver[0], app.workspace.connNodeOver[2], over[0], over[2]);
                    app.workspace.connectComponents(app.workspace.connNodeOver[0], app.workspace.connNodeOver[2], over[0], over[2]);
                    ok = true;
                    app.workspace.stateChanged = true;
                } else console.log("Already connected");
            } else console.log("Can only connect output -> input");
        } else console.log("Destination is not a node");
        app.workspace.connTo = null;
        app.history.registerChange(ok);
    }
}

function keyPressed(event) {
    if (app.opts.readonly || !isHidden(app.html.cover)) return;

    if (app.workspace) {
        if (event.key == 'Delete') {
            if (app.workspace.componentOver) {
                if (app.workspace.componentOver.event_delete() && confirm(`Delete ${app.workspace.componentOver.name}?`)) {
                    app.history.push();
                    app.workspace.removeComponent(app.workspace.componentOver);
                    app.workspace.stateChanged = true;
                    app.workspace.componentOver = false;
                    app.history.registerChange(true);
                }
            } else if (app.workspace.connNodeOver) {
                // Remove all connections?
                app.history.push();
                removeConn(app.workspace._els[app.workspace.connNodeOver[0]], app.workspace.connNodeOver[1], app.workspace.connNodeOver[2]);
                app.history.registerChange(true);
            } else {
                menu.deleteFile.showPopup(true);
            }
        } else if (Label.selected) {
            app.history.push();
            Label.selected.type(event);
            app.history.registerChange(true);
            return false;
        } else if (event.key == 'b') {
            menu.boolAlgebra.popup(true, app.workspace.componentOver);
        } else if (event.key == 't') {
            menu.traceTable.popup(true, app.workspace.componentOver);
        } else if (event.keyCode == 32) {
            app.html.evalBtn.click();
        } else if (event.ctrlKey) {
            // Ctrl + shortcuts
            if (event.key == 's') {
                menu.saveFile();
                return false;
            } else if (event.key == 'S') {
                menu.saveAs.showPopup(true);
            } else if (event.key == 'z') {
                app.history.undoBtn();
            } else if (event.key == 'y') {
                app.history.redoBtn();
            }
        } else if (event.key == 'Escape') {
            menu.exitFile.exit();
        }
    } else {
        if (event.ctrlKey) {
            if (event.key == 'o') {
                menu.openFile.showPopup(true);
                return false;
            }
        }
    }
}