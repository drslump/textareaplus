/**
 * Instantiates a TAP_Buffer_Line object which represents a line of text
 *
 * @class This class holds a single line of text in a text buffer
 * @see TAP.Buffer
 * @see TAP.Buffer.Lexem
 *
 * @constructor
 * @param	{TAP.Buffer}	buffer	The TAP_Buffer object where this line belongs
 * @param	{String}		src 	Optional text to assign to this line
 * @param	{Object}		lexer	Optional lexer object with the rules at the start of the line
 */
TAP.Buffer.Line = function ( /** TAP_Buffer */ buffer, /** String */ src, /** Object */ lexer )
{
	this.buffer = buffer;
	this.status = TAP.STATUS_CHANGED;
	this.src = src;
	this.lexer = lexer;
	this.lexems = [];
	this.currentLexem = 0;
	this.data = {};
	
	// Since we are using it as a callback function we need to use a closure instead of 
	// extending the object prototype
	var $this = this;
	this.addLexem = function ( name, extra, pos, length ) {		
		if (name === 'Ident') {
			if (/^(include_once|class|extends|var)$/.test( $this.src.substr(pos,length) ))
			{
				name = 'Keyword';
			}
		} else if (name === 'Operator')	{
			var braces = $this.getData( 'braces' );
			if (!braces) braces = [];
			
			switch ( $this.src.substr(pos, length) ) {
				case '{': braces.push( { name: 'lcurly', pos: pos } ); break;
				case '}': braces.push( { name: 'rcurly', pos: pos } ); break;
				case '[': braces.push( { name: 'lsquare', pos: pos } ); break;
				case ']': braces.push( { name: 'rsquare', pos: pos } ); break;
				case '(': braces.push( { name: 'lparen', pos: pos } ); break;
				case ')': braces.push( { name: 'rparen', pos: pos } ); break;
			}
			$this.setData( 'braces', braces );
		}
		else if (name === 'Variable')
		{
			var braces = $this.getData( 'braces' );
			if (!braces) braces = [];
					
			if (extra == '<' && $this.src[pos] == '{')
				braces.push( { name: 'lcurly', pos: pos } );
			else if (extra == '<' && $this.src[pos+1] == '{')
				braces.push( { name: 'lcurly', pos: pos+1 } );
			else if (extra == '>')
				braces.push( { name: 'rcurly', pos: pos } );
				
			$this.setData( 'braces', braces );
		}		
		
		$this.lexems.push( TAP.Lexer.lexem( name, extra, pos, length ) );
		//console.log('LEXEM "%s" FOUND AT %d : <%s>', name, pos, $this.src.substr(pos, length)); 
	}
}

TAP.Buffer.Line.prototype.getData = function ( /** String */ key ) {
	return this.data[ key ];
}

TAP.Buffer.Line.prototype.setData = function ( /** String */ key, value ) {
	this.data[ key ] = value;
}

/**
 * Scans the line text to extract the lexems contained in it
 *
 * @return	Object	The lexer used at the end of the current line
 */
TAP.Buffer.Line.prototype.scan = function () {
	this.lexems = [];
	this.data = {};

	return TAP.Lexer.scan( this.lexer, this.src, this.addLexem );
}

/**
 * Returns the next lexem for the line
 *
 * @return	TAP_Buffer_Lexem	A lexem object or null if no more lexems available
 */
TAP.Buffer.Line.prototype.nextLexem = function () {
	if (this.currentLexem >= this.lexems.length)
		return null;

	return this.lexems[ this.currentLexem++ ];
}

/**
 * Resets the lexems pointer for this line
 */
TAP.Buffer.Line.prototype.reset = function ()
{
	this.currentLexem = 0;
}