/*
Class: TAP_Buffer
	A class which represents a text document using the _Line Span_ method

See Also:
	<TAP.Buffer.Line>

Arguments: 
	lexer - (optional) a lexer definition object
	src - string: (optional) the initial contents for the buffer
*/
TAP.Buffer = function ( /** Object */ lexer, /** String */ src ) {
	this.lexer = lexer || null;
	this.lines = [];
	this.col = 0;
	this.row = 0;
	this.lineEnd = '\n';
	this.charCount = 0;
		
	this.read( src );	
}

/**
 * Replaces the buffer contents with a new text 
 *
 * @param {String}	src		The new text to be used in the buffer
 */
TAP.Buffer.prototype.read = function( /** String */ src ) {
	this.clear();
	this.insert( src );
}

/**
 * Returns a string with the contents of the buffer as UTF-16
 * 
 * @return String	The contents of the buffer as a JavaScript string
 */	
TAP.Buffer.prototype.write = function() {
	var /** String */ s = '';
	for (var i=0, len=this.lines.length; i<len; i++) {
		s += this.lines[i].src + this.lineEnd;
	}
	return s;
}

/**
 * Clears the text buffer initializing all its parameters
 */
TAP.Buffer.prototype.clear = function() {
	this.lines = [];
	this.charCount = 0;
	this.col = 0;
	this.row = 0;
	
	// create a first empty line
	this.lines.push( new TAP.Buffer.Line( this, '' ) );	
}

/**
 * Positions the internal cursor
 * 
 * @param	Number 	row		The buffer row
 * @param	Number	col		The buffer col
 * @return	Boolean			True on success False if desired position outside the limits
 */
TAP.Buffer.prototype.setCursor = function( /** Number */ row, /** Number */ col ) {
	if (row < 0 || col < 0 || 
		row >= this.lines.length ||	col > this.lines[row].src.length)
		return false;
	
	this.row = row;
	this.col = col;
	return true;
}	

/**
 * Positions the internal cursor based on the current position
 * 
 * @param	Number	rows	The number of rows to move: negative up, positive down
 * @param	Number	cols	The number of columns to move: negative left, positive right
 * @return	Boolean			True on success False if position is outside the limits
 */
TAP.Buffer.prototype.moveCursor = function( /** Number */ rows, /** Number */ cols ) {
	return this.setCursor( this.row + rows, this.col + cols );
}

/**
 * Returns the current cursor position
 * 
 * @return	Object	The current row and column as an object
 */
TAP.Buffer.prototype.getCursor = function() {
	return { 'row' : this.row, 'col' : this.col };
}	


/**
 * Returns the current character
 * 
 * @return	String	The current character
 */		
TAP.Buffer.prototype.getChar = function() {
	return this.getString( 1 );
}

/**
 * Returns the current line as a string
 * 
 * @return	String	The current line
 */
TAP.Buffer.prototype.getLine = function() {
	return this.lines[this.row].src;
}

/**
 * Returns a string of N chars from the from the current position
 * 
 * @param	{int}	cnt	The number of chars to get
 * @return	{String}	The string
 */
TAP.Buffer.prototype.getString = function( /** Number */ cnt ) {
	var s = this.getLine();
	return s.substr( this.col, cnt );
}
		
/**
 * Return the number of chars in the buffer
 * 
 * @return	{int}	The number of chars
 */
TAP.Buffer.prototype.getCharCount = function() {
	// number of chars plus the number of CR
	return this.charCount + ( this.getLineCount() * this.lineEnd.length );
}

/**
 * Returns the number of lines in the buffer
 * 
 * @return	{int}	The number of lines
 */
TAP.Buffer.prototype.getLineCount = function() {
	return this.lines.length;
}	

/**
 * Inserts a string in the buffer
 * 
 * @param	{String}	src	The string to insert (can be composed of multiple lines)
 * @return	{int}			Actually inserted chars
 */
TAP.Buffer.prototype.insert = function( /** String */ src ) {
	var inserted = 0,
		lines = src.split(/\r\n|\r|\n/),
		s = this.getLine(),
		lex,
		i, j = 0;
		
	for (i=0; i<lines.length; i++) {		
		if (i === 0) {
			this.lines[this.row].src = s.substr( 0, this.col ) + lines[0];	
		} else {
			// make room for a new line
			this.lines.splice( this.row+i, 0, new TAP.Buffer.Line( this, lines[i] ) );	 
		}

		this.lines[this.row+i].status = TAP.STATUS_CHANGED;
				
		inserted += lines[i].length;
	}
	
	this.lines[this.row + i - 1].src += s.substring( this.col );
	this.charCount += inserted;
	
	// if a lexer is enabled analyze the changed lines
	if (this.lexer) {
		lex = this.lines[this.row].lexer || this.lexer;	
		while ( this.lines[this.row+j] && (j < i || lex != this.lines[this.row+j].lexer) ) {
			this.lines[this.row+j].lexer = lex;
			lex = this.lines[this.row+j].scan();
			j++;
		}
		console.log('LEXER RUN ON %d LINES', j);
	}
	
	return inserted;
}