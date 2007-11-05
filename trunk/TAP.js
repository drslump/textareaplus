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
        if ($this.activeBuffer.dirty)
            $this.renderer.render( $this.activeBuffer );
    }


    this.actions = {
	'BackRemoveChar': function(editor) {
	    var pos = editor.activeBuffer.remove( -1 );            
	    editor.activeBuffer.setCursor( pos[0], pos[1] );
	},	
	'RemoveChar'	: function(editor) {
            editor.activeBuffer.remove( 1 );
	},	
        'Indent'	: function(editor) {
            var pos = editor.activeBuffer.insert( editor.activeBuffer.tab );
            editor.activeBuffer.setCursor( pos[0], pos[1] );
	},	
        'NewLine'	: function(editor) {
            var pos = editor.activeBuffer.insert( editor.activeBuffer.eol );
            editor.activeBuffer.setCursor( pos[0], pos[1] );            
	},	
	'MovePageUp'	: function(editor) {
            editor.activeBuffer.moveCursor( -20, 0 );
	},
	'MovePageDown'	: function(editor) {
            editor.activeBuffer.moveCursor( 20, 0 );
	},
	
	'MoveLineEnd'	: function(editor) {
	    editor.activeBuffer.moveCursor( 0, 10000000 );
	},
	'MoveLineStart'	: function(editor) {
	    editor.activeBuffer.moveCursor( 0, -10000000 );
	},	
        'MoveLeft'	: function(editor) {
            editor.activeBuffer.moveCursor( 0, -1 );
	},
        'MoveUp'	: function(editor) {
            editor.activeBuffer.moveCursor( -1, 0 );
	},
	'MoveRight'	: function(editor) {
            editor.activeBuffer.moveCursor( 0, 1 );
	},
	'MoveDown'	: function(editor) {
	    editor.activeBuffer.moveCursor( 1, 0 );
	},
	'MoveDocStart' 	: function(editor) {
	    editor.activeBuffer.setCursor( 0, 0 );    
	},
	'MoveDocEnd' 	: function(editor) {
	    editor.activeBuffer.moveCursor( 10000000, 10000000 );    
	}	
    }

    this.keyMap = {	
        '#8'	: 'BackRemoveChar',	
	'#46'	: 'RemoveChar',	
        '#9'	: 'Indent',	
        '#13'	: 'NewLine',
	'#33'	: 'MovePageUp',
	'#34'	: 'MovePageDown',
	'#35'	: 'MoveLineEnd',
	'#36'	: 'MoveLineStart',
	'#37'	: 'MoveLeft',
	'#38'	: 'MoveUp',
	'#39'	: 'MoveRight',
	'#40'	: 'MoveDown',
	'C+#37'	: 'MoveLineStart',
	'C+#39' : 'MoveLineEnd',
	'C+#36' : 'MoveDocStart',
	'C+#35' : 'MoveDocEnd'	
    };


    /*
    Property: keyHandler
        To be used as a key event handler
    
    Arguments:
        e       - the key event to analyze
    */
    this.keyHandler = function(e) {
        var charStr, shortcut,
	    mod = [];
	
	/*
	// skip the alt+Numpad since it's used to define chars by their code
	if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.altKey && e.charCode >= 38 && e.charCode <= 57)
	    return
	*/
    
	if (e.shiftKey) mod.push('S');
	if (e.altKey) mod.push('A');
	if (e.ctrlKey) mod.push('C');
	if (e.metaKey) mod.push('M'); // Only for Macs
        
	if (e.charCode) {
	    // In the shortcuts we use upper cased chars
	    charStr = String.fromCharCode( e.charCode );
	    mod.push( charStr.toUpperCase().charCodeAt(0) );
	} else if (e.keyCode) {
	    // Special keys like arrows, tab, enter...
	    mod.push( '#' + e.keyCode );
	}
	
	shortcut = mod.join('+');
	console.log('ShortCut: %s', shortcut);
	
	if (this.keyMap[ shortcut ]) {
	    if ( !this.actions[ this.keyMap[shortcut] ]( this ) ) {
		// Cancel default action for this shortcut
		e.preventDefault();
		e.stopPropagation();
		e.returnValue = false;
	    }
	} else if ( e.charCode && !e.ctrlKey && !e.metaKey ) {
	    // insert character
	    charStr = String.fromCharCode(e.charCode);
	    var pos = $this.activeBuffer.insert( charStr );
	    console.log('POS: %d,%d', pos[0],pos[1]);
	    $this.activeBuffer.setCursor( pos[0], pos[1] );
	    
	} else {
	    
	    console.log('Unhandled shortcut: %s', shortcut);
	}
	
	// to debug force the buffer dirty even if it's not
	this.activeBuffer.dirty = true;
    };


}
