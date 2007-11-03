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

/*
 Renderer 
*/

/*
    It's better to only use the control key. IE makes the item lose the
    focus when the ALT key is pressed, since it's used to access the menú from the keyboard.
*/
var TAPDefaultKeymap = [
		{ shortcut: '#8'				/* backsp */, action: 'BackRemoveChar' },
		{ shortcut: '#9' 			 	/* tab */		, action: 'Tab' },
		{ shortcut: '#13' 			/* enter */	, action: 'NewLine' },
		{ shortcut: '#33'				/* RePg */	, action: 'ScrollPageUp' },
		{ shortcut: '#34'				/* AvPg */	, action: 'ScrollPageDown' },
		{ shortcut: '#38' 			/* up */		,	action: 'MoveCursorUp' },
		{ shortcut: '#40' 			/* down */	, action: 'MoveCursorDown' },
		{ shortcut: '#37'				/* left */	, action: 'MoveCursorLeft' },
		{ shortcut: '#39' 			/* right */ , action: 'MoveCursorRight' },
		{ shortcut: '#35' 			/* end */		, action: 'MoveEndLine' },
		{ shortcut: '#36' 			/* home */ 	, action: 'MoveStartLine' },
		{ shortcut: '#46' 			/* supr */  , action: 'RemoveChar' },
		
		{ shortcut: '#45' 			/* ins */		, action: 'ToggleInsertMode' },	
		
		{ shortcut: 'CTRL+#36'	/* home */	, action: 'MoveStartDoc' },
		{ shortcut: 'CTRL+#35' 	/* end */		, action: 'MoveEndDoc' },
		{ shortcut: 'CTRL+#38' 	/* up */		, action: 'ScrollLineUp' },
		{ shortcut: 'CTRL+#40' 	/* down */	, action: 'ScrollLineDown' },
		{ shortcut: 'CTRL+71' 	/* G */			, action: 'GoToLine' },
		{ shortcut: 'CTRL+86' 	/* V */			, action: 'PasteClipboard' },
		
		{ shortcut: 'CTRL+90'   /* Z */    , action: 'Undo' },
		{ shortcut: 'CTRL+89'   /* Y */ , action: 'Redo' },
		
		{ shortcut: 'CTRL+72'   /* H */     , action: 'ToggleHiddenChars' }
];


