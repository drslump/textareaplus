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
 * API
 * 	
 * 	Constructor ( container ) : Creates the HTML elements needed and setup the object events
 *  
 *  clear() : Invalidates the current display completly
 *	render() : updates the display
 * 
 */

function TAP_Display( /** HTMLElement */ container )
{
	this.randomKey = Math.random();
	
    this.FRAME_ELEMENT = 'UL';
    this.LINE_ELEMENT = 'LI';
      
    this.showHidden = false;
    
    this.cachedClassNames = {};
           
    //Lines of code  
    this.frame = document.createElement( this.FRAME_ELEMENT );
    this.frame.id = 'TAP_Frame_' + this.randomKey;
    this.frame.tabIndex = 1; // Allows the element to get the focus
    container.appendChild( this.frame );
        
    //cache some values to speed-up exection
    this.calcDimensions();

    //attach some event handlers
    
    // make a copy of the object instance to be called from the event handlers
    var ObjectReference = this;    
    if (document.addEventListener) //W3C Model
    {    	
        window.addEventListener( 'resize', function(e) { ObjectReference.calcDimensions(e) }, false );
        this.frame.addEventListener( 'scroll', function(e) { ObjectReference.updateViewport(e) }, false );
        
        this.input.addEventListener( 'focus', function(e) { ObjectReference.cursor.enable() }, false );
        this.input.addEventListener( 'blur', function(e) { ObjectReference.cursor.disable() }, false );        
    }
    else  //IE Model
    {	
        window.attachEvent( 'onresize', function(e) { ObjectReference.calcDimensions(e?e:window.event) } );
        this.frame.attachEvent( 'onscroll', function(e) { ObjectReference.updateViewport(e?e:window.event) } );

        this.input.attachEvent( 'onfocus', function(e) { ObjectReference.cursor.enable() } );
        this.input.attachEvent( 'onblur', function(e) { ObjectReference.cursor.disable() } );        
    }
        
    //The caret
    this.cursorElement = document.createElement('SPAN');
    this.cursorElement.id = 'cursor' + this.randomKey;  
    
    // makes sure we can't click on the caret element
    this.cursorElement.onmouseover = function(e) { this.style.display = 'none'; }
    
    container.appendChild( this.cursorElement );
    this.cursor = new TAP_Cursor( this.cursorElement, this, 500 );
    this.cursor.setPosition( 0, 0, true );
    this.cursor.disable();
}


TAP_Display.prototype.destroy = function ()
{
	dbg_info('Destroying TAP_Display');
	
	this.cursorElement.parentNode.removeChild( this.cursorElement );
	this.frame.parentNode.removeChild( this.frame );
}



/**
 * @private
 */
TAP_Display.prototype.updateViewport = function (e)
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
TAP_Display.prototype.calcDimensions = function (e)
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
	
    //TODO: Check if this actually works
    var fontCalcElem = document.createElement('DIV');
    fontCalcElem.style.position = 'absolute';
    fontCalcElem.style.visibility = 'hidden';
    fontCalcElem.style.margin = fontCalcElem.style.padding = 0;
    fontCalcElem.appendChild( document.createTextNode('j') );
    this.frame.appendChild( fontCalcElem ); 
    this.charW = fontCalcElem.offsetWidth ? fontCalcElem.offsetWidth : 8;
    this.charH = fontCalcElem.offsetHeight ? fontCalcElem.offsetHeight : 16;
    this.frame.removeChild( fontCalcElem );	
}


TAP_Display.prototype.getFrameBufferX = function ()
{
	return this.fbX;
}

TAP_Display.prototype.getFrameBufferY = function ()
{
	return this.fbY;
}

TAP_Display.prototype.getFrameBufferW = function ()
{
	return this.fbW;
}

TAP_Display.prototype.getFrameBufferH = function ()
{
	return this.fbH;
}


/* based on the framebuffer */
TAP_Display.prototype.getColInPixels = function (col)
{
	return this.fbX - this.frame.scrollLeft + col * this.charW;
}

TAP_Display.prototype.getRowInPixels = function (row)
{
	return this.fbY - this.frame.scrollTop + row * this.charH;	
}



TAP_Display.prototype.getClassNames = function ( types )
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

TAP_Display.prototype.renderLine = function ( ln )
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
TAP_Display.prototype.render = function ( full )
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
TAP_Display.prototype.renderInnerHTML = function()
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