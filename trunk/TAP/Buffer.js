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
    lexer   - (optional) a lexer definition object
*/
TAP.Buffer = function ( /** String */ txt, /** Object */ lexer ) {

    // Initialize some variables
    this.lines = [];
    this.column = this.row = this.charCount = 0;
    this.tab = '   ';
    this.newLine = '\n';
    this.lexer = null;
    
    this.setContents( String(txt) );
    
    if (typeof lexer === 'object')
        this.setLexer( lexer );
}

/*
Property: clear
    Clears all the contents from the buffer
*/
TAP.Buffer.prototype.clear = function()
{
    this.column = this.row = this.charCount = 0;    
    this.lines = [];
	this.lines.push( new TAP.Line(this) );
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
	this.lines = [];
    
	if ( !txt.length )
		txt = ' ';

    while ( (m = re.exec(txt)) !== null) {
        
        l = new TAP.Line( this, m[0] );
        
        this.charCount += l.getLength();
        
        this.lines.push(l);
    }    
}

/*
Propery: getContents
    Fetches the raw text in this buffer as a UTF-16

Returns:
    A string with the full contents of the buffer
*/
TAP.Buffer.prototype.getContents = function() {
    var i, s = '';
        
    for (i=0; i<this.lines.length; i++) {
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
    return this.lines.length;
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
	
		console.log('ERROR SETTING CURSOR');
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
    if (typeof ln === 'undefined')
        ln = this.row;
    
    return this.lines[ln];
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
				this.lines.splice( row+1, 0, l );
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

	return [ row, col ];
}

/*
Property: remove
    Removes a chunk of chars from the buffer
    
Arguments:
    pos     - An integer with the position where to start removing
    len     - An integer with the number of chars to remove
*/
TAP.Buffer.prototype.remove = function( /** Number */ pos, /** Number */ len ) {
    throw('TAP.Buffer.remove is not implemented yet');
}
