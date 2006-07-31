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
 * 'Line Span' method. 
 *
 * @author Iván Montes (aka DrSlump) <imontes@netxus.es>
 * @version 0.7
 *
 * TODO:
 *   - For every small change there is a call to reparse(), it should be posible
 *     to optimize the buffer handling a lot if we only reparse as needed, which
 *     will usually mean, only when rendering.
 *     Perhaps a lookup table could be used for the changes and reparse just the
 *     needed portions.
 */

/* 
 * Line status constants 
 */
const LINE_NORMAL = 0;
const LINE_CHANGED = 1;
const LINE_INSERTED = 2;
const LINE_DELETED = 3;
const LINE_TEXTCHANGED = 4;

/* 
 * Block status constants 
 */
const BLOCK_NORMAL = 0;
const BLOCK_CHANGED = 1;


///// TAP_BUFFER_BLOCK ///////////////////////////////////////////////////

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
function TAP_Buffer_Block( offset, state ) {
    this.offset = offset;
    this.dirty = BLOCK_NORMAL;
    this.state = state;
};

///// End of TAP_BUFFER_BLOCK ////////////////////////////////////////////


///// TAP_BUFFER_LINE ////////////////////////////////////////////////////


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
    this.dirty = typeof(status) == 'undefined' ? LINE_INSERTED : status;
    this.blocks = [];
    this.state = [];    
};


/** 
 * This method returns a single block from a line
 *
 * @param {Integer} blk The block index in the line
 * @return The requested block
 * @type TAP_Buffer_Block
 */
TAP_Buffer_Line.prototype.getBlock = function( blk ) {
    return this.blocks[blk];
};

/** 
 * This method returns the number of blocks in the line
 *
 * @return The number of blocks in the line
 * @type Integer
 */
TAP_Buffer_Line.prototype.getBlockCount = function() {
    return this.blocks.length;
};

/** 
 * This method returns the length of a block
 *
 * @param {Integer} blk The block index in the line
 * @return The number of chars in the requested block
 * @type Integer
 */
TAP_Buffer_Line.prototype.getBlockLength = function( blk ) {
    if ( this.blocks[blk+1] )
        return this.blocks[blk+1].offset - this.blocks[blk].offset;
    else
        return this.source.length - this.blocks[blk].offset;
};

/** 
 * This method returns the text content of a block
 *
 * @param {Integer} blk The block index in the line
 * @return The text contents of the requested block
 * @type String
 */
TAP_Buffer_Line.prototype.getBlockText = function( blk )
{
    if (this.blocks[blk+1])
        return this.source.substring( this.blocks[blk].offset, this.blocks[blk+1].offset );
    else
        return this.source.substring( this.blocks[blk].offset );
};

/**
 * Returns a tokenizer for a given context 
 *
 * @private
 * @param {Object} tokenizer The default tokenizer
 * @param {Array} state The desired context
 * @return A tokenizer for the given context
 * @type Object
 */
TAP_Buffer_Line.prototype.getTokenizerFromState = function ( tokenizer, state )
{
    var tknz = tokenizer;    
    for (var i=0; i < state.length; i++)
    {
        tknz = tknz[ state[i] ].nested;
    }
    return tknz;
};

/**
 * Parses a line based on the supplied tokenizer and context state
 * 
 * @param {Object} tokenizer The default tokenizer
 * @param {Array} state The context at the start of the line
 * @return The final context state
 * @type Array
 */
