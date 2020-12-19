/** ============================= ENTRY POINT ============================= */
function setup() {
    app.p5canvas = createCanvas(1000, 666);
    app.p5canvas.parent(app.html.canvasContainer);
    app.init();

    initLogicGateData();

    Sounds.create('click', './sound/click.mp3');
    Sounds.create('error', './sound/error.mp3');

    frameRate(30);
    noLoop();
}

let lastChangeAlteredValue = true;
function draw() {
    if (app.workspace) {
        if (app.workspace.contentAltered != lastChangeAlteredValue) {
            lastChangeAlteredValue = app.workspace.contentAltered;
            app.html.actionbar.innerText = `File: ${app.file.name} ` + (app.workspace.contentAltered ? '(unsaved)' : '');
        }

        // Evaluate / show info
        if (app.workspace.stateChanged) {
            if (app.html.evaluateCheckbox.checked) app.workspace.evaluate();
            app.html.componentInfo.innerHTML = "";
            if (app.workspace.componentOver) app.html.componentInfo.insertAdjacentElement('beforeend', getComponentInfo(app.workspace.componentOver));
            app.workspace.stateChanged = false;

            app.html.booleanAlgebraTable.innerHTML = '';
            app.html.booleanAlgebraTable.insertAdjacentElement('beforeend', generateAlgebraTable(app.workspace));
        }

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
    if (!app.workspace || app.workspace.isFrozen) return;

    if (app.workspace.componentOver) {
        app.workspace.componentDragging = true;
        app.workspace.componentBeenMoved = false;
    }
}

function mouseMoved() {
    if (!app.workspace || app.workspace.isFrozen) return;

    if (!app.workspace.componentDragging && (mouseX != app.workspace.overCoords[0] || mouseY != app.workspace.overCoords[1])) {
        let oldOver = this.componentOver;
        app.workspace.componentDragging = false;
        app.workspace.componentBeenMoved = false;
        app.workspace.componentOver = null;
        app.workspace.componentOverTicks = NaN;
        if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) return;

        app.workspace.forEachComponent((c) => {
            if (c.isOver(mouseX, mouseY)) {
                app.workspace.componentOver = c;
                app.workspace.componentOverTicks = 0;
                return false;
            }
        });

        if (app.workspace.componentOver != oldOver || app.workspace.stateChanged) {
            app.html.componentInfo.innerHTML = "";
            if (app.workspace.componentOver) app.html.componentInfo.insertAdjacentElement('beforeend', getComponentInfo(app.workspace.componentOver));
        }
    }
}

function mouseDragged() {
    if (!app.workspace || app.workspace.isFrozen) return;

    if (app.workspace.componentDragging) {
        if (mouseX < app.workspace.componentDragging.w / 2 || mouseX > width - app.workspace.componentDragging.w / 2
            || mouseY < app.workspace.componentDragging.h / 2 || mouseY > height - app.workspace.componentDragging.h / 2) return;
        app.workspace.componentOver.x = Math.floor(mouseX);
        app.workspace.componentOver.y = Math.floor(mouseY);
        app.workspace.componentBeenMoved = true;
        app.workspace.overCoords[0] = mouseX;
        app.workspace.overCoords[1] = mouseY;
        app.workspace.contentAltered = true;
    }
}

function mouseReleased() {
    if (!app.workspace || app.workspace.isFrozen) return;

    if (app.workspace.componentDragging) {
        if (!app.workspace.componentBeenMoved) app.workspace.componentOver.event_click();
        app.workspace.componentDragging = false;
        app.workspace.componentBeenMoved = false;
    }
}

function keyPressed() {
    if (!app.workspace) return;

    if (app.workspace.primedDeletion) {
        if (key == 'Enter') {
            // Delete Component
            app.workspace.removeComponent(app.workspace.componentOver);
            app.workspace.stateChanged = true;
            app.workspace.contentAltered = true;
        } else {
            app.workspace.componentOver.isHighlighted = false;
        }
        app.workspace.isFrozen = false;
        app.workspace.primedDeletion = false;
    } else {
        if (key == 'Delete' && app.workspace.componentOver) {
            app.workspace.isFrozen = true;
            app.workspace.primedDeletion = true;
            app.workspace.componentOver.isHighlighted = true;
        }
    }
}