/*
	if they return false the event propagation will be stopped
*/
var TAPDefaultActions = {
    'Undo' : function (o)
    {
        if (o.buffer.undo.undo())
        {
            o.render();
            o.GoTo( o.buffer.cursorRow, o.buffer.cursorCol );
        }
        
        return false;    
    },    
    'Redo' : function (o)
    {
        if (o.buffer.undo.redo())
        {
            o.render();
            o.GoTo( o.buffer.cursorRow, o.buffer.cursorCol );
        }
        
        return false;    
    },    
    'MoveStartDoc' : function (o)
    {
        o.GoTo(0,0); 
        return false;
    },
    'MoveEndDoc' : function (o) 
    { 
        o.GoTo(1000000, 100000); 
        return false;
    },
    'Tab' : function (o) 
    {
        o.buffer.insertChars( o.tab );
        o.render();
        o.GoToRel( 0, o.tab.length );
        return false;
    },
    'ScrollLineUp' : function (o) 
    {
        o.ul.scrollTop = o.ul.scrollTop - o.charH;
        return false;
    },
    'ScrollLineDown' : function (o) 
    {
        o.ul.scrollTop = o.ul.scrollTop + o.charH;
        return false;
    },
    'ScrollPageUp' : function (o) 
    {
        o.GoToRel( -( o.getFrameBufferH() / o.charH ), 0 );
        return false;
    },
    'ScrollPageDown' : function (o) 
    {
        o.GoToRel( o.getFrameBufferH() / o.charH, 0 );
        return false;
    },
    'MoveCursorUp' : function (o) {
        o.GoToRel( -1, 0 );       
        return false;
    },
    'MoveCursorDown' : function (o) {
        o.GoToRel( 1, 0 );  
        return false;
    },
    'MoveCursorLeft' : function (o) {
		if (o.buffer.cursorCol == 0)
			o.GoToRel( -1, 100000 )
		else
    	    o.GoToRel( 0, -1 );
        return false;
    },
    'MoveCursorRight' : function (o) {
        if (o.buffer.cursorCol == o.buffer.getLine().source.length)
        	o.GoToRel( 1, -100000 );
        else
        	o.GoToRel( 0, 1 );
        return false;
    },
    'MoveEndLine' : function (o) {
        var indent = o.buffer.getLine().source.match(/\s*$/);     
        if (indent[0] && o.buffer.cursorCol < o.buffer.getLine().source.length - indent[0].length)
            o.GoTo( o.buffer.cursorRow, o.buffer.getLine().source.length - indent[0].length );
        else
            o.GoTo( o.buffer.cursorRow, o.buffer.getLine().source.length );
            
        return false;
    },
    'MoveStartLine' : function (o) {
        var indent = o.buffer.getLine().source.match(/^\s*/);
        if (indent[0] && o.buffer.cursorCol > indent[0].length)
            o.GoTo( o.buffer.cursorRow, indent[0].length );
        else
            o.GoTo( o.buffer.cursorRow, 0 );
        
        return false;
    },

    'BackRemoveChar' : function (o)
    {
        // special case when backspacing at the start of a line
        if (o.buffer.cursorCol == 0)
        {
            // nothing to do if we are the very start
            if (o.buffer.cursorRow == 0) return;
            
            var oldLen = o.buffer.getLine(o.buffer.cursorRow-1).source.length;
            var str = o.buffer.getLine(o.buffer.cursorRow).source;
            
            o.buffer.undo.startBlock();
            
            // First insert then remove the line, otherwise the undo won't work
            o.buffer.GoTo( o.buffer.cursorRow-1, oldLen );
            o.buffer.insertChars( str );
            o.buffer.GoTo( o.buffer.cursorRow+1, 0 );
            o.buffer.delLine();
            
            o.buffer.undo.endBlock();
            
            o.GoToRel( -1, oldLen );
        }
        else
        {        
            o.buffer.removeChars( -1 );
            o.GoToRel(0,-1);
        }
        
        o.render();
        return false;
    },
    
    'RemoveChar' : function (o) 
    {
        // special case when suprimming from the end of a line
        if ( o.buffer.cursorCol == o.buffer.getLine().source.length )
        {
            // nothing to do if we are at the very end
            if ( o.buffer.cursorRow == o.buffer.getLineCount()-1 )
                return;
         
            // fetch next line string
            var nextLine = o.buffer.getLine(o.buffer.cursorRow+1);
            str = nextLine ? nextLine.source : '';
            
            o.buffer.undo.startBlock();
            o.buffer.insertChars( str );
            var col = o.buffer.cursorCol;
            o.buffer.GoTo( o.buffer.cursorRow+1, 0 );
            o.buffer.delLine();
            o.buffer.GoTo( o.buffer.cursorRow-1, col );
            o.buffer.undo.endBlock();
        }
        else
        {
            o.buffer.removeChars( 1 );
        }
        
        o.render();
        return false;
    },
            
    'NewLine' : function (o) 
    { 
        
        var str = o.buffer.getLine(o.buffer.cursorRow).source.substring(o.buffer.cursorCol);

        o.buffer.undo.startBlock();
        
        // delete the text from the current line which will be inserted in the next one
        if (str.length)
        {            
            o.buffer.removeChars( str.length );
        }        
        
        o.buffer.GoTo( o.buffer.cursorRow+1, 0 );
        o.buffer.newLine();
        
        if (str.length)
        {
            o.buffer.insertChars( str );
        }
        
        // Indent the text
        var indent = o.buffer.getLine(o.buffer.cursorRow).source.match(/^\s*/);
        if (indent.length)
            o.buffer.insertChars( o.buffer.cursorRow+1, 0, indent[0] );
        
        o.buffer.undo.endBlock();
        
        o.render();
        
        //call goto after render so the new line is computed
        o.GoToRel( 0, indent.length ? indent[0].length : 0 );

        return false;
    },
    
    'GoToLine' : function (o) 
    {
        var ln;
        var done = false;
        while (! done)
        {
        		var ln =  prompt( o.t('Go to line number') + ' [1-' + o.buffer.getLineCount() + '] :');
        		if (ln === null) break;
        		
            ln = parseInt( ln );
            if (isNaN(ln) || ln<1 || ln>o.buffer.getLineCount())
            {
                alert( o.t('Line number out of range\nPlease enter a value between 1 and ') + o.buffer.getLineCount());
            }
            else
            {
                o.buffer.undo.action( UNDO_CURSOR );
                o.GoTo( ln-1, 0 );        
                done = true;
            }
        }
        return false;
    },

    
    'PasteClipboard' : function (o)
    {
        var ReferenceObject = o;
        
        function pasteLines(e) 
        {
            var lines = e.target.value.split(/\r\n|\r|\n/);
            
            var remainingStr = o.buffer.getLine(o.cursor.row).source.substring( o.cursor.col );
            
            if (lines.length > 1 && remainingStr.length)
            {
                o.buffer.removeChars( o.cursor.row, o.cursor.col, remainingStr.length );    
            }
            
            for (var i=0; i<lines.length; i++)
            {
                if (i==0)
                {                    
                    o.buffer.insertChars( o.cursor.row, o.cursor.col, lines[i] );
                }
                else
                {
                    o.buffer.insertLine( o.cursor.row + i, lines[i] );
                }                
            }
            
            
            var row = o.cursor.row + lines.length-1;
            var col = o.buffer.getLine(row).source.length;
            
            if (lines.length > 1 && remainingStr.length)
            {                    
                pos = o.buffer.getLine(row).offset + col;                
                o.buffer.insertChars( row, col, remainingStr );
            }
            else
            {
                col -= remainingStr.length;
            }
            
            o.render();            
            o.GoTo( row, col )            

            
            o.input.removeEventListener( 'input', pasteLines, false );
        }
        
        
        // attach an event into mozilla onInput, so when the text is copied it'll be inserted
        o.input.addEventListener( 'input', pasteLines, false );
        
        return true;
    },
    
    'ToggleInsertMode' : function (o) {
        o.insertMode = !o.insertMode;
        o.cursor.switchMode( o.insertMode );    
        return true;
    },
    
    'ToggleHiddenChars' : function (o) {
    	o.showHidden = !o.showHidden;	
    	o.renderInnerHTML();
    	return false;
    }
};