TAP_Buffer_Line.prototype.parse = function ( tokenizer, state )
{
    var tknz, startMatch, kwMatch;
    var pos, endPos = 0;
    var tkn;
    var newContext = false;

    // special function to check for keywords    
    function findKeywords( keywords, payload, endPos, state, blocks )
    {
    	var kwEndPos = 0;
    	var kwMatch;
    	
    	keywords.lastIndex = 0;
    	while ( (kwMatch = keywords.exec( payload )) !== null )
    	{
    		if (kwMatch[0].charAt(0) == ' ')
    			kwMatch.index++;

    		if (kwEndPos < kwMatch.index)
    			blocks.push( new TAP_Buffer_Block( endPos + kwEndPos, state.concat( [-1] ) ) );
    		   			
    		blocks.push( new TAP_Buffer_Block( endPos + kwMatch.index, state.concat( ['k'] ) ) );
    		kwEndPos = kwMatch.index + kwMatch[1].length;
	 			keywords.lastIndex = kwEndPos;
    	}
    	
   		endPos += kwEndPos;
    	
    	return endPos;
    };
    
    // save initial state for the line
    this.state = state.slice(0, state.length);
    this.blocks = [];
    
    tknz = this.getTokenizerFromState( tokenizer, state );
    
    tknz.start.lastIndex = 0;
    while ( (startMatch = tknz.start.exec( this.source )) !== null )
    {
        newContext = false;
        
        if ( endPos < startMatch.index )
        {
            //dbg_info('UNMATCHED TEXT ' + this.source.substring( endPos, startMatch.index ) );
            
            if (tknz.keywords)
            {
            	endPos = findKeywords( tknz.keywords, this.source.substring( endPos, startMatch.index ), endPos, state, this.blocks );
            }
            
            if (endPos < startMatch.index)
                this.blocks.push( new TAP_Buffer_Block( endPos, state.concat( [-1] ) ) );
        }
        
        pos = startMatch.index;
        endPos = pos + startMatch[0].length;
        
        // loop thru the captured parenthesis
        for (i=1; i <= tknz.length; i++)
        {
    		// check if we matched a keyword with a general rule        		
    		if (tknz.keywords && i > tknz.keywordIndex)
    		{
    			kwEndPos = findKeywords( tknz.keywords, startMatch[0], pos, state, this.blocks );
    			if (kwEndPos != pos)
    			{
    				break;
    			}
    		}
        		
        	
            // check the first capture which was matched
            if (startMatch[i])
            {
                // the matches array is 1 based, while the tokenizer is 0 based
                tkn = i-1;
                
                this.blocks.push( new TAP_Buffer_Block( pos, state.concat( [tkn] ) ) );
                
                // check if the token has an end delimiter
                if (tknz[tkn].end)
                {
				            //dbg_info('START OF CONTEXT FOUND (' + tkn + ') : ' + startMatch[0]);

                    // start a new context
                    state.push( tkn );
                    
                    newContext = true;                    
                    
                    tknz = this.getTokenizerFromState( tokenizer, state );
                    tknz.start.lastIndex = endPos;
                }
                else
                {
                    //dbg_info('SINGLE TOKEN' + startMatch[0]);
                }
                
                break;
            }
        }
        
        // if none of the start tokens were matched, check if the end of context one was
        if (!newContext && startMatch[ tknz.length+1 ])
        {
            //dbg_info('END OF CONTEXT FOUND (' + state[state.length-1] + ') : ' + startMatch[0]);
            this.blocks.push( new TAP_Buffer_Block( pos, state.slice(0,state.length) ) );
            
            state.pop();
            
            tknz = this.getTokenizerFromState( tokenizer, state );
            tknz.start.lastIndex = endPos;
        }
    }
    
    if (endPos < this.source.length)
    {
        //dbg_info('REMAINING TEXT ' + this.source.substring( endPos ) );
        if (tknz.keywords)
        {
           	endPos = findKeywords( tknz.keywords, this.source.substring( endPos ), endPos, state, this.blocks );
        }
        
        if (endPos < this.source.length)
            this.blocks.push( new TAP_Buffer_Block( endPos, state.concat([-1]) ) );
    }
    
    return state;
};


///// END OF TAP_BUFFER_LINE /////////////////////////////////////////////



///// TAP_BUFFER /////////////////////////////////////////////////////////

/**
 * Instantiates a TAP_Buffer class to handle plain text
 *
 * @class This class handles a text buffer using the 'Line Span' method
 * 
 * @constructor
 * @param {Object} hlDef This is a highlighting definition object
 */
function TAP_Buffer( hlDef ) {
    
    this.cursorRow = 0;
    this.cursorCol = 0;
    
    this.lines = new Array();
    
    this.undo = new TAP_Buffer_Undo( this );
    
    this.tokenizer = this.buildTokenizer( hlDef, '' );
    
    this.delLinesLookUp = [];
};

/**
 * Accessor method to get a given line object
 *
 * @param {Integer} ln Optional argument with the line to get, starting at 0, by default returns the current cursor line
 * @param {Boolean} countDeleted Optional argument which if true will process lines marked for removal
 * @return A line Object or NULL if the requested line is out of range
 * @type Object
 */
TAP_Buffer.prototype.getLine = function ( ln, countDeleted )
{   
    if (typeof ln == 'undefined') ln = this.cursorRow;
     
    //skip logically deleted lines
    if ( !countDeleted )
    {
        for (var i=0; i<this.delLinesLookUp.length; i++)
            if (ln >= this.delLinesLookUp[i]) ln++;
    }

    if ( ln < 0 && ln >= this.getLineCount(countDeleted) ) return null;
    
    return this.lines[ln];
};

/** 
 * This method returns the number of lines in the text buffer
 *
 * @param {Boolean} countDeleted Optional argument which if true will count lines marked for removal too
 * @return The number of lines
 * @type Integer
 */
TAP_Buffer.prototype.getLineCount = function( countDeleted )
{
    if (countDeleted)
        return this.lines.length;
    else
        return this.lines.length - this.delLinesLookUp.length;
};


