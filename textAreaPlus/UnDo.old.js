/*
    Undo manager
    
    ToDO:
      [ ] Intelligent repack of events, right now it only packs based on time, improve it by breaking on 
      word boundaries for example.
      [ ] It stores text for INSERT events so it can REDO them. There are more efficient ways to handle this but
      we need to change a bit how Redo works.
*/

function TAP_Buffer_Undo( buffer )
{    
    this.INSERT = 1;
    this.REMOVE = 2;
    this.NEWLINE = 3;
    this.REMOVELINE = 4;
    
    this.TIMEGAP = 500; // 1 seconds
 
 
    this.buffer = buffer;
    
    this.stack = new Array();
    this.position = 0;
}

TAP_Buffer_Undo.prototype.addEvent = function ( type, ln, ofs, txt )
{    
    // Invalidate the undoed changes when adding a new one
    this.stack.splice( this.position );
    
    var d = new Date();
    var stamp = d.getTime();

    var block, lastAction;

    // check if we have a new undo block
    if ( this.stack[ this.position-1 ] && stamp - this.stack[ this.position-1 ].stamp < this.TIMEGAP)
    {
        block = this.stack[ this.position-1 ];
        lastAction = block.actions[ block.actions.length-1 ];
    }
    else
    {
        block = { 'stamp' : stamp, 'actions' : [] };
        this.stack.push( block );
    }
        


    switch ( type )
    {        
        case this.INSERT:
            if (    lastAction &&
                    lastAction.type == this.INSERT &&
                    ln == lastAction.line &&
                    ofs == lastAction.ofs + lastAction.text.length /*&&
                    !txt.match(/^[\u0000-\u002F\u003A-\u0040\u005B-\u0060-\u007B-\u007E\s]$/)*/
               )
                lastAction.text += txt;
            else
                block.actions.push( { 'type' : type, 'line' : ln, 'ofs' : ofs, 'text' : txt } );                
        break;
        case this.REMOVE:
            block.actions.push( { 'type' : type, 'line' : ln, 'ofs' : ofs, 'text' : txt } );
        break;
        case this.NEWLINE:
            block.actions.push( { 'type' : type, 'line' : ln, 'len' : txt.length } );
        break;
        case this.REMOVELINE:
            block.actions.push( { 'type' : type, 'line' : ln, 'len' : 1 } );
        break;
    }
    
    this.position = this.stack.length;
}


TAP_Buffer_Undo.prototype.undo = function ()
{
    if (! this.position) return null;
    
    var current = this.stack[ this.position-1 ];
    var pos = 0;
    var cursorPos = [0,0];

    this.buffer.undoing = true;
    for (var i=current.actions.length-1; i>=0; i--)
    {
        switch ( current.actions[i].type )
        { 
            case this.INSERT:
                var pos = this.buffer.getLine( current.actions[i].line ).offset;
                pos += current.actions[i].ofs;
                
                this.buffer.removeChar( pos, current.actions[i].text.length );
                alert('UNDOING: INSERT');
                cursorPos = [ current.actions[i].line, current.actions[i].ofs ];
            break;
            case this.REMOVE:
                var pos = this.buffer.getLine( current.actions[i].line ).offset;
                pos += current.actions[i].ofs;
                
                this.buffer.insertChar( current.actions[i].text, pos );
                
                alert('UNDOING: REMOVE');
                cursorPos = [ current.actions[i].line, current.actions[i].ofs + current.actions[i].text.length ];
            break;
            case this.NEWLINE:
                this.buffer.removeLine( current.actions[i].line );
                
                alert('UNDOING: NEWLINE');
                cursorPos = [ current.actions[i].line - 1, 0 ];
            break;
            case this.REMOVELINE:
                this.buffer.insertLine( current.actions[i].line-1 );
                
                alert('UNDOING: REMOVELINE');
                cursorPos = [ current.actions[i].line, 1 ];
            break;
        }
    }
    this.buffer.undoing = false;
    
    this.position--;
    //alert(cursorPos);
    return cursorPos;
}

TAP_Buffer_Undo.prototype.redo = function ()
{
    if (this.position == this.stack.length) return null;
    
    var current = this.stack[ this.position ];
    var pos = 0;
    var cursorPos = [0,0];

    this.buffer.undoing = true;
    for (var i=0; i<current.actions.length; i++)
    {
        switch ( current.actions[i].type )
        { 
            case this.INSERT:
                var pos = this.buffer.getLine( current.actions[i].line ).offset;
                pos += current.actions[i].ofs;
                
                this.buffer.insertChar( current.actions[i].text, pos );
                
                alert('REDOING: INSERT');
                cursorPos = [ current.actions[i].line, current.actions[i].ofs + current.actions[i].text.length ];
            break;
            case this.REMOVE:                
                var pos = this.buffer.getLine( current.actions[i].line ).offset;
                pos += current.actions[i].ofs;
                
                this.buffer.removeChar( pos, current.actions[i].text.length );
                alert('REDOING: REMOVE');
                cursorPos = [ current.actions[i].line, current.actions[i].ofs ];
            break;
            case this.NEWLINE:
                this.buffer.removeLine( current.actions[i].line );
                
                alert('UNDOING: NEWLINE');
                cursorPos = [ current.actions[i].line - 1, 0 ];
            break;
            case this.REMOVELINE:
                this.buffer.insertLine( current.actions[i].line-1 );
                
                alert('UNDOING: REMOVELINE');
                cursorPos = [ current.actions[i].line, 1 ];
            break;
        }
    }
    this.buffer.undoing = false;

    this.position++;
    return cursorPos;
}