function ReferenceRenderer( container, i18n )
{
    this.FRAME_ELEMENT = 'UL';
    this.LINE_ELEMENT = 'LI';
    
    
    this.buffer = null;
	
    this.nl = '\n';
    this.tab = '    '; //'    ';	

    this.insertMode = true;

    this.actions = TAPDefaultActions;
    
    this.keyMap = {};
    
    //I18N messages
    if (typeof i18n == 'undefined')
    	this.messages = {};
    else
    	this.messages = i18n;
    
    for (var i=0; i<TAPDefaultKeymap.length; i++)
    {
    		if (! this.addShortcut( TAPDefaultKeymap[i].shortcut, TAPDefaultKeymap[i].action ))
    		{
    			dbg_error( TAPDefaultKeymap[i].shortcut + ' failed' );
    		}
    }
    
    this.showHidden = false;
    
    this.cachedClassNames = {};
        
    
    //Lines of code  
    this.frame = document.createElement( this.FRAME_ELEMENT );
    this.frame.id = 'out';
    this.frame.tabIndex = 1; // Allows the element to get the focus
    container.appendChild( this.frame );
        
    //cache some values to speed-up exection
    this.calcDimensions();


    // Input box
    this.input = document.createElement('TEXTAREA');
    this.input.id = 'testInput';
    this.input.name = 'KeyHandler_' + Math.random();
    this.input.style.position = 'absolute';
    //this.input.style.zIndex = -1000;
    this.input.style.width = '100px';
    this.input.style.height = '20px';
    this.input.style.top = 0;
    this.input.style.left = 0;
    container.appendChild( this.input );
    
    // position the input box behind the code so it's not visible
    //this.input.style.top = (this.getFrameBufferY()+10)+'px';
    //this.input.style.left = (this.getFrameBufferX()+10)+'px';

    //attach some event handlers
    
    // make a copy of the object instance to be called from the event handlers
    var ObjectReference = this;    
    if (document.addEventListener) //W3C Model
    {    	
        window.addEventListener( 'resize', function(e) { ObjectReference.calcDimensions(e) }, false );
        this.frame.addEventListener( 'scroll', function(e) { ObjectReference.updateViewport(e) }, false );
        this.frame.addEventListener( 'mouseup', function(e) { ObjectReference.mouseUp(e) }, false );
        
        this.input.addEventListener( 'focus', function(e) { ObjectReference.cursor.enable() }, false );
        this.input.addEventListener( 'blur', function(e) { ObjectReference.cursor.disable() }, false );
        
        this.input.addEventListener( 'keypress', function(e) { ObjectReference.keyHandler_Moz( e ) }, false );        
    }
    else  //IE Model
    {	
        window.attachEvent( 'onresize', function(e) { ObjectReference.calcDimensions(e?e:window.event) } );
        this.frame.attachEvent( 'onscroll', function(e) { ObjectReference.updateViewport(e?e:window.event) } );
        this.frame.attachEvent( 'onmouseup', function(e) { ObjectReference.mouseUp(e?e:window.event) } );

        this.input.attachEvent( 'onfocus', function(e) { ObjectReference.cursor.enable() } );
        this.input.attachEvent( 'onblur', function(e) { ObjectReference.cursor.disable() } );
        
        this.input.attachEvent( 'onkeydown', function(e) { ObjectReference.keyHandler( e?e:window.event ) } );
    }
    
    //We should find a way to check this  
    this.charW = 8;
    this.charH = 16;
  
  
    //The caret
    this.cursorElement = document.createElement('SPAN');
    this.cursorElement.id = 'cursor';  
    
    // makes sure we can't click on the caret element
    this.cursorElement.onmouseover = function(e) { this.style.display = 'none'; }
    
    container.appendChild( this.cursorElement );
    this.cursor = new TAP_Cursor( this.cursorElement, this, 500 );
    this.cursor.setPosition( 0, 0, true );  
    this.cursor.disable();
}

