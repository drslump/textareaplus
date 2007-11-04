/* $Id$

Script: TextArea.js

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
    
    copyright (c) 2005-2007 Ivan Montes <http://blog.netxus.es>
*/


/*
Class: TAP.Renderer.TextArea
    This renderer class displays the text in a textarea html element
	
See Also:
    <TAP.Renderer>
*/
TAP.Renderer.TextArea = function( editor ) {
    var area;


    area = document.createElement('TEXTAREA');
    area.style.width = '100%';
    area.style.height = '300px';
    area.addEventListener( 'keypress', function(e){ editor.keyHandler(e); }, false );    
    document.body.appendChild( area );


    this.render = function(buffer) {
        var i, l,
            s = '',
            pos = 0;
        
        var li, ul = document.getElementById('lines');
        while (ul.firstChild) {
            ul.removeChild( ul.firstChild );
        }
        
        for (i=0; i<buffer.lines.length; i++) {
            l = buffer.lines[i];
            if (l.state === TAP.Line.REMOVED) {
                buffer.removeLine(i);
                i--;
                continue;
            }
            
            if ( i < buffer.row )
                pos += l.getLength() + 1;
            
            s += l; // this actually calls l.toString which is an alias of l.getRaw
            
            li = document.createElement('LI');
            li.appendChild(
                document.createTextNode( l.getRaw().replace('\n', '\\n') )                    
            );
            ul.appendChild( li );
        }
        
        pos += buffer.column;
        
        area.value = s;
        area.setSelectionRange( pos, pos );
        
        buffer.dirty = false;
    }
}