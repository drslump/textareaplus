/*  $Id$
   
Script: Buffer.js

    TextArea+ 0.1 - A source code text editor in Javascript

License:

    The GNU General Public License version 3 (GPLv3)

    This file is part of TextArea+.

    TextArea+ is free software; you can redistribute it and/or modify it under 
    the terms of the GNU General Public License as published by the Free Software
    Foundation; either version 2 of the License, or (at your option) any later 
    version.
    
    TextArea+ is distributed in the hope that it will be useful, but WITHOUT ANY 
    WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR 
    A PARTICULAR PURPOSE. See the GNU General Public License for more details.
    
    You should have received a copy of the GNU General Public License along with 
    TextArea+; if not, write to the Free Software Foundation, Inc., 51 Franklin 
    Street, Fifth Floor, Boston, MA 02110-1301, USA
    
    See bundled license.txt or check <http://www.gnu.org/copyleft/gpl.html>

Copyright:
    
    copyright (c) 2005, 2006, 2007 Ivan Montes <http://blog.netxus.es>
*/


/*
Class: TAP.Buffer
    A class which represents a text document using the _Line Span_ method
	
See Also:
    <TAP.Line>
	
Arguments:
    txt     - string: (optional) the initial contents for the buffer
*/
TAP.Buffer = function ( /** String */ txt ) {

    // Initialize some variables
    this.lines = [];
    
    this.tab = '   ';
    this.newLine = '\n';

    // column, row, charCount, dirty are initialized in the following function call
    this.setContents( typeof(txt) === 'string' ? txt : '' );    
}

/*
Property: clear
    Clears all the contents from the buffer
*/
TAP.Buffer.prototype.clear = function()
{
    var i;
    
    this.column = this.row = this.charCount = 0;
    
    for (i=0; i<this.lines.length; i++) {
        this.lines.state = TAP.Line.REMOVED;
    }
    
    // we need to have at least a line in the buffer
    this.lines.push( new TAP.Line(this) );
    this.dirty = true;
}

/*
Property: setContents
    Replace the contents of the buffer with the one supplied
    
Arguments:
    txt     - a string with the new contents for this buffer
*/
TAP.Buffer.prototype.setContents = function( /** String */ txt ) {
    
    var re = /^.*(\r\n|\r|\n)?$/g,
        m, l;
    
    this.clear();
    // remove the blank line inserted by clear() since we are going to add lines
    this.lines.pop();
    
    if ( !txt.length )
	txt = ' ';

    while ( (m = re.exec(txt)) !== null) {
        
        l = new TAP.Line( this, m[0] );
        
        this.charCount += l.getLength();
        
        this.lines.push(l);
    }
    
    this.dirty = true;
}

/*
Propery: getContents
    Fetches the raw text in this buffer as a UTF-16

Returns:
    A string with the full contents of the buffer
*/
TAP.Buffer.prototype.getContents = TAP.Buffer.prototype.toString = function() {
    var i, s = '';

    for (i=0; i<this.lines.length; i++) {
        if (this.lines[i].state !== TAP.Line.REMOVED)
            s += this.lines[i].getRaw();
    }

    return s;
}

/*
Property: getCharCount
    Finds the total number of characters in the buffer
    
Returns:
    An integer with the number of chars
*/
TAP.Buffer.prototype.getCharCount = function() {
    return this.charCount;
}

/*
Property: getLineCount
    Finds the total number of lines in the buffer
    
Returns:
    An integer with the number of lines
*/
TAP.Buffer.prototype.getLineCount = function() {
    var i, j;
    
    for (i=0,j=0; i<this.lines.length; i++) {
        if (this.lines[i].state !== TAP.Line.REMOVED)
            j++;
    }
    
    return j;
}

/*
Property: setCursor
    Positions the buffer cursor
    
Arguments:
    row     - An integer indicating the new row position
    col     - An integer indicating the new column position

Returns:
    true if the new position was set properly, false otherwise
*/
TAP.Buffer.prototype.setCursor = function( /** Number */ row, /** Number */ col ) {
    
    if (row < 0 || col < 0 || 
        row >= this.getLineCount() ||
        col > this.lines[row].getLength()) {
	
	return false;
    }
    
    this.row = row;
    this.column = col;
    return true;
}

/*
Property: moveCursor
    Positions the buffer cursor based on the current position
    
Arguments:
    rows    - An integer with the number of rows to move: negative goes up, positive down
    cols    - An integer with the number of cols to move: negative goes up, positive down

Returns:
    true on success, false on failure
*/
TAP.Buffer.prototype.moveCursor = function( /** Number */ rows, /** Number */ cols ) {
    return this.setCursor( this.row + rows, this.column + cols );    
}


/*
Property: getLine
    Fetches a TAP.Line object used in this buffer. If no argument is passed
    then it returns the current line.
    
Arguments:
    ln      - (optional) A integer indicating the line number to get.

Returns:
    a TAP.Line object for the given line
*/
TAP.Buffer.prototype.getLine = function( /** Number */ ln ) {
    var i, j;
    
    if (typeof ln === 'undefined')
        ln = this.row;
    
    for (i=0,j=0; j<ln && i<this.lines.length; i++) {
        if (this.lines[i].state !== TAP.Line.REMOVED)
            j++;
    }
    
    return this.lines[j];
}

