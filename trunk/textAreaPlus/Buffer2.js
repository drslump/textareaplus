/*
 Copyright 2005, 2006 Iván Montes

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
*/

/**
 * TextArea+ Frame Buffer class
 * @fileoverview The TAP_Buffer is a class which handles a text buffer using a 
 * 'Line Span' algorithm. 
 *
 * @author Iván -DrSlump- Montes <imontes@netxus.es>
 * @version 0.7
 */


/* 
 * Line and block status constants
 */
var TAP_STATUS_NORMAL = 0;
var TAP_STATUS_CHANGED = 1;
var TAP_STATUS_INSERTED = 2;
var TAP_STATUS_DELETED = 3;
var TAP_STATUS_CONTENT = 4;



/**
 * Instantiates a TAP_Buffer_Block object which represents a block in a line of text
 *
 * @class This class handles a single block in a line of text
 * @see TAP_Buffer_Line
 * @see TAP_Buffer
 *
 * @constructor
 * @param {Integer} offset The number of chars from the start of the line
 * @param {Array} state The parser state at the start of the block
 */
function TAP_Buffer_Block( offset, context ) {
    this.offset = offset;
    this.dirty = TAP_STATUS_NORMAL;
    this.context = context;
};


/**
 * Instantiates a TAP_Buffer_Line object which represents a line of text
 *
 * @class This class handles a single line of text in a text buffer
 * @see TAP_Buffer
 * @see TAP_Buffer_Block
 *
 * @constructor
 * @param {String} txt Optional argument to set the contents of the line
 * @param {Integer} status Optional argument to set the current status of the line
 */
function TAP_Buffer_Line( txt, status ) {
    this.source = typeof(txt) == 'undefined' ? '' : txt;
    this.dirty = typeof(status) == 'undefined' ? TAP_STATUS_INSERTED : status;
    this.blocks = [];
    this.state = [];    
};





/**
 * Setup the buffer so we can use it
 * 
 * @class This class handles a text buffer using the 'Line Span' method
 * @see Tap_Buffer_Line
 * @see Tap_Buffer_Block
 * 
 * @constructor
 */
function TAP_Buffer() {
	//initialize variables
	this.lines = new Array();	
	this.charCount = 0;
	this.cursorRow = 0;
	this.cursorCol = 0;	
	this.marks = new Object();
	this.marksFixed = new Object();
}

/**
 * Replaces the contents of the buffer with the content of the parameter
 * 
 * @param String str	The new contents for the buffer
 */
TAP_Buffer.prototype.read = function( /** String */ str )
{
	this.clear();
	this.insert( str );
}
		
/**
 * Returns an string with the contents of the buffer as UTF-16
 * 
 * @return String	The contents of the buffer as a JavaScript string
 */	
TAP_Buffer.prototype.write = function()
{
	var /** String */ s = '';
	for (var i=0; i<this.lines.length; i++)
	{
		s += this.lines[i].source + '\n';
	}
	return s;
}

/**
 * Empties the buffer
 * 
 */
TAP_Buffer.prototype.clear = function()
{
	delete this.lines;
	delete this.marks;
	delete this.marksFixed;
	
	this.lines = new Array();
	this.marks = new Object();
	this.marksFixed = new Object();
}

/**
 * Adds an internal mark at the current position
 * 
 * @param String name	The new name
 * @param Boolean fixed	Optional param which if true creates a fixed mark
 * @return Boolean True on success or False if the name is already taken
 */
TAP_Buffer.prototype.addMark = function( /** String */ name, /** Boolean */ fixed )
{
	name = '_mark_' + name;
	
	if (typeof this.marks[name] != 'undefined' ||
		typeof this.marksFixed[name] != 'undefined')
		return false;

	if (fixed)		
		this.marksFixed[name] = [ this.cursorRow, this.cursorCol ];
	else
		this.marks[name] = [ this.cursorRow, this.cursorCol ];
		
	return true;
}

/**
 * Adds an internal mark at the current position which won't have it's position updated
 * 
 * @param String name	The new name
 * @return Boolean True on success or False if the name is already taken
 */
