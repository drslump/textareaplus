/* $Id$
  
Script: TAP.js

    TextAreaPlus 0.1 - A source code text editor in Javascript

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
Class: TAP
    TextAreaPlus main class and namespace container

Example:
	(start code)
	var editor = new TAP();
	(end)
*/
function TAP() {

    this.renderer = null;    
    this.activeBuffer = null;

    var $this = this;

    /*
    Property: render
        Basically just takes care of calling the choosen renderer render function
    */
    this.render = function() {
        $this.renderer.render( $this.activeBuffer );
    }

    /*
    Property: keyHandler
        To be used as a key event handler
    
    Arguments:
        e       - the key event to analyze
    */
    this.keyHandler = function(e) {
    
        switch ( e.keyCode ) {
            
            case 8: // backspace
                var pos = $this.activeBuffer.remove( -1 );
                $this.activeBuffer.setCursor( pos[0], pos[1] );
            break;
            case 46: // supr
                var pos = $this.activeBuffer.remove( 1 );
                //buffer.setCursor( pos[0], pos[1] );
            break;
            case 13: // enter
                var pos = $this.activeBuffer.insert( '\n' );
                $this.activeBuffer.setCursor( pos[0], pos[1] );            
            break;
        
            case 33: // pgUp
                $this.activeBuffer.moveCursor( -20, 0 );
            break;
            case 34: // pgDown
                $this.activeBuffer.moveCursor( 20, 0 );
            break;
        
            case 37: // left
                $this.activeBuffer.moveCursor( 0, -1 );
                console.log('%d,%d', $this.activeBuffer.row, $this.activeBuffer.column);
            break;
            case 38: // up
                $this.activeBuffer.moveCursor( -1, 0 );
            break;
            case 39: // right
                $this.activeBuffer.moveCursor( 0, 1 );
            break;
            case 40: // down
                $this.activeBuffer.moveCursor( 1, 0 );
            break;
        
            default:
                if (e.charCode && !e.ctrlKey && !e.metaKey) {			
                    var s = String.fromCharCode(e.charCode);
                    $this.activeBuffer.insert( s );
                    $this.activeBuffer.moveCursor( 0, s.length );			
                } else {
                    console.log('keyCode: %d - charCode: %d', e.keyCode, e.charCode );
                }             
        }
    };


}
