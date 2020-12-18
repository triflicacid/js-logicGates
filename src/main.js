var p5canvas;
const logicGates = []; // Array of all logic gates

/** @type {Canvas} */
var canvas;

var initObject; // Object returned from user-defined init()

function setup() {
    initObject = init();
    if (initObject.componentInfo) initObject.componentInfo = document.getElementById(initObject.componentInfo);

    canvas = new Canvas(initObject.container, initObject.width, initObject.height);
    initLogicGateData();

    Sounds.create('click', './sound/click.mp3');

    main(canvas);
    canvas.stateChanged = true;

    frameRate(30);
}

function draw() {
    let stateChanged = canvas.stateChanged;

    // Evaluate / show info
    if (canvas.stateChanged) {
        if (typeof initObject.evaluate == 'function' && initObject.evaluate()) canvas.evaluate();
        if (initObject.componentInfo) {
            initObject.componentInfo.innerHTML = "";
            if (canvas.componentOver) initObject.componentInfo.insertAdjacentElement('beforeend', getComponentInfo(canvas.componentOver));
        }
        canvas.stateChanged = false;
    }

    // User-defined loop function
    if (typeof initObject.loop === 'function') initObject.loop(canvas, stateChanged);
    
    // Render
    canvas.render();
}

function mousePressed() {
    if (canvas.isFrozen) return;

    if (canvas.componentOver) {
        canvas.componentDragging = true;
        canvas.componentBeenMoved = false;
    }
}

function mouseMoved() {
    if (canvas.isFrozen) return;

    if (!canvas.componentDragging && (mouseX != canvas.overCoords[0] || mouseY != canvas.overCoords[1])) {
        let oldOver = this.componentOver;
        canvas.componentDragging = false;
        canvas.componentBeenMoved = false;
        canvas.componentOver = null;
        canvas.componentOverTicks = NaN;
        if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) return;

        canvas.forEachComponent((c) => {
            if (c.isOver(mouseX, mouseY)) {
                canvas.componentOver = c;
                canvas.componentOverTicks = 0;
                return false;
            }
        });

        if (initObject.componentInfo && (canvas.componentOver != oldOver || canvas.stateChanged)) {
            initObject.componentInfo.innerHTML = "";
            if (canvas.componentOver) initObject.componentInfo.insertAdjacentElement('beforeend', getComponentInfo(canvas.componentOver));
        }
    }
}

function mouseDragged() {
    if (canvas.isFrozen) return;

    if (canvas.componentDragging) {
        if (mouseX < canvas.componentDragging.w / 2 || mouseX > width - canvas.componentDragging.w / 2
            || mouseY < canvas.componentDragging.h / 2 || mouseY > height - canvas.componentDragging.h / 2) return;
        canvas.componentOver.x = Math.floor(mouseX);
        canvas.componentOver.y = Math.floor(mouseY);
        canvas.componentBeenMoved = true;
        canvas.overCoords[0] = mouseX;
        canvas.overCoords[1] = mouseY;
    }
}

function mouseReleased() {
    if (canvas.isFrozen) return;

    if (canvas.componentDragging) {
        if (!canvas.componentBeenMoved) canvas.componentOver.event_click();
        canvas.componentDragging = false;
        canvas.componentBeenMoved = false;
    }
}

function keyPressed() {
    if (canvas.primedDeletion) {
        if (key == 'Enter') {
            // Delete Component
            canvas.removeComponent(canvas.componentOver);
            canvas.stateChanged = true;
        } else {
            canvas.componentOver.isHighlighted = false;
        }
        canvas.isFrozen = false;
        canvas.primedDeletion = false;
    } else {
        if (key == 'Delete' && canvas.componentOver) {
            canvas.isFrozen = true;
            canvas.primedDeletion = true;
            canvas.componentOver.isHighlighted = true;
        }
    }
}