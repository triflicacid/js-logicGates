## About the File System

This application uses files to store circuits. All files are visible to everyone.

As such, there is an additional option to password protect your files. This will prompt any user opening the file for the password, and only continue if the password is correct.

*NB passwords are stored seperatley to the circuit*

## Menu

### Open

This brings up a list of circuit files to open. Click on the name to open the file (if the file is password protected, a text box prompt will appear)

### New

Creates a new, unnamed instance. You can later save the instance, or simply discard it.


### Close

Closes the current instance.

If a file is open and it is not up-to-date, you will have the option to save before closing.

### Save

Saves the current instance.

If a file is open, saves to the file. If not, the Save As prompt will appear

### Save As

This asks for a file name, and (optionally) a password. A password requires that, upon opening the file, the correct password is needed to continue.

Save As will create a new file with the current state of the instance, and open the created file

### Delete

This will prompt to delete the current file, or, if a file isn't open, discard the workspace.

To proceed with deletion, the number sequence must be typed into the text box correctly (this is to help avoid accidental deletions, as recovery is not possible)

### Toggle Menu

This will hide/unhide the menu on the left-hand side of the canvas

### Advanced Options

This will bring up several advanced options which subtly change appearence and quality of life. None of these options change the fundamental logic behind the circuit.

## Components

### Input

Outputs a high (1) or a low (0) signal. Toggle this by clicking on the component.

### Output

Visually shows the signal it is recieving.

### Logic Gate

There are 7 logic gates implemented: not, and, or, xor, nor, nand, xnor (see [Here](https://en.wikipedia.org/wiki/Logic_gate) for more)

These components take its inputs, executes the logic function and outputs the return state

### Labels

Labels are like comments; they do nothing but aid you.

Click on a label and start typing, and press enter or click off the label to stop typing.

#### Bound Labels

Some components (Input, Output) have a bound label. This acts as a label, but cannot be deleted nor moved, but moved with the component.

The bound label acts as an identifier for the Input/Output, should the circuit be exported to an integrated circuit.

## Building Circuits

### Inserting Components

Click on button `Toggle Menu` to show side menu if it is hidden

Click on component to insert. Then click on the canvas to insert the component at that position.

### Moving Components

To move a component, simply click and drag your mouse. Its connections will redraw dynamically

### Deleting Components

Hover over the component in question and press the `Delete` key (above backspace) to bring up the deletion prompt

Then, press `Enter` to confirm deletion, or any other key to cancel

### Creating Connections

Click and drag from an output node (black circle). A connection line will be drawn to your mouse.

Drag the connection line over an input node, and drop to create connection. (if successfuly, will create a black connection line. Else, the line will disappear)

### Removing Connections

To remove a connection, hover over a node which it is connected to (black circle) and press the `Delete` key (above Backspace)

*N.B. This will remove all connections from/to this node*