ReferenceRenderer.prototype.destroy = function ()
{
  dbg_info('Destroying renderer');
	
	this.buffer = null;
	
	this.input.parentNode.removeChild( this.input );
	this.cursorElement.parentNode.removeChild( this.cursorElement );
	this.frame.parentNode.removeChild( this.frame );
}

// translates an user interface message
ReferenceRenderer.prototype.t = function( msg )
{
	if ( typeof this.messages[ msg ] == 'undefined' )
		return msg;
	else
		return this.messages[ msg ];
}

ReferenceRenderer.prototype.addShortcut = function ( shortcut, action )
{
		if (typeof action == 'string')
		{
				// check if the action exists
				if (typeof this.actions[action] == 'undefined')
					return false;
					
				this.keyMap[ shortcut ] = this.actions[action];
		}
		else
		{
				this.keyMap[ shortcut ] = action;
		}
		
		return true;
}


ReferenceRenderer.prototype.GoTo = function ( row, col )
{
    this.buffer.GoTo(row, col);
    if ( this.highlightedLine != this.buffer.cursorRow )
	{
		//unstyle previously selected line
		if (this.frame.childNodes[ this.highlightedLine ])
		    this.frame.childNodes[ this.highlightedLine ].className = this.frame.childNodes[ this.highlightedLine ].className.replace(/(^|\b)active(\b|$)/i, '');
		
    	//style currently selected line
    	this.frame.childNodes[ this.buffer.cursorRow ].className = 'active';
    	
    	this.highlightedLine = this.buffer.cursorRow
	}
	
	var rowPx = this.buffer.cursorRow * this.charH;
	var colPx = this.buffer.cursorCol * this.charW;	
	
	//scroll viewport if needed
	if (rowPx < this.frame.scrollTop)
	    this.frame.scrollTop = rowPx;
	else if (rowPx > this.frame.scrollTop + this.getFrameBufferH() - (this.charH*3))
	    this.frame.scrollTop = rowPx - this.getFrameBufferH() + (this.charH*3);
	    
	if (colPx < this.frame.scrollLeft)
	    this.frame.scrollLeft = colPx;
	else if (colPx > this.frame.scrollLeft + this.getFrameBufferW() - (this.charW*3))
	    this.frame.scrollLeft = colPx - this.getFrameBufferW() + (this.charW*3);


	this.cursor.setPosition( this.buffer.cursorRow, this.buffer.cursorCol );
}


ReferenceRenderer.prototype.GoToRel = function ( rows, cols )
{
    this.GoTo( this.buffer.cursorRow + rows, this.buffer.cursorCol + cols );
}




ReferenceRenderer.prototype.keyHandler_Moz = function (e)
{
     
    // skip the alt+Number since it'll allow to input chars from the numpad
    if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.altKey && e.charCode >= 48 && e.charCode <= 57) return;
    
    // build the short-cut key
    var mod = [];
    if (e.shiftKey) mod.push('SHIFT');
    if (e.altKey) mod.push('ALT');
    if (e.ctrlKey) mod.push('CTRL');
    if (e.metaKey) mod.push('META'); // Only for Macs
    
    if (e.charCode)
    {
        // In the shortcut we use upper cased chars    
        var charStr = String.fromCharCode( e.charCode ? e.charCode : e.keyCode );
        mod.push( charStr.toUpperCase().charCodeAt(0) );
    }
    else
    {
        // Special keys like arrows, tab, enter ...
        mod.push( '#' + e.keyCode );
    }

    
    var shortcut = mod.join('+');
    
    if (this.keyMap[ shortcut ])
    {        
        if ( !this.keyMap[ shortcut ]( this ) )
        {
            // Cancel default action for this shortcut
            e.preventDefault();
            e.stopPropagation();
            e.returnValue = false;                
        }        
    }
    else
    {
        if ( e.charCode && !e.ctrlKey && !e.metaKey )
        {
            // insert character            
            this.buffer.insertChars( String.fromCharCode(e.charCode) );
            
            this.GoToRel(0,1);

            // remove the next char if we are in replace mode
            if ( !this.insertMode )
            {
                if ( this.buffer.getLine().source.length >= this.buffer.cursorCol )
                    this.buffer.removeChars( 1 );
            }
            
            this.render();
            
            // Reset the hidden input box
            this.input.value = '';
        }
    }
    
    
    dbg_info('Shorcut: ' + shortcut + ' CharCode: ' + e.charCode + ' Which: ' + e.which + ' KeyCode: ' + e.keyCode + ' CharStr: ' + charStr);
}