TAP_Buffer.prototype.addFixedMark = function( /** String */ name )
{
	return this.addMark( name, true );
}

/**
 * Remove a previously added mark
 * 
 * @param String name	The mark name to remove
 * @return Boolean True on success or False if the name doesn't exists
 */
TAP_Buffer.prototype.removeMark = function( /** String */ name )
{
	name = '_mark_' + name;
	
	if (typeof this.marks[name] != 'undefined')
		return delete this.marks[name];
	else if (typeof this.marksFixed[name] != 'undefined')
		return delete this.marksFixed[name];
	else
		return false;
}

/**
 * Get the current position of the mark
 * 
 * @param String name	The mark name
 * @return Array	An array with two values: Column and Row
 */
TAP_Buffer.prototype.getMark = function( /** String */ name )
{
	name = '_mark_' + name;
	
	if (typeof this.marks[name] != 'undefined')
		return this.marks[name];
	else if (typeof this.marksFixed[name] != 'undefined')
		return this.marksFixed[name];
	else
		return false;
}

/**
 * Returns a list of mark names
 * 
 * @return Array	An array with the available mark names
 */
TAP_Buffer.prototype.getMarks = function()
{
	var arr = new Array();

	for (var i in this.marks)
		if (i.substr(0,6) == '_mark_')
			arr.push( i.substr(6) );
			
	for (var i in this.marksFixed)
		if (i.substr(0,6) == '_mark_')
			arr.push( i.substr(6) );
	
	return arr;
}

/**
 * Positions the internal cursor
 * 
 * @param Number row	The buffer row
 * @param Number col	The buffer col
 * @return Boolean	True on success False if position outside the limits
 */
TAP_Buffer.prototype.setCursor = function( /** Number */ row, /** Number */ col )
{
	if (row < 0 ||
		col < 0 || 
		row > this.lines.length ||
		col > (this.lines[row] ? this.lines[row].source.length : 0) )
		return false;
	
	this.cursorRow = row;
	this.cursorCol = col;
	return true;
}	

/**
 * Returns the current cursor position
 * 
 * @return Array	The current row and column as an array
 */
TAP_Buffer.prototype.getCursor = function()
{
	return [ this.cursorRow, this.cursorCol ];
}	

/**
 * Positions the internal cursor based on the current position
 * 
 * @param Number rows	The number of rows to move: negative up, positive down
 * @param Number cols	The number of columns to move: negative left, positive right
 * @return Boolean	True on success False if position outside the limits
 */
TAP_Buffer.prototype.moveCursor = function( /** Number */ rows, /** Number */ cols )
{
	return this.setCursor( this.cursorRow + rows, this.cursorCol + cols );
}


/**
 * Returns the current character
 * 
 * @return String	The current character
 */		
TAP_Buffer.prototype.getChar = function()
{
	return this.getString( 1 );
}

/**
 * Returns the current line
 * 
 * @return String	The current line
 */
TAP_Buffer.prototype.getLine = function()
{
	return this.lines[this.cursorRow] ? this.lines[this.cursorRow].source : '';
}

/**
 * Returns a string of N chars from the from the current position
 * 
 * @param Number cnt	The number of chars to get
 * @return String	The string
 */
TAP_Buffer.prototype.getString = function( /** Number */ cnt )
{
	//TODO
}
		
/**
 * Return the number of chars in the buffer
 * 
 * @return Number	The number of chars
 */
TAP_Buffer.prototype.getCharCount = function()
{
	return this.charCount + this.getLineCount();
}


/**
 * Returns the number of lines in the buffer
 * 
 * @return Number	The number of lines
 */
TAP_Buffer.prototype.getLineCount = function()
{
	return this.lines.length;
}		
		




/**
 * Inserts a string in the buffer
 * 
 * @param String str	The string to insert
 */
TAP_Buffer.prototype.insert = function( /** String */ str )
{
	//TODO
}

/**
 * Removes N chars from the buffer
 * 
 * @param Number cnt	The number of chars to remove
 */
TAP_Buffer.prototype.remove = function( /** Number */ cnt )
{
	//TODO
}
