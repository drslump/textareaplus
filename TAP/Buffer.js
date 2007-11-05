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
    this.eol = '\n';

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
    var l = this.getLine(row);
    
    if (typeof l === 'object' &&
        row >= 0 &&
        col >= 0 &&
        row < this.getLineCount() &&
        col <= l.getLength()) {
	
	this.row = row;
	this.column = col;
	return true;
    }
    
    return false;
}

/*
Property: moveCursor
    Positions the buffer cursor based on the current position. If the final position
    is out of bounds it will set the cursor to the nearest limit
    
Arguments:
    rows    - An integer with the number of rows to move: negative goes up, positive down
    cols    - An integer with the number of cols to move: negative goes up, positive down
*/
TAP.Buffer.prototype.moveCursor = function( /** Number */ rows, /** Number */ cols ) {
    
    this.row += rows;
    this.column += cols;
    
    if (this.row < 0) {
        this.row = 0;
    } else if (this.row >= this.getLineCount()) {
        this.row = this.getLineCount()-1;
    }
    
    if (this.column < 0) {
        this.column = 0;
    } else if (this.column > this.getLine(this.row).getLength()) {
        this.column = this.getLine(this.row).getLength();
    }
    
    console.log('moveCursor: %d,%d', this.row, this.column );
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
    
    if (typeof this.lines[ln] === 'undefined')
        return null;
    
    for (i=0,j=0; j<ln && i<this.lines.length; i++) {
        if (this.lines[i].state !== TAP.Line.REMOVED)
            j++;
    }
    
    return this.lines[i];
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
        col = this.column,
	row = this.row;
    
    if ( txt.search(/[\r\n]/) !== -1 ) {
        re = /(.*?)(\r\n|\r|\n|$)/g;
        re.lastIndex = 0;
        while ( (m = re.exec(txt)) !== null ) {
            // if we have processed all the lines we exit the loop
            if (!m[0].length) {
                break;
            }

            l = this.getLine(row);
            if (l.getLength()) {
                console.log('Inserting text at row: ' + row);
                remaining = l.remove( col, l.getLength() );
                l.insert( this.column, m[1] );
                this.charCount += m[1].length;                

                // set the new line defined in the inserted char
                l.eol = m[2];
            } else {
                console.log('Continue inserting at row: ' + row + ' M0: ' + m[0].replace(/[\n\r]/, '#'));
                l.setRaw( m[0] );
                this.charCount += l.getLength;
            }
            
            if (m[2]) {
		console.log(m);
                console.log('Adding new line at row: ' + row);
                row++;
                l = new TAP.Line( this );
                this.insertLine( row, l );
            }	
        }
        
	col = l.getLength();

        // add the remaining text which was cutted when adding a new line
        if ( remaining.length ) {
            console.log('Adding the remaining text at row: ' + row);
            l = this.getLine(row);
            l.insert( l.getLength(), remaining );
            //col += remaining.length;
        }
        
    } else {
        
        // simple char insertion
        this.charCount += this.getLine().insert( this.column, txt );
        col = this.column + txt.length;
    }    

    this.dirty = true;
 
    console.log('Row: %d, Col: %d', row, col);
 
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
    var l, nl, coords, lineLen, len,
        row = this.row,
        col = this.column;
    
    // we are going to handle negative lengths by calculating the top most coordinates
    // and then follow a single code path to perform the removal
    if (length < 0) {
        // make it a positive integer
        length = -length;
        
        console.log('Remove: Starting negative processing: row: %d, col: %d, length: %d', row, col, length);
        
        if ( col >= length ) {
            
            col -= length;
            
        } else {
            
            len = length;            
            do {
                len -= col;
                
                l = this.getLine(--row);
                if (!l) {
                    console.log('Removing chars has reached the top of the buffer');
                    length -= len;
                    row = len = 0;
                    break;
                }
                col = l.getLength() + 1;
            } while ( col < len );
            col -= len; 
        }
        
        console.log('Remove: Finished negative processing: row: %d, col: %d, length: %d', row, col, len);
    }

    // store coordinates to return it at the end of the process
    coords = [ row, col ];

    // mark the buffer as dirty since we have removed some chars
    this.dirty = true;
    
    
    while ( length > 0 ) {
        
        l = this.getLine(row);
        if (!l) {
            console.log('Removing chars has reached the bottom of the buffer');
            break;
        }
        
        // get line length including the EOL
        lineLen = l.getLength();
        
        console.log('Remove: Removing: row: %d, col: %d, length: %d, line length: %d', row, col, length, lineLen );
        
        // check if we just want to remove a chunk from the current line
        if ( length <= (lineLen-col)) {
        
            l.remove( col, length );
            break;
        
        // we have to remove stuff from the line below
        } else {
            
            // this is a special case, when we remove a whole line just mark it as
            // removed from the buffer which is much faster
            if ( !col ) {
                l.state = TAP.Line.REMOVED;                
            }   
            // if we need to keep a portion of the current line
            else {
                // remove the part not needed from the line
                l.remove( col, lineLen-col );
                
                // append the line below to the current line
                nl = this.getLine( row+1 );
                if ( nl ) {
                    l.eol = nl.eol;
                    l.insert( col, nl.indent + nl.text );
                    console.log('NL: "%s" "%s"', nl.indent.replace(/[\r\n]/, '#'), nl.text)
                    nl.state = TAP.Line.REMOVED;
                    row++;
                } else {
                    l.eol = '';
                    break;
                }
            }
            
            length -= lineLen - col + 1;
        }
    }    

    return coords;
}

