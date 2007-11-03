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
 * TextArea+ UnDo Manager class
 * @fileoverview The TAP_Buffer_Undo is a class which manages the undoing and redoing 
 * of changes for a single text buffer.
 *
 * @author Iván Montes (aka DrSlump) <imontes@netxus.es>
 * @version 0.7
 */

/*
 * Types of actions   
 */
const UNDO_INSERT = 1;
const UNDO_REMOVE = 2;
const UNDO_NEWLINE = 3;
const UNDO_DELLINE = 4;
const UNDO_CURSOR = 5;
const UNDO_DUMMY = 100;


/**
 * @class This class is an UnDo manager for a single text buffer
 * @see TAP_Buffer 
 *
 * @constructor
 * @param {TAP_Buffer} buffer The buffer where this UnDo manager will be attached
 */
function TAP_Buffer_Undo( buffer ) 
{	
	this.buffer = buffer;	
	this.reset();
};

/**
 * Resets the undo manager to a clean state. Usefull when a buffer is reloaded for example
 *
 */
TAP_Buffer_Undo.prototype.reset = function ()
{
    this.actions = new Array();
    this.current = 0;
    this.undoing = false;
    this.block = 0;        
};

/**
 * Adds a new action to the actions array (command pattern)  
 *
 * @param {Integer} type    The type of action: UNDO_INSERT, UNDO_REMOVE, UNDO_NEWLINE, UNDO_DELLINE, UNDO_CURSOR
 * @param {String} str      Optional. The textual contents of an action
 * @param {Integer} len     Optional. The length attribute of an action
 */
TAP_Buffer_Undo.prototype.action = function ( type, str, len )
{
    if (this.undoing) return;
	
	if (typeof len == 'undefined')
	    len = str ? str.length : 0;
	
    // Invalidate the undoed changes when adding a new action
    this.actions.splice( this.current );

    var packed = false;		
	if (this.actions.length)
	{
	    var a = this.actions[ this.actions.length-1 ];
	    if (a.type == type && type == UNDO_DUMMY)
	    {
	        a.block = this.block;	        
	        packed = true;
	    }
	    else if (a.type == type && type == UNDO_INSERT)
	    {
            if (a.ln == this.buffer.cursorRow && (a.ofs + a.str.length) == this.buffer.cursorCol)
            {
                if (
                    (a.str.match(/\w$/) && str.match(/^\w$/)) ||
                    (a.str.substr(-1, 1) == str)
                   )
                {
                    a.str += str;
                    packed = true;
                }
            }
        }
        else if (a.type == type && type == UNDO_REMOVE)
        {
            // typical 'supr' behaviour
            if (a.ln == this.buffer.cursorRow && a.ofs == this.buffer.cursorCol)
            {
                if (
                    (a.str.match(/\w$/) && str.match(/^\w$/)) ||
                    (a.str.substr(-1, 1) == str)
                   )
                {
                    a.str += str;
                    packed = true;
                }
            }
            // typical 'backspace' behaviour
            if (a.ln == this.buffer.cursorRow && a.ofs == this.buffer.cursorCol+1)
            {
                if (
                    (a.str.match(/^\w/) && str.match(/^\w$/)) ||
                    (a.str.substr(0, 1) == str)
                   )
                {
                    a.str = str + a.str;
                    a.ofs = this.buffer.cursorCol; 
                    packed = true;
                }
            }
	    }
	}
	
	if (! packed)
    	this.actions.push( { 'block': this.block, 'type': type, 'ln': this.buffer.cursorRow, 'ofs': this.buffer.cursorCol, 'str': str, 'len' : len } );
		
	this.current = this.actions.length;
};

/**
 * Starts a new block of actions, so they can be undone as a single one
 *
 */
TAP_Buffer_Undo.prototype.startBlock = function ()
{
    this.block++;
};

/**
 * Ends the current block of actions
 *
 */
TAP_Buffer_Undo.prototype.endBlock = function ()
{
    this.block--;
    if (this.block < 0)
        dbg_warn('UnDo block level is below 0');
               
    this.action( UNDO_DUMMY );
};

/**
 * Performs the undo operation(s)
 *
 * @param {Boolean} stepping    If true will just rollback an action instead of a block
 * @return True on success, False on failure (no actions to be undone for example)
 * @type Boolean
 */
TAP_Buffer_Undo.prototype.undo = function ( stepping )
{
    if (! this.canUndo() ) return false;
    
    this.undoing = true;

    var blk = this.actions[ this.current-1 ].block;
		
	if (stepping || blk < 1)
	{
	    this.current--;
	    var action = this.actions[ this.current ];
	    switch ( action.type )
	    {
	        case UNDO_INSERT:
	            dbg_info('UNDO_INSERT ln: ' + action.ln + ' ofs: ' + action.ofs + ' extra: ' + action.str );
	            this.buffer.GoTo( action.ln, action.ofs );
	            this.buffer.removeChars( action.len ); 
	        break;
	        case UNDO_REMOVE:
	            dbg_info('UNDO_REMOVE ln: ' + action.ln + ' ofs: ' + action.ofs + ' extra: ' + action.str );
	            this.buffer.GoTo( action.ln, action.ofs );
	            this.buffer.insertChars( action.str );
	        break;
	        case UNDO_NEWLINE:
	            dbg_info('UNDO_NEWLINE blk: ' + action.block + ' ln: ' + action.ln + ' ofs: ' + action.ofs + ' extra: ' + action.str );
                this.buffer.GoTo( action.ln, action.ofs );
	            this.buffer.delLine();
	        break;
	        case UNDO_DELLINE:
	            dbg_info('UNDO_DELLINE ln: ' + action.ln + ' ofs: ' + action.ofs + ' extra: ' + action.str );
                this.buffer.GoTo( action.ln, action.ofs );
	            this.buffer.newLine();
	        break;
	        case UNDO_CURSOR:
                this.buffer.GoTo( action.ln, action.ofs );
	        break;
	        case UNDO_DUMMY:
	            //return this.undo(true)
	        break;
	    }
	    
        this.block = blk-1;
	}
	else
    {
        var level = this.block;
        dbg_info('Level: ' + level);
        while ( this.current && (level <= this.actions[ this.current-1 ].block) )
        {
            if (this.actions[ this.current-1 ].type == UNDO_DUMMY) 
            {
                this.current--;
                this.block = this.actions[ this.current ].block;
                break;
            }
            this.undo( true );
        }
        //this.block--;
    }
    
    	
    this.undoing = false;
    
    return true;
};

/**
 * Performs the redo operation(s)
 *
 * @param {Boolean} stepping    If true will just rollback an undone action instead of a block
 * @return True on success, False on failure (no actions to be redone for example)
 * @type Boolean
 */
TAP_Buffer_Undo.prototype.redo = function ( stepping )
{
    this.undoing = true;
	//TBI
    this.undoing = false;
};

/**
 * Utility method to know if there are actions to be undone
 *
 * @return True if there are actions to be undone
 * @type Boolean
 */
TAP_Buffer_Undo.prototype.canUndo = function ()
{
	return (this.actions.length > 0) && (this.current > 0);	
};

/**
 * Utility method to know if there are undone actions to be redone
 *
 * @return True if there are actions to be redone
 * @type Boolean
 */
TAP_Buffer_Undo.prototype.canRedo = function ()
{
	return (this.actions.length - this.current) > 0;
};