//For IE we will need to make some tricks with the text inserted in the text box
ReferenceRenderer.prototype.keyHandler_IE = function (e)
{
    if (! e) e = window.event;
    
    var chrCode = e.charCode ? e.charCode :
                  (e.keyCode ? e.keyCode : (e.which ? e.which : 0) );
    
    //skip the alt+Number since it'll allow to input chars from the numpad
    if (e.altKey && chrCode >= 48 && chrCode <= 57) return;

    var mod = [];
    if (e.shiftKey || e.shiftLeft) mod.push('SHIFT');
    if (e.ctrlKey || e.ctrlLeft) mod.push('CTRL');
    if (e.altKey || e.altLeft) mod.push('ALT');
    
    
    //convert always to uppercase to build the shortcut
    if (chrCode)
    {
        var t = String.fromCharCode( chrCode ).toUpperCase();
        mod.push( t.charCodeAt(0) );    
    }
    
    var chrKey = mod.join('+');
    
    if ( this.keyMap[ chrKey ] )
    {
        //don't do default actions
        if (e.preventDefault) e.preventDefault(); 
        e.returnValue = false;
        if (e.stopPropagation) e.stopPropagation();
        e.cancelBubble = true;
        e.keyCode = 0;
        
        this.keyMap[ chrKey ]( this );
        
        dbg_info('Shorcut found! ' + chrKey);
    }
    else
    {
        if ( e.charCode && !e.ctrlKey && !e.altKey )
        {
            var t = String.fromCharCode( chrCode );
            
            //convert to lowercase (IE needs this)
            if (! e.shiftKey ) t = t.toLowerCase();                
            
            //this.buffer.insertChars( t/*String.fromCharCode(chrCode)*/, 20 );
            //this.render();
        }
        
        
        dbg_info( chrKey + ' (' + t + ') charCode: ' + e.charCode + ' keyCode: ' + e.keyCode + ' which: ' + e.which );    
    }
    
}


/**
 *
 *
 * @private
 */