/*
Property: insertLine
    Inserts a new line object at the given row
    
Arguments:
    row     - An integer with the row where to insert the new line
    line    - The TAP.Line object to add
*/
TAP.Buffer.prototype.insertLine = function( /** Number */ row, /** TAP.Line */ line ) {
    var i, j;
    
    for (i=0,j=0; j<row && i<this.lines.length; i++) {
        if (this.lines[i].state !== TAP.Line.REMOVED)
            j++;
    }
    
    this.lines.splice( j, 0, line );
}

/*
Property: removeLine
    Removes a line from the buffer based on the line index
    
Arguments:
    idx     - An integer indicating the array index of the line to remove
*/
TAP.Buffer.prototype.removeLine = function( /** Number */ idx ) {
    // lets do some clean up just in case it helps with garbage collection
    this.lines[idx].buffer = null;
    delete this.lines[idx];
    this.lines.splice( idx, 1 );

    // We have to be sure to have at least a blank line (which is not flagged as
    // removed) in the buffer
    if (!this.getLine(0)) {
        this.lines.push( new TAP.Line(this) );
    }
}

/*
Property: insert
    Inserts a string at the current buffer position
    
Arguments:
    txt     - The string to insert 

Returns:
	An array with the row (index 0) and column (index 1) whith the last position of 
	the cursor after finishing the insert opertion. This can be handy to update the buffer
	cursor position acordingly. 
*/
TAP.Buffer.prototype.insert = function( /** String */ txt ) {
    var re, m, l, 
        remaining = '', 
        col, 
	row = this.row;
    
    if ( txt.search(/[\r\n]/) !== -1 ) {
        row = this.row;
        re = /(.*?)(\r\n|\r|\n|$)/g;
        re.lastIndex = 0;
        while ( (m = re.exec(txt)) !== null ) {
            // if we have processed all the lines we exit the loop
            if (!m[0].length) {
                console.log(m);
                break;
            }

            l = this.getLine(row);
            if (l.getLength()) {
                console.log('Inserting text at row: ' + row);
                remaining = l.remove( this.column, l.getLength() );
                l.insert( m[1], this.column );
                this.charCount += m[1].length;                

		// set the new line defined in the inserted char
		l.newLine = m[2];
            } else {
                console.log('Continue inserting at row: ' + row + ' M0: ' + m[0].replace(/[\n\r]/, '#'));
		l.setRaw( m[0] );
		this.charCount += l.getLength;
            }
            
            if (m[2]) {
                console.log('Adding new line at row: ' + row);
                l = new TAP.Line( this );
                this.insertLine( row+1, l );
                row++;
            }	
        }
        
	col = l.getLength();

        // add the remaining text which was cutted when adding a new line
        if ( remaining.length ) {
            console.log('Adding the remaining text at row: ' + row);
            l = this.getLine(row);
            l.insert( remaining, l.getLength() );
            col += remaining.length;
        }
        
    } else {
        
        // simple char insertion
        this.charCount += this.getLine().insert( txt, this.column );
        col = this.column + txt.length;
    }    

    this.dirty = true;

    return [ row, col ];
}

/*
Property: remove
    Removes a chunk of chars from the buffer
    
Arguments:
    length  - An integer with the number of chars to remove, if it's negative
              then the chars are removed backwards
*/
TAP.Buffer.prototype.remove = function( /** Number */ length ) {
    var l, coords,
        len = length,
        row = this.row,
        col = this.column;
    
    if (len < 0) {
        
        console.log('Remove: Starting negative processing: row: %d, col: %d, length: %d', row, col, len);
        
        // make it a positive integer
        len = -len;
        
        // find the line where to start removing
        while( col-len < 0 ) {
            
            l = this.getLine( row-1 );
            if (!l) {
                console.log('Removing chars has reached the top of the buffer');
                break;
            }
            
            row--;
            len -= col;
            col = l.getLength() + 1;
        }
        
        col -= len;
        length = -length;
        
        console.log('Remove: Finished negative processing: row: %d, col: %d, length: %d', row, col, length);
    }

    coords = [ row, col ];
    
    while ( length > 0 ) {
        
        l = this.getLine(row);
        if (!l) {
            console.log('Removing chars has reached the bottom of the buffer');
            break;
        }
        
        len = l.getLength() + 1;

        console.log('Remove: Removing: row: %d, col: %d, length: %d, line length: %d', row, col, length, len );
        
        if ( len <= length-col ) {
            
            console.log('Remove: Removing line');
            length -= len;
            l.state = TAP.Line.REMOVED;
            col = 0;
            row++;
            
        } else {
            
            l.remove( col, length );
            col = length;
            length = 0;
            
        }  
    }
    
    this.dirty = true;

    return coords;
}