/**
 * Builds a tokenizer object from a definition structure
 *
 * @private
 * @param {Object} def The tokenizer definition
 * @param {String} endPattern Optional ending pattern from the parent tokenizer
 * @return A compiled tokenizer object
 * @type Object
 */
TAP_Buffer.prototype.buildTokenizer = function ( def, endPattern )
{
    var tmpDef;
    var token;
    var tokenizer = [];
    var re = '';
    for (var i=0; i < def.length; i++)
    {
        if ( def[i].keywords )
        {
        		tokenizer.keywordIndex = i;
            tokenizer.keywords = new RegExp('(?:^|\\W)(' + def[i].keywords.join('|') + ')(?:\\W|$)', def[i].ignoreCase ? 'gi' : 'g');
            tokenizer.keywordStyle = def[i].css;
        }
        else
        {            
            re += '|(' + def[i].re[0] + ')';
            
            token = new Object();
            token.css = def[i].css;
            token.end = def[i].re[1] ? true : false;
            token.nested =  this.buildTokenizer( def[i].nested ? def[i].nested : [], def[i].re[1] );            
            
            tokenizer.push( token );
        }
    }
    //adds an extra entry pattern which will be used to signal the end of a context
    if (endPattern) re += '|(' + endPattern + ')';
    
    tokenizer.start = new RegExp( re.substring(1), 'g' );
    //tokenizer.start.compile(); //this should optimize it a bit
    
    return tokenizer;
};


/**
 * Initializes the text buffer
 *
 * @param {String} txt Plain text to be edited
 */
TAP_Buffer.prototype.init = function ( txt )
{
    this.lines = new Array();
    
	var txtLines = txt.split(/\r\n|\r|\n/);
	
	dbg_timer();
	
	var state = [];
	for (var i=0; i < txtLines.length; i++)
	{
	    this.lines[i] = new TAP_Buffer_Line( txtLines[i], LINE_INSERTED );
	    state = this.lines[i].parse( this.tokenizer, state );
	}
	
	dbg_info('Parse took ' + dbg_timer(true) + 's');
};

/**
 * Calculates the array index of a line in the private lines buffer
 *
 * @private
 * @param {Integer} ln  The logical line
 * @return The array index for the given line
 * @type Integer
 */ 
TAP_Buffer.prototype.calcLineIndex = function ( ln )
{
    if (typeof ln == 'undefined') ln = this.cursorRow;
    
    // Take into account the deleted lines
    var ll = ln;
    var i = 0;
    for (var i=0; i<this.delLinesLookUp.length; i++)
    {
        if ( ln >= this.delLinesLookUp[i] )
            ll++;
    }
    
    return ll;
};

/** 
 * Inserts a new line into the text buffer
 *
 * @return The number of affected lines
 * @type Integer
 */
TAP_Buffer.prototype.newLine = function ()
{
    ln = this.calcLineIndex();
    
    var tmp = this.lines.slice( ln );
    this.lines.splice( ln );
    
    this.undo.startBlock();
    this.undo.action( UNDO_NEWLINE, ln, 0 );
        
    var line = new TAP_Buffer_Line( '', LINE_INSERTED );
    
    this.undo.endBlock();
    
    this.lines.push( line );
    this.lines = this.lines.concat( tmp );
            
    return this.reparse( this.cursorRow );
};


/** 
 * Private method which compares two arrays by their contents
 *
 * @private
 * @param {Array} arr1 First array to compare
 * @param {Array} arr2 Second array to compare
 * @return True if they are equal of false if they are not
 * @type Boolean
 */
TAP_Buffer.prototype.compareArray = function( arr1, arr2 )
{
    if (arr1.length != arr2.length) return false;
    for (var i=0; i<arr1.length; i++)
    {
        if (arr1[i] != arr2[i]) return false;
    }
    return true;
};


/** 
 * This method will re-parse the buffer from the given line
 *
 * @param {Integer} ln Line where the re-parsing will start
 * @return The number of lines changed
 * @type Integer
 */