ReferenceRenderer.prototype.mouseUp = function (e) 
{
    //OUTDATED!!!
    function getOfs_IE( range, obj )
    {
        var elm, ln, ofs, ofsPx, blkNum;
        
        // move to the parent LI
        elm = range.parentElement();
		do {
			if (elm.nodeName == 'LI') break;				
		} while (elm = elm.parentNode);
		
        if (! elm) {        
            dbg_error('getOfs_IE - parent LI element not found');
            return;            
        }		
                
        
        // find line, count backwards the LI elements
        ln = 0;
        while (elm = elm.previousSibling)
        {
            if (elm.nodeName == 'LI') ln++;    
        }
        
        
		
        //find horizontal offset
        elm = range.parentElement();
        if ( elm.nodeName != 'LI')
        {
            blkNum = 0;
            //if a text node then get the parent node (a span)
            elm = elm.nodeType == 3 ? elm.parentNode : elm;
            while ( elm = elm.previousSibling ) {
                blkNum++;
            }
            
            ofs = obj.buffer.getLine(ln).blocks[ blkNum ] ? obj.buffer.getLine(ln).blocks[ blkNum ].offset : 0;
            
            
            //store actual left offset
            var ofsPx = range.offsetLeft;
            
            //select the whole text in the block
            range.moveToElementText( range.parentElement() );
            
            ofs += ( ofsPx - range.offsetLeft ) / obj.charW;
        }
        else //this should be the end of the line
        {
            ofs = obj.buffer.getLine(ln).blocks[ obj.buffer.getLine(ln).blocks.length-1 ].offset;
        }
        
        
        return [ ln, ofs ];
    }


    function getOfs_Moz ( selElm, selOfs, obj )
    {
        var elm, ln, ofs, blkNum;
        

        //If we are clicking on the frame (scrollbars) exit
        if (selElm == obj.frame) return;
        
        //move up to the containing line element
        elm = selElm;
        do {
            if (elm.nodeName == obj.LINE_ELEMENT) break;
        } while (elm = elm.parentNode);

        if (! elm) {
            dbg_error('getOfs_Moz - line element not found');
            return;
        }
        
        // IE attribute (probably valid for Opera and Safari)
        if (elm.sourceIndex)
        {
            dbg_info('getOfs_Moz - sourceIndex ' + elm.sourceIndex);
            ln =  elm.sourceIndex;
        }
        // DOM3 method (Mozilla tested)
        else if (elm.compareDocumentPosition) 
        {
        		function binarySearch( lft, rgt, elm )
        		{
        			var mid;
        			while (lft <= rgt)
        			{
        				mid = Math.floor( (rgt-lft)/2 ) + lft;
        				if (elm.parentNode.childNodes[mid] == elm)
        				{
        					return mid;
        				}
        				//check if the middle element precedes the searched for one
        				if ((elm.compareDocumentPosition( elm.parentNode.childNodes[mid] ) & 2) == 2)
        				{
        					lft = mid+1;
        				}
        				else
        				{
        					rgt = mid-1;
        				}
        			}
        			return false;
        		}
        		
        		// first check the rows closer to the last cursor position
        		ln = binarySearch( Math.max( 0, obj.cursor.row-12 ), Math.min( elm.parentNode.childNodes.length-1, obj.cursor.row+12 ), elm );
        		// if not found in the neighbour rows then do a global search
        		if (ln === false)
        		{
        			dbg_info('getOfs_Moz - Global binary search');
        			ln = binarySearch( 0, elm.parentNode.childNodes.length-1, elm );        		
        		}
        }
        else
        {                    
            //find the clicked line by traversing backwards the set of line elements
            ln = 0;
            while (elm = elm.previousSibling)
            {
                if (elm.nodeName == obj.LINE_ELEMENT) ln++;
            }    				
    				// this is much faster in large files but more error prone
            //ln = parseInt( (elm.offsetTop - obj.getFrameBufferY()) / obj.charH);
        }
        
            
        //find line offset
        if ( selElm.nodeName != obj.LINE_ELEMENT)
        {
            blkNum = 0;
            //if a text node then get the parent node (a span)
            elm = selElm.nodeType == 3 ? selElm.parentNode : selElm;
            while ( elm = elm.previousSibling ) {
                blkNum++;
            }
            
            ofs = obj.buffer.getLine(ln).getBlock( blkNum ) ? obj.buffer.getLine(ln).getBlock( blkNum ).offset : 0;
            
            ofs += selOfs;
        }
        else //this should be the end of the line
        {
            var blk = obj.buffer.getLine(ln).getBlock( obj.buffer.getLine(ln).getBlockCount()-1 );
            ofs = blk.offset + obj.buffer.getLine(ln).getBlockLength( obj.buffer.getLine(ln).getBlockCount()-1 );
        }
        
        
        return [ ln, ofs ];
    }
 
    if (!e) var e = window.event;
    
    //skip if not left button
    if (e.which && e.which != 1) return;
    if (e.button && e.button != 1) return;
    
    
    var sel, startSel, endSel, selText;
    
    
    if (typeof window.getSelection != 'undefined')
    {
        selText = sel = window.getSelection();
        startSel = getOfs_Moz( sel.anchorNode, sel.anchorOffset, this );        
        endSel = getOfs_Moz( sel.focusNode, sel.focusOffset, this );        
        if (typeof(startSel) != 'object' && typeof(endSel) != 'object')  return;
    }
    else if (typeof document.selection != 'undefined' && typeof document.selection.createRange != 'undefined')
    {
        sel = document.selection.createRange();
        sel.collapse(); //position at start of the selection
        startSel = getOfs_IE( sel, this );
        
        sel = document.selection.createRange();
        sel.collapse(false);    //position at end of selection
        endSel = getOfs_IE( sel, this );        
    }
    
    // make sure the results are ordered
    if  (   (startSel[0] > endSel[0]) || 
            (startSel[0] == endSel[0] && startSel[1] > endSel[1])   )
    {
        var tmpSel = startSel;
        startSel = endSel
        endSel = tmpSel;
    }
    
    dbg_info( 'StartOfs: ' + startSel + ' - EndOfs: ' + endSel );
    
    
    // find which end has the cursor ended up
    // TODO: This isn't the best method
    
    var x = 0, y = 0;
	if (e.pageX || e.pageY)
	{
		x = e.pageX;
		y = e.pageY;
	}
	else if (e.clientX || e.clientY)
	{
		x = e.clientX + document.body.scrollLeft;
		y = e.clientY + document.body.scrollTop;
	}    
        
    var ln, ofs;
    var diffStart = Math.abs( this.getRowInPixels( startSel[0] ) - y );
    var diffEnd = Math.abs( this.getRowInPixels( endSel[0] ) - y );
    if (    diffStart > diffEnd || 
            (   diffStart == diffEnd && 
                Math.abs( this.getColInPixels( startSel[1] ) - x ) > Math.abs( this.getColInPixels( endSel[1] ) - x ) 
            ) )
    {
        ln = endSel[0]; ofs = endSel[1];        
    } else {
        ln = startSel[0]; ofs = startSel[1];
    }

 
    
    this.GoTo( ln, ofs );
    

    if (startSel[0] != endSel[0] || startSel[1] != endSel[1])
    {
        var selText = [];
        for (var i=startSel[0]; i<=endSel[0]; i++)
        {
            if (i == startSel[0] && i == endSel[0])
                selText.push( this.buffer.getLine(i).source.substring( startSel[1], endSel[1] ) );
            else if (i == startSel[0])
                selText.push( this.buffer.getLine(i).source.substring( startSel[1] ) );
            else if (i == endSel[0])
                selText.push( this.buffer.getLine(i).source.substring( 0, endSel[1] ) );
            else
                selText.push( this.buffer.getLine(i).source );
        }
        this.input.value = selText.join( this.nl );
    }
    else
    {
        this.input.value = '';        
    }
    

    // Set focus to the input field so we can fetch the keys
    this.input.focus();

    this.input.select();

    
	return;
}


