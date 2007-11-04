/*  $Id$

Script: Line.js

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
Class: TAP.Line
    A class which represents a single line from a text buffer
	
See Also:
    <TAP.Buffer>
	
Arguments:
    buffer  - a TAP.Buffer object
    txt     - string: (optional) the initial contents for the line
*/
TAP.Line = function ( /** TAP.Buffer */ buffer, /** String */ txt ) {

    this.buffer = buffer;
    this.state = TAP.Line.NEW;

    // indent, text, eol are initialized in clear()    
    this.setRaw( typeof txt === 'string' ? txt : '' );    
}

// Line states constants
TAP.Line.NORMAL = 0;
TAP.Line.CHANGED = 1;
TAP.Line.NEW = 2;
TAP.Line.REMOVED = 3;    


/*
Propery: getRaw
    Fetches the full text from this line including indentation and EOL

Returns:
    A string with the full text of this line
*/
TAP.Line.prototype.getRaw = TAP.Line.prototype.toString = function() {
    return this.indent + this.text + this.eol;
}

/*
Propery: setRaw
    Sets the text for this line taking care of indentation and EOL

Arguments:
    txt     - A string with the new text for the line
*/
TAP.Line.prototype.setRaw = function( /** String */ txt ) {
    var m = txt.match(/^([ \t]*)(.*?)(\r\n|\r|\n)?$/m);

    this.indent = m[1] ? m[1] : '';
    this.text = m[2] ? m[2] : '';
    this.eol = m[3] ? m[3] : '';//this.buffer.eol;

    if (this.state === this.NORMAL)
        this.state = this.CHANGED;
}

/*
Property: getLength
    Obtains the total length of the line including indentation

Returns:
    An integer with the length
*/
TAP.Line.prototype.getLength = function() {
    return this.indent.length + this.text.length;
}


/*
Property: insert
    Inserts a new chunk of text into the line at the given position

Arguments:
    pos     - An integer with the position where to start inserting
    txt     - The string to insert
*/
TAP.Line.prototype.insert = function( /** Number */ pos, /** String */ txt ) {    
    var s;

    if (pos < this.indent.length) {        
        this.indent = this.indent.substr(0, pos);
        if ( (s = txt.match(/^\s+/)) ) {
            this.indent += s;
            txt = txt.substr( s.length );
	}
        pos = 0;
    } else {        
        pos -= this.indent.length;
    }
        
    if (txt.length) {
        
        s = this.text.substr(0, pos);
        s += txt;
        this.text = s + this.text.substr(pos);
        
    }
    
    if (this.state === TAP.Line.NORMAL)
        this.state = TAP.Line.CHANGED;
}

/*
Property: remove
    Removes part of the contents of the line
    
Arguments:
    pos     - An integer with the position where to start removing
    len     - the number of chars to remove

Returns:
    A string with the contents that has been removed
*/
TAP.Line.prototype.remove = function( /** Number */ pos, /** Number */ len ) {
    var s = '';
    
    if (pos < this.indent.length) {        
        s = this.indent.substr( pos, len );
        len -= s.length;
        this.indent = this.indent.substr( 0, pos );
        pos = 0;
    } else {
        pos -= this.indent.length;
    }

    if (len > 0) {		
        s += this.text.substr( pos, len );
        this.text = this.text.substr( 0, pos ) + this.text.substr( pos+len );
    }
    
    if (this.state === TAP.Line.NORMAL)
        this.state = TAP.Line.CHANGED;
    
    return s;
}
