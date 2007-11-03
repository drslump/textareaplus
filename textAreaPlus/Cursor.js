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


function TAP_Cursor ( elem, renderer, rate )
{
	this.element = elem;
	this.renderer = renderer;
	this.rate = rate ? rate : 600;

	this.row = 0;
	this.col = 0;
	
	this.w = 2;
	this.h = 16;		
}

TAP_Cursor.prototype.enable = function ()
{
	if (!this.intervalRef)
	{
		// Using setInterval make us loose the context of the object, so we make a copy
		// of it and create an anonymous function which calls this named copy.
		var ObjectReference = this;
		this.intervalRef = setInterval( function () { ObjectReference.blink() }, this.rate );
	}
}

TAP_Cursor.prototype.disable = function ()
{
	if (this.intervalRef)
		clearInterval ( this.intervalRef );
	this.intervalRef = null;
	this.element.style.display = 'none';
}

TAP_Cursor.prototype.switchMode = function ( insert )
{
    if (insert)
    {
        this.element.className = '';
    }   
    else
    { 
        this.element.className = 'overwrite';
    }
}

TAP_Cursor.prototype.setPosition = function ( row, col, force )
{
	if (!force && col == this.col && row == this.row)
		return;


	// Check if the cursor is visible
	var top = this.renderer.getFrameBufferY();
	var left = this.renderer.getFrameBufferX();
	var width = this.renderer.getFrameBufferW();
	var height = this.renderer.getFrameBufferH();
	
	var posY = this.renderer.getRowInPixels( row );
	var posX = this.renderer.getColInPixels( col );
	
	if (posX < left || posX > left+width-this.w ||
		  posY < top || posY > top+height-(this.h*2))
		this.disable();
	else
    {
		this.enable();
    	//when moving make the cursor visible
    	this.element.style.display = 'block'
	}


	this.element.style.top = posY + 'px';
	this.element.style.left = posX + 'px';
	
	
	this.row = row;
	this.col = col;
}

TAP_Cursor.prototype.blink = function ()
{
	//alert(this.hello);
	if ( this.element.style.display == 'block' )
	{
		this.element.style.display = 'none';
	}
	else
	{		
		this.element.style.display = 'block';
	}
}