/**
 * @private
 */
ReferenceRenderer.prototype.updateViewport = function (e)
{
	this.cursor.setPosition( this.cursor.row, this.cursor.col, true );	
	
	
	var ObjectReference = this;
	
	if (!this.renderTimeOut)
	{
	    this.renderTimeOut = setTimeout( 
	        function() { 
                ObjectReference.render(); 
                ObjectReference.renderTimeOut = false; 
            }, 
            300
        );
	}
	//this.render();
}


/**
 * @private
 */  
ReferenceRenderer.prototype.calcDimensions = function (e)
{
  this.fbY = this.frame.offsetTop; 
  this.fbX = this.frame.offsetLeft;
  var elm = this.frame;
  while ( elm = elm.offsetParent )
  {
      this.fbY += elm.offsetTop;
      this.fbX += elm.offsetLeft;
  }
  
  this.fbW = this.frame.offsetWidth;
  this.fbH = this.frame.offsetHeight;  
}


ReferenceRenderer.prototype.getFrameBufferX = function ()
{
	return this.fbX;
}

ReferenceRenderer.prototype.getFrameBufferY = function ()
{
	return this.fbY;
}

ReferenceRenderer.prototype.getFrameBufferW = function ()
{
	return this.fbW;
}

ReferenceRenderer.prototype.getFrameBufferH = function ()
{
	return this.fbH;
}


/* based on the framebuffer */
ReferenceRenderer.prototype.getColInPixels = function (col)
{
	return this.fbX - this.frame.scrollLeft + col * this.charW;
}

ReferenceRenderer.prototype.getRowInPixels = function (row)
{
	return this.fbY - this.frame.scrollTop + row * this.charH;	
}

ReferenceRenderer.prototype.newBuffer = function ( txt, hlDef )
{
	fb = new TAP_Buffer( hlDef );
	fb.init( txt );
	
	this.buffer = fb;
}


ReferenceRenderer.prototype.getClassNames = function ( types )
{
    var serialized = types.join('.');
    
    if (! this.cachedClassNames[ serialized ])
    {    
        var tokenizer = this.buffer.tokenizer;
        var classes = [];
        var found;
        
        for (var i=0; i < types.length; i++)
        {
            if ( types[i] < 0 )
            {
                classes.push( 'normal' );
            }    
            else if (types[i] == 'k')
            {
                classes.push( tokenizer.keywordStyle );
            }
            else
            {
                // check if the class name is already defined
                found = false;
                for (var j=0; j < classes.length; j++)
                {
                    if ( tokenizer[ types[i] ].css == classes[j] )
                    {
                        found = true;
                        break;    
                    }
                }
                
                if (! found)
                    classes.push( tokenizer[ types[i] ].css );
                    
                tokenizer = tokenizer[ types[i] ].nested;
            }
        }
        
        
        this.cachedClassNames[ serialized ]  = classes.join(' ');
    }

    return this.cachedClassNames[ serialized ];
}

ReferenceRenderer.prototype.renderLine = function ( ln )
{
    var span;
    var li = document.createElement( this.LINE_ELEMENT );
    var str;
        
    for (var blk=0; blk < this.buffer.getLine(ln).getBlockCount(); blk++)
    {
        span = document.createElement('SPAN');
        
        str = this.buffer.getLine(ln).getBlockText( blk );
        if (this.showHidden)
        	str = str.replace(/ /g, '·').replace(/\t/g, '»   ');
        else
        	str = str.replace(/\t/g, '    ');
        	
        span.appendChild( document.createTextNode( str ) );
        
        span.className = this.getClassNames( this.buffer.getLine(ln).getBlock(blk).state );
        //span.title = line.blocks[j].state;
        
        li.appendChild( span );
    }
    
    if (this.showHidden)
    	li.appendChild( document.createTextNode('¶') );
    
    //make sure the line is displayed even if it's empty        
    if ( ! li.hasChildren && ! this.showHidden )
        li.appendChild( document.createTextNode(' ') );
    
    return li;
}

