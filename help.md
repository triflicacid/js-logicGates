# About the File System

This application uses files to store circuits. All files are visible to everyone.

As such, there is an additional option to password protect your files. This will prompt any user opening the file for the password, and only continue if the password is correct.

*NB passwords are stored seperatley to the circuit*

# Menu

The menu has two states: when an instance is active, and when it is not

## When Not Active...

### Open

This brings up a list of circuit files to open. Click on the name to open the file (if the file is password protected, a text box prompt will appear)

### New

Creates a new, unnamed instance. You can later save the instance, or simply discard it.

### Upload

Select a file by clicking on the button in the popup. File types must be `.lgc`.

If successful, the file will be saved and opened as if it has been opened via `Open` button

### Links

Opens page in new tab containing usefule links

## When Active...

### Close

Closes the current instance.

If a file is open and it is not up-to-date, you will have the option to save before closing.

This can be accessed via the keyboard shortcut `Esc`

### Save

Saves the current instance.

If a file is open, saves to the file. If not, the Save As prompt will appear.

This can be accessed via the keyboard shortcut `Ctrl + s`

### Save As

This asks for a file name, and (optionally) a password. A password requires that, upon opening the file, the correct password is needed to continue.

Save As will create a new file with the current state of the instance, and open the created file

This can be accessed via the keyboard shortcut `Ctrl + Shift + s`

### Delete

This will prompt to delete the current file, or, if a file isn't open, discard the workspace.

To proceed with deletion, the number sequence must be typed into the text box correctly (this is to help avoid accidental deletions, as recovery is not possible)#

This can be accessed via the keyboard shortcut `Delete`

### Share

Various options to share active circuit:

- `Download as Image` : Download the canvas as a png image (*Note, will download as `download` only. Append `.png` to the end to open as image*)
- `Download as File` : Downloads active instance as encoded `.lgc` file (Logic Gate Circuit file). This is able to be uploaded again if wanted
- `Print` : Opens print dialogue

*NB the download will have no file extension. When saved, append `.png` to the end of the name*

### Settings

This will bring up several advanced options which subtly change appearence and quality of life. None of these options change the fundamental logic behind the circuit.

### Undo / Redo

These two buttons will undo or redo the last action

This can be accessed via the keyboard shortcuts `Ctrl + z` and `Ctrl + y`

### Play / Pause

Toggles the simulation... either reumes or pauses it

If paused, all component evaluation and clocks are stopped

This can be done via the keyboard shortcut `Space` (spacebar)

### Boolean Algebra

This will generate boolean algebraic expressions for all outputs

This can be accessed via the keyboard shortcut `b`

### Truth Table

This will generate a truth table for the circuit (shows all possible states of the inputs, with the output states)

This can be accessed via the keyboard shortcut `t`

### Export

Attempts to export current circuit to a chip

See `Chip` section for more about chips

# Components

## Inputs

### Toggle Input

Outputs a high (1) or a low (0) signal. Clicking on this component toggles it's output state.

### Push Input

Outputs a low (0) signal, unless component is pressed, in which case it will output a high (1) signal.

### Low

Outputs a constant low (0) signal

### High

Outputs a constant high (1) signal

### Clock

This component switches between on/off (1/0, high/low) states after a specified duration (in milliseconds)

A clocks' speed may be changed by clicking on it, which will bring up a prompt. Signal duration (ms) ranges between 100 - 9999.

### Decimal

Allows a decimal (normal) number to be inputted, and outputs as binary in several output connections. Binary representation LSB is from top-to-bottom.

Click on the component edges to change the number of outputs (And therefore the maximum number which may be inputted)

Click on a digit to increment its value 0-9, and therefore change the binary output.

## Outputs

### Output

Visually shows the signal it is recieving.

### 4-bit output

Takes 4 inputs and calculates binary number, working top-to-bottom (top node = 1, ...).

