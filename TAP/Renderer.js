/*
Script: Renderer.js

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
Class: TAP.Renderer
    An abstract class which serves as a base to implement specialized renderers
	
See Also:
    <TAP.Buffer>, <TAP.Line>
*/
TAP.Renderer = function() {
    throw('TAP.Renderer is an abstract class, it has to be extended to be used');
}

/*
Property: render
    Updates the output according to the changes on the buffer
*/
TAP.Renderer.prototype.render = function() {
    
}