/**
 * This function renders a buffer. 
 *
 * It's NOT thought as to be able to render on a different 'thread', by using a timeout, althought
 * it could be fine tuned to do so
 *
 * If the argument full is false it'll render only the visible lines plus a few more
 * below.
 *
 */
ReferenceRenderer.prototype.render = function ( full )
{
    if (full) this.frame.className = 'HL_html';

		dbg_timer();
		    
    var li = this.frame.firstChild;
    if (! li)  // create first line
    {
        li = document.createElement( this.LINE_ELEMENT );
        this.frame.appendChild( li );
    }
    
    var newLi, blk, endOfs;
    
    var fromLine = full ? 0 : parseInt(this.frame.scrollTop / this.charH);
    var toLine = full ? this.buffer.getLineCount(true) : fromLine + parseInt(this.getFrameBufferH() / this.charH) + 10;
    if (toLine > this.buffer.getLineCount(true)) toLine = this.buffer.getLineCount(true);
    
    var line;
    for (var ln=fromLine; (line = this.buffer.getLine(ln,true)) && ln < toLine; ln++)
    {
        if (line.dirty == this.buffer.NORMAL) continue;
        
        switch( line.dirty )
        {
            case LINE_CHANGED:  // changed
                newLi = this.renderLine( ln )
                newLi.className = this.frame.childNodes[ln].className;
                this.frame.replaceChild( newLi, this.frame.childNodes[ln] );
                
                line.dirty = LINE_NORMAL;
            break; 
            
            case LINE_INSERTED:  // inserted
                newLi = this.renderLine( ln );
                
                if (this.frame.childNodes[ln])
                {
                    //newLi.className = this.frame.childNodes[ln].className;
                    this.frame.insertBefore( newLi, this.frame.childNodes[ln] );
                }
                else
                {
                    this.frame.appendChild( newLi );
                }
                
                line.dirty = LINE_NORMAL;                
            break;
            
            case LINE_DELETED:  // deleted
                //dbg_info('LN: ' + ln);
                this.frame.removeChild( this.frame.childNodes[ln] );
                
                // remove physically the line from the buffer
                this.buffer.delLineHard(ln);
                
                // since we removed a line we have to loop on the same row
                ln--;
            break;
            
            case LINE_TEXTCHANGED:
                for (blk=0; blk < line.blocks.length; blk++)
                {
                    if (line.blocks[blk].dirty == BLOCK_CHANGED)
                    {
                        this.frame.childNodes[ln].childNodes[blk].firstChild.nodeValue = this.buffer.getLine(ln).getBlockText( blk );
                        line.blocks[blk].dirty = BLOCK_NORMAL;
                    }                    
                }
                line.dirty = LINE_NORMAL;
            break;
        }
        
    }    
    
    dbg_info( 'Render ('+fromLine+':'+toLine+') took ' + dbg_timer(true) + 's' );
    
    return;
}	


//Optimized method for bootstrap
ReferenceRenderer.prototype.renderInnerHTML = function()
{
    this.frame.className = 'HL_html';
    
    dbg_timer();
    
    var j, t, s;
    var line;
    var arr = [];
    var i = 0;
    while ( line = this.buffer.getLine(i) )
    {
        s = '<' + this.LINE_ELEMENT.toLowerCase() + '>';
        
        for (j=0; j < line.blocks.length; j++)
        {
            // find end of token
            if (! line.blocks[j+1])
                t = line.source.length;
            else
                t = line.blocks[j+1].offset;
                
            s += '<span class="' + this.getClassNames( line.blocks[j].state ) + '"' /*+ ' title="' + line.blocks[j].state + '"'*/ + '>';
            str = line.getBlockText( j ).replace('&','&amp;').replace('<','&lt;').replace('>','&gt;');
            if (this.showHidden)
            	str = str.replace(/ /g, '·').replace(/\t/g, '»   ');
            else
            	str = str.replace(/\t/g, '    ');
            		
            s += str;
            s += '</span>';
        }
        if (this.showHidden) s+= '¶';        
        
        if (s == '<' + this.LINE_ELEMENT.toLowerCase() + '>')
            s += ' ';
            
        s += '</' + this.LINE_ELEMENT.toLowerCase() + '>';
        
        line.dirty = 0; //this.buffer;
        
        arr.push(s);
        
        i++;
    }
    
    this.frame.innerHTML = arr.join('');
    
    
    dbg_info( 'Render innerHTML took ' + dbg_timer(true) + 's' );
    
}