Outputs as a single hexadecimal digit 0-15 => 0-F.

### Arbitrary-bit output

Takes in an arbitrary number of inputs (in a range) and converts to a decimal number, which is displayed, unlike 4-bit output, as a decimal number (0-9)

To adjust input count, click on the component to bring up a popup.

### ASCII output

Takes 8 inputs and calculates binary number (0-255).

Outputs number in ASCII e.g. 65 -> A.

## Logic Gates

There are 7 logic gates implemented: not, and, or, xor, nor, nand, xnor (see [Here](https://en.wikipedia.org/wiki/Logic_gate) for more)

These components take its inputs, executes the logic function and outputs the return state

## Utility

These serve no purpose other than aiding the user

### Labels

Labels are used to describe a component.

Click on a label and start typing, and press enter or click off the label to stop typing.

Restrictions:
- Limited character length
- Limited characters allowed

#### Bound Labels

Some components (Input, Output) have a bound label. This acts as a label, but cannot be deleted nor moved, but moved with the component.

The bound label acts as an identifier for the Input/Output, should the circuit be exported to an integrated circuit.

### Comment

The comment is able to hold an arbitrary length of text.

To view/edit the comment, click on the component to view a textarea.

## Other

### Data Reader

Stores an array of uint8 numbers internally. Whenever it recieves a high signal from its LHS, its internal pointer will increment, reading out the data at that position.

See circuit `datareader` for an example.

Change data by clicking on the component and enter a comma-seperated list of numerical values.

### Bus: In

Taking N-bit input and pack into a single connection. Connect to `Bus: Out` to extract bits.

### Bus: Out

Extract bits from a numerically packed input from `Bus: In`

# Chips

Chips are circuits which may be included into other circuits

When creating, any toggle/push/constant inputs will be taken as inputs to the chip, and any output components will be taken as the outputs.

When created, the chip will be added to the `Chips` section on the left-hand side menu. *NB this is for the current workspace only*

Chips may be saved by clicking on them in the workspace, or by pressing the floppy disk button in the menu.

Chips mey be uploaded to a workspace via the chips section in the menu, and then be used.

# Keyboard Control

## When workspace is not active

`Ctrl` + `o`:
- Prompt to open a file

## When workspace is active

`Ctrl` + `s`:
- Saves current workspace

`Ctrl` + `Shift` + `s`:
- Opens `Save As` popup

`Ctrl` + `z`:
- Attempt to undo

`Ctrl` + `y`:
- Attempt to redo

`Delete`:

- Over component: **Prompt** to delete component
- Over connection node: Remove all connections to/from node
- Else, simulates press of `Delete` button in menu bar

`b`:
- Over component: Show boolean algebra for that component
- Over input node: Show boolean algebra for the component the connection is coming from
- Over output node: Show boolean algebra for component who's node it is
- Else, show boolean algebra for whole circuit

`t`:
Opens Trace Table popup for...
- A logic gate, if hovering over a logic gate component;
- Or for the entier circuit

`Esc` (escape):
- Attempts to exit/close the current workspace

`Space` (space bar):
- Toggles pause/play on the simulation

# Building Circuits

## Inserting Components

Click on button `Toggle Menu` to show side menu if it is hidden

Click on component to insert. Then click on the canvas to insert the component at that position.

## Moving Components

To move a component, simply click and drag your mouse. Its connections will redraw dynamically

## Deleting Components

Hover over the component in question and press the `Delete` key (above backspace) to bring up the deletion prompt

Then, press `Enter` to confirm deletion, or any other key to cancel

## Creating Connections

Click and drag from an output node (black circle). A connection line will be drawn to your mouse.

Drag the connection line over an input node, and drop to create connection. (if successfuly, will create a black connection line. Else, the line will disappear)

## Removing Connections

To remove a connection, hover over a node which it is connected to (black circle) and press the `Delete` key (above Backspace)

*N.B. This will remove all connections from/to this node*