TAP_Buffer.prototype.reparse = function( ln )
{
    ln = this.calcLineIndex(ln);
    
    // make a copy of the blocks for optimizations
    var blocks = this.lines[ln].blocks.slice(0, this.lines[ln].blocks.length);

    var state = [];
    if (ln > 0)
    {
        state = this.lines[ln-1].state.slice(0, this.lines[ln-1].state.length);
    }
        
    var ll = ln;
    do
    {
        if (this.lines[ln].dirty != LINE_DELETED)
        {
            if (this.lines[ln].dirty != LINE_INSERTED) 
                this.lines[ln].dirty = LINE_CHANGED;
            state = this.lines[ln].parse( this.tokenizer, state );
        }
        ln++;
    } while ( this.lines[ln] && (this.lines[ln].dirty == LINE_DELETED || !this.compareArray( state, this.lines[ln].state ) ) );    
    
    
    /*
        Optimization: If there is only one line affected, compare the new line 
        to the old one and if they have exactly the same blocks and in the same order, 
        then we just need to update the text inside of the blocks.
    */
    if (ln-ll == 1 && this.lines[ll].dirty != LINE_DELETED && blocks.length == this.lines[ll].blocks.length)
    {
        var equal = true;
        var delta = 0;
        for ( var i=1; i<blocks.length; i++)
        {
            if (! this.compareArray( blocks[i].state, this.lines[ll].blocks[i].state) )
            {
                equal = false;
                break;
            }
            // find the block which have changed
            else if ( blocks[i].offset + delta != this.lines[ll].blocks[i].offset )
            {
                delta += blocks[i].offset - this.lines[ll].blocks[i].offset;
                this.lines[ll].blocks[ i-1 ].dirty = BLOCK_CHANGED;
            }
        }
        
        if (equal)
        {
            //Signal the needed change
            this.lines[ln].dirty = LINE_TEXTCHANGED;  // block contents changed
        }
    }    
    
    
    return ln-ll;
};

/** 
 * Moves the buffer's internal caret/cursor
 *
 * @param {Integer} row The line in the buffer
 * @param {Integer} col The offset from the start of the line
 */
TAP_Buffer.prototype.GoTo = function ( row, col )
{
    row = parseInt(row);
    col = parseInt(col);
        
    if (row < 0) row = 0;
    if (col < 0) col = 0;
    
    if (row >= this.getLineCount()) 
        row = this.getLineCount()-1;

    if (col > this.getLine(row).source.length) 
        col = this.getLine(row).source.length;
        
    this.cursorRow = row;
    this.cursorCol = col;
};


/** 
 * Removes a line from the text buffer by marking it for removal
 *
 * @return The number of lines affected by the change
 * @type Integer
 */
TAP_Buffer.prototype.delLine = function ()
{
    var ln = this.calcLineIndex();
    
    // mark line for deletion
    this.lines[ln].dirty = LINE_DELETED;
    
    this.delLinesLookUp.push( ln );
    
    this.undo.action( UNDO_DELLINE );
    
    return this.reparse( this.cursorRow );
};

/** 
 * Physically removes a line from the text buffer
 * It'll usually be called by the renderer when it has aknowledged the change
 *
 * @param {Integer} ln The array index of the line to remove
 */
TAP_Buffer.prototype.delLineHard = function ( ln )
{
    // find the line in the lookup table and remove it
    var j;
    for (var i=0; i < this.delLinesLookUp.length; i++)
    {
        if (this.delLinesLookUp[i] == ln)
        {
            this.lines.splice( ln, 1 );
            j = i;
        }
        else if (this.delLinesLookUp[i] > ln)
        {
            // keep the lookup table updated
            this.delLinesLookUp[i]--;
        }
    }
    this.delLinesLookUp.splice( j, 1 );    
};


/** 
 * This method inserts an string of arbitrary length into a line
 *
 * @param {String} txt The text to be inserted
 * @return The number of lines affected by the change
 * @type Integer
 */
TAP_Buffer.prototype.insertChars = function ( txt )
{
    if (! txt.length) return 0;
    
    dbg_timer();

    this.undo.action( UNDO_INSERT, txt );

    // Add the character to the internal buffer
    var line = this.getLine();
    line.source = line.source.substring( 0, this.cursorCol ) + txt + line.source.substring ( this.cursorCol );
    
    
    var affectedLines = this.reparse( this.cursorRow );
    
    dbg_info('InsertChars "' + line.source + '" - Affected Lines: ' + affectedLines + ', Parse Time: ' + dbg_timer(true));
            
    return affectedLines;
};


/** 
 * This method removes a number of continuous chars from a line
 *
 * @param {Integer} len Number of chars to delete, if negative will delete from right to left
 * @return The number of lines affected by the change
 * @type Integer
 */
TAP_Buffer.prototype.removeChars = function ( len )
{
    dbg_timer();
    
    var line = this.getLine( this.cursorRow );

    this.undo.action( UNDO_REMOVE, line.source.substr( this.cursorCol, len ), len );
    
    // Remove from the internal buffer    
    if (len>0)
        line.source = line.source.substring( 0, this.cursorCol ) + line.source.substring ( this.cursorCol + len );
    else
        line.source = line.source.substring( 0, this.cursorCol + len ) + line.source.substring ( this.cursorCol );
       

    var affectedLines = this.reparse( this.cursorRow );
		
    dbg_info('RemoveChars - Affected Lines: ' + affectedLines + ', Parse Time: ' + dbg_timer(true));
    
    return affectedLines;
};
