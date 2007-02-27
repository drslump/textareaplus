/*
Script: test9.js
License:
	GNU General Public License 2.0

Other implementations:

	Another JS lexer: SourceMap http://www.devpro.it/code/126.html
	PHP version: http://www.phpclasses.org/browse/package/3279.html
	
	OverByte Editor (former byteplug), uses SourceMap: http://webreflection.blogspot.com
	
	EditArea: http://cdolivet.net/index.php?page=editArea
	
	Workspace, web based IDE: http://www.createworkspace.com/
*/

/* 
Constants: 
*/
var TAP_STATUS_OK = 0;
var TAP_STATUS_CHANGED = 1;

/*
Class: TAP_Buffer
	A class which represents a text document using the _Line Span_ method

See Also:
	<TAP_Buffer_Line>

Arguments: 
	lexer - String: (optional) a lexer definition object
	src - String: (optional) the initial contents for the buffer
*/
function TAP_Buffer( /** Object */ lexer, /** String */ src )
{
	this.lexer = lexer ? lexer : null;
	this.lines = [];
	this.col = 0;
	this.row = 0;
	this.lineEnd = '\n';
	this.charCount = 0;
		
	this.read( src );
}

/*
Property: read
	Replaces the buffer contents with a new text 
Arguments:
	src - String: The new text to be used in the buffer
*/
TAP_Buffer.prototype.read = function( /** String */ src )
{
	this.clear();
	
	this.insert( src );
}

/*
Property: write
	Returns a string with the contents of the buffer as UTF-16
	
Returns: 
	String - The contents of the buffer as a JavaScript string
*/	
TAP_Buffer.prototype.write = function()
{
	var /** String */ s = '';
	for (var i=0; i<this.lines.length; i++)
	{
		s += this.lines[i].src + this.lineEnd;
	}
	return s;
}

/*
Property: clear
	Clears the text buffer initializing all its parameters
*/
TAP_Buffer.prototype.clear = function()
{
	this.lines = [];
	this.charCount = 0;
	this.col = 0;
	this.row = 0;
	
	// create a first empty line
	this.lines.push( new TAP_Buffer_Line( this, '' ) );	
}

/*
Property: setCursor
	Positions the internal cursor

Arguments:
	row - Int: The buffer row
	col - Int: The buffer col
	
Returns:
	Boolean - True on success False if desired position outside the limits
 */
TAP_Buffer.prototype.setCursor = function( /** Number */ row, /** Number */ col )
{
	if (row < 0 ||
		col < 0 || 
		row >= this.lines.length ||
		col > this.lines[row].src.length)
		return false;
	
	this.row = row;
	this.col = col;
	return true;
}	

/*
Property: moveCursor
	Positions the internal cursor based on the current position

Arguments:
	rows - Number: The number of rows to move: negative up, positive down
	cols - Number: The number of columns to move: negative left, positive right
	
Returns:
	Boolean - True on success False if position is outside the limits
*/
TAP_Buffer.prototype.moveCursor = function( /** Number */ rows, /** Number */ cols )
{
	return this.setCursor( this.row + rows, this.col + cols );
}

/*
Property: getCursor
	Returns the current cursor position

Returns:
	Object - The current row and column as an object with properties 'row' and 'col'
*/
TAP_Buffer.prototype.getCursor = function()
{
	return { 'row' : this.row, 'col' : this.col };
}	


/*
Property: getChar
	Returns the current character

Returns:
	String - The current character
*/
TAP_Buffer.prototype.getChar = function()
{
	return this.getString( 1 );
}

/*
Property: getLine
	Returns the current line as a string

Returns:
	String - The current line
*/
TAP_Buffer.prototype.getLine = function()
{
	return this.lines[this.row].src;
}

/*
Property: getStrings
	Returns a string of N chars from the from the current position

Arguments:
	cnt - Int: The number of chars to get

Returns:
	String - The string
*/
TAP_Buffer.prototype.getString = function( /** Number */ cnt )
{
	var s = this.getLine();
	return s.substr( this.col, cnt );
}
		
/*
Property: getCharCount
	Return the number of chars in the buffer

Returns:
	Int - The number of chars
*/
TAP_Buffer.prototype.getCharCount = function()
{
	// number of chars plus the number of CR
	return this.charCount + ( this.getLineCount() * this.lineEnd.length );
}

/*
Property: getLineCount
	Returns the number of lines in the buffer

Returns:
	Int - The number of lines
*/
TAP_Buffer.prototype.getLineCount = function()
{
	return this.lines.length;
}	

/*
Property: Insert
	Inserts a string in the buffer

Arguments:
	src - String: The string to insert (can be composed of multiple lines)

Returns:
	Int - Actually inserted chars
*/
TAP_Buffer.prototype.insert = function( /** String */ src )
{
	var inserted = 0;
	var lines = src.split(/\r\n|\r|\n/);
	
	var s = this.getLine();	
	var i;
	for (i=0; i<lines.length; i++)
	{		
		if (i === 0)
		{
			this.lines[this.row].src = s.substr( 0, this.col ) + lines[0];	
		}
		else
		{
			// make room for a new line
			this.lines.splice( this.row+i, 0, new TAP_Buffer_Line( this, lines[i] ) );	 
		}

		this.lines[this.row+i].status = TAP_STATUS_CHANGED;
				
		inserted += lines[i].length;
	}
	
	this.lines[this.row + i - 1].src += s.substring( this.col );
	this.charCount += inserted;
	
	// if lexer is enabled analyze the changed lines
	if (this.lexer)
	{
		var j = 0;
		var lex = this.lines[this.row].lexer ? this.lines[this.row].lexer : this.lexer;	
		while ( this.lines[this.row+j] && (j < i || lex != this.lines[this.row+j].lexer) )
		{
			this.lines[this.row+j].lexer = lex;
			lex = this.lines[this.row+j].scan();
			j++;
		}
		console.log('LEXER RUN ON %d LINES', j);
	}	
	
	return inserted;
}


/*
Class: TAP_Buffer_Line
	A class which holds a single line of text in a text buffer

See Also:
	<TAP_Buffer>, <TAP_Buffer_Lexem>

Arguments: 
	buffer - <TAP_Buffer>: The TAP_Buffer object where this line belongs
	src - String: (optional) text to assign to this line
	lexer - Object: (optional) lexer object with the rules at the start of the line
*/
function TAP_Buffer_Line( /** TAP_Buffer */ buffer, /** String */ src, /** Object */ lexer )
{
	this.buffer = buffer;
	this.status = TAP_STATUS_CHANGED;
	this.src = src;
	this.lexer = lexer;
	this.lexems = [];
	this.currentLexem = 0;
	this.data = {};
	
	// Since we are using it as a callback function we need to use a closure instead of 
	// extending the object prototype
	var $this = this;
	this.addLexem = function ( name, extra, pos, length ) 
	{		
		if (name == 'Ident')
		{
			if (/^(include_once|class|extends|var)$/.test( $this.src.substr(pos,length) ))
			{
				name = 'Keyword';
			}
		} 
		else if (name == 'Operator')
		{
			var braces = $this.getData( 'braces' );
			if (!braces) braces = [];
			
			switch ( $this.src.substr(pos, length) )
			{
				case '{': braces.push( { name: 'lcurly', pos: pos } ); break;
				case '}': braces.push( { name: 'rcurly', pos: pos } ); break;
				case '[': braces.push( { name: 'lsquare', pos: pos } ); break;
				case ']': braces.push( { name: 'rsquare', pos: pos } ); break;
				case '(': braces.push( { name: 'lparen', pos: pos } ); break;
				case ')': braces.push( { name: 'rparen', pos: pos } ); break;
			}
			$this.setData( 'braces', braces );
		}
		else if (name == 'Variable')
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
		
		$this.lexems.push( new TAP_Buffer_Lexem( name, extra, pos, length ) );
		//console.log('LEXEM "%s" FOUND AT %d : <%s>', name, pos, $this.src.substr(pos, length)); 
	}
}

TAP_Buffer_Line.prototype.getData = function ( /** String */ key )
{
	return this.data[ key ];
}

TAP_Buffer_Line.prototype.setData = function ( /** String */ key, value )
{
	this.data[ key ] = value;
}

/*
Property: scan
	Scans the line text to extract the lexems contained in it

Returns:
	Object - The lexer used at the end of the current line
*/
TAP_Buffer_Line.prototype.scan = function ()
{
	this.lexems = [];
	this.data = {};
	return TAP_Lexer_Scan( this.lexer, this.src, this.addLexem );
}

/*
Property: nextLexem
	Returns the next lexem for the line
	
Returns:
	<TAP_Buffer_Lexem> - A lexem object or null if no more lexems available
*/
TAP_Buffer_Line.prototype.nextLexem = function ()
{
	if (this.currentLexem >= this.lexems.length)
		return null;

	return this.lexems[ this.currentLexem++ ];
}

/*
Property: reset
	Resets the lexems pointer for this line
*/
TAP_Buffer_Line.prototype.reset = function ()
{
	this.currentLexem = 0;
}


/**
 * Instantiates a TAP_Buffer_Lexem object which represents a lexem
 *
 * @class This class holds a single line of text in a text buffer
 * @see TAP_Buffer
 * @see TAP_Buffer_Lexem
 *
 * @constructor
 * @param	{String}	name	Lexem name
 * @param	{String}	flag 	Lexem flag: < (open), > (close)
 * @param	{Number}	pos		char position of the lexem in the line
 * @param	{Number}	length	char length of the lexem
 */
function TAP_Buffer_Lexem( /** String */ name, /** String */ flag, /** Number */ pos, /** Number */ length )
{
	this.name = name;
	this.extra = extra;
	this.pos = pos;
	this.length = length;
}





function render()
{
	var ul = document.getElementById('UL');
	ul.innerHTML = '';
	      
	var nested = {};
	var classes = '';
	for (var i=0; i<buffer.getLineCount(); i++)
	{
		var li = document.createElement('LI');
		var lastPos = 0;
		var lexem;
		buffer.lines[i].reset();
		while ( lexem = buffer.lines[i].nextLexem() )
		{
			if (lastPos < lexem.pos)
			{
				var span = document.createElement('SPAN');
				span.appendChild( document.createTextNode( buffer.lines[i].src.substring( lastPos, lexem.pos ) ) );
				span.className = classes + 'text';
				li.appendChild( span );
			}
			lastPos = lexem.pos + lexem.length;
			
			var span = document.createElement('SPAN');
			
			if (! nested[lexem.name]) nested[lexem.name] = 0;
			if (lexem.extra == '<')
			{
				span.className = classes + lexem.name + '_start';
				nested[ lexem.name ]++
			}
			else if (lexem.extra == '>')
			{
				span.className = classes + lexem.name + '_end';
				nested[ lexem.name ]--	
			}	
			else
			{
				span.className = classes + lexem.name;
			}
					
			span.appendChild( document.createTextNode( buffer.lines[i].src.substr( lexem.pos, lexem.length ) ) );
			li.appendChild( span );
			
			classes = '';
			for (var k in nested)
			{
				if (nested[k])
					classes += k + ' ';
			}
		}
			
		if (lastPos < buffer.lines[i].src.length)
		{
			var span = document.createElement('SPAN');
			span.className = classes + 'text';
			span.appendChild( document.createTextNode( buffer.lines[i].src.substring( lastPos ) ) );
			li.appendChild( span );
		}
		
		ul.appendChild( li );
	}
}	

function findOpenBrace( buffer, open, close, row, col )
{
	var j,k;
	var braces;
	var braceCnt = 1;
    for (j=row; braceCnt!=0 && j>=0; j--)
    {
		if (braces = buffer.lines[j].getData('braces'))
		{
			for (k=braces.length-1; braceCnt!=0 && k>=0; k--)
			{
				if (j == row && braces[k].pos >= col)
					continue;
							
				//console.log('OpenBrace ' + braces[k].name + ' at line ' + j + ' col ' + braces[k].pos + ' #' + braceCnt);
				if (braces[k].name == open) 
				{
					braceCnt--;
					if (braceCnt == 0)
						return { row: j, col: braces[k].pos };
				}
				else if (braces[k].name == close)
					braceCnt++;
			}
		}
	}
	return null;
}

function findCloseBrace( buffer, open, close, row, col )
{
	var j,k;
	var braces;
	var braceCnt = 1;
    for (j=row; braceCnt!=0 && j<buffer.lines.length; j++)
    {
		if (braces = buffer.lines[j].getData('braces'))
		{
			for (k=0; braceCnt!=0 && k<braces.length; k++)
			{
				if (j == row && braces[k].pos <= col)
					continue;
							
				//console.log('CloseBrace ' + braces[k].name + ' at line ' + j + ' col ' + braces[k].pos + ' #' + braceCnt);
				if (braces[k].name == close) 
				{
					braceCnt--;
					if (braceCnt == 0)
						return { row: j, col: braces[k].pos };
				}
				else if (braces[k].name == open)
					braceCnt++;
			}
		}
	}
	return null;
}

var oldTxt = '';
function newKey(e)
{
	if ( e.charCode && !e.ctrlKey && !e.metaKey )
    {
    	var ch = String.fromCharCode(e.charCode);
    	
    	// insert character            
        buffer.insert( ch );
        buffer.moveCursor(0,1);
        
        
        // Brace match     
        var closeBrace = {
        	'}': ['lcurly', 'rcurly'],
        	']': ['lsquare', 'rsquare'],
        	')': ['lparen', 'rparen']
        };
        var openBrace = {
        	'{': ['lcurly', 'rcurly'],
        	'[': ['lsquare', 'rsquare'],
        	'(': ['lparen', 'rparen']        
        };
        
        if ( typeof(closeBrace[ch]) != 'undefined' )
        {
        	var match = findOpenBrace( buffer, closeBrace[ch][0], closeBrace[ch][1], buffer.row, buffer.col-1 );
        	if (match)
				console.log('UP BRACE MATCH ' + closeBrace[ch][0] + ' AT LINE ' + match.row + ' COL ' + match.col);
        } 
        else if ( typeof(openBrace[ch]) != 'undefined' )
        {
       		var match = findCloseBrace( buffer, openBrace[ch][0], openBrace[ch][1], buffer.row, buffer.col-1 );
        	if (match)
				console.log('DOWN BRACE MATCH ' + openBrace[ch][0] + ' AT LINE ' + match.row + ' COL ' + match.col);        
        }
        
        
        render();
    }
}



var lexems = [];

var buffer;

function doIt( id )
{
	var php={n:"text",r:/(<\?(?:[pP][hH][pP]\b|=|\s|$))/gm};php.c=[];php.c[0]={n:"PHP",r:/((?:\/\/|#).*$)|(\/\*)|(")|(<<<([a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)\s*$)|(')|(\$[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)|(\b[+-]?0[Xx][0-9A-Fa-f]+\b)|(\b[+-]?[0-9]*\.+[0-9]+(?:[Ee][+-]?[0-9]*)?\b)|(\b[+-]?0[0-9]+\b)|(\b[+-]?[0-9]+\b)|(~|\|\||\|\=|\||\^\=|\^|@|\?(?!>)|>>\=|>>|>\=|>|\=\=\=|\=\=|\=|<\=|<<\=|<<|<|::|:|\/\=|\/|\.\=|\.|->|-\=|--|-|\+\=|\+\+|\+|\*\=|\*|&\=|&&|&|%\=|%\=|%|%|\!\=\=|\!\=|\!|\[|\]|\(|\)|\{|\}|\;)|(\b[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*\b)|(\?>)/gm};php.c[0].c=[];php.c[0].c[0]={n:"Comment"};php.c[0].c[0].p=php.c[0];php.c[0].c[1]={n:"Comment",r:/(\*\/)/gm};php.c[0].c[1].c=[];php.c[0].c[1].p=php.c[0];php.c[0].c[2]={n:"DoubleQuoteString",r:/(\\.)|((?:\$\{|\{\$)[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)|(\$[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)|(")/gm};php.c[0].c[2].c=[];php.c[0].c[2].c[0]={n:"Backslash"};php.c[0].c[2].c[0].p=php.c[0].c[2];php.c[0].c[2].c[1]={n:"Variable",r:/(->|[\[\]])|(\b[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*\b)|('[^'\\]*(?:\\.[^'\\]*)*')|(\})/gm};php.c[0].c[2].c[1].c=[];php.c[0].c[2].c[1].c[0]={n:"Operator"};php.c[0].c[2].c[1].c[0].p=php.c[0].c[2].c[1];php.c[0].c[2].c[1].c[1]={n:"Ident"};php.c[0].c[2].c[1].c[1].p=php.c[0].c[2].c[1];php.c[0].c[2].c[1].c[2]={n:"SingleQuoteString"};php.c[0].c[2].c[1].c[2].p=php.c[0].c[2].c[1];php.c[0].c[2].c[1].p=php.c[0].c[2];php.c[0].c[2].c[2]={n:"Variable"};php.c[0].c[2].c[2].p=php.c[0].c[2];php.c[0].c[2].p=php.c[0];php.c[0].c[3]={n:"HeredocString",s:1,t:"(\\\$)|((?:\$\{|\{\$)[a-zA-Z_\\x7f-\\xff][a-zA-Z0-9_\\x7f-\\xff]*)|(\$[a-zA-Z_\\x7f-\\xff][a-zA-Z0-9_\\x7f-\\xff]*)|(^#BACKREF1#;?$)"};php.c[0].c[3].c=[];php.c[0].c[3].c[0]={n:"Backslash"};php.c[0].c[3].c[0].p=php.c[0].c[3];php.c[0].c[3].c[1]={n:"Variable",r:/(->|[\[\]])|(\b[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*\b)|('[^'\\]*(?:\\.[^'\\]*)*')|(\})/gm};php.c[0].c[3].c[1].c=[];php.c[0].c[3].c[1].c[0]={n:"Operator"};php.c[0].c[3].c[1].c[0].p=php.c[0].c[3].c[1];php.c[0].c[3].c[1].c[1]={n:"Ident"};php.c[0].c[3].c[1].c[1].p=php.c[0].c[3].c[1];php.c[0].c[3].c[1].c[2]={n:"SingleQuoteString"};php.c[0].c[3].c[1].c[2].p=php.c[0].c[3].c[1];php.c[0].c[3].c[1].p=php.c[0].c[3];php.c[0].c[3].c[2]={n:"Variable"};php.c[0].c[3].c[2].p=php.c[0].c[3];php.c[0].c[3].p=php.c[0];php.c[0].c[4]={n:"SingleQuoteString",r:/(\\')|(')/gm};php.c[0].c[4].c=[];php.c[0].c[4].c[0]={n:"Backslash"};php.c[0].c[4].c[0].p=php.c[0].c[4];php.c[0].c[4].p=php.c[0];php.c[0].c[5]={n:"Variable"};php.c[0].c[5].p=php.c[0];php.c[0].c[6]={n:"Number"};php.c[0].c[6].p=php.c[0];php.c[0].c[7]={n:"Number"};php.c[0].c[7].p=php.c[0];php.c[0].c[8]={n:"Number"};php.c[0].c[8].p=php.c[0];php.c[0].c[9]={n:"Number"};php.c[0].c[9].p=php.c[0];php.c[0].c[10]={n:"Operator"};php.c[0].c[10].p=php.c[0];php.c[0].c[11]={n:"Ident"};php.c[0].c[11].p=php.c[0];php.c[0].p=php;
	lexer = php;
	
	var src = document.getElementById( id ).value;
	
	
	buffer = new TAP_Buffer( php, src );
	
    document.getElementById('in').addEventListener( 'keypress', newKey, false );	
}



function initializeJavaScriptBenchmark( what )
{
	if( !document.timeStamps )
		document.timeStamps = []
	if( !document.timeStamps[ what ] )
		document.timeStamps[ what ] = [ 0, 0, 0, 0 ]
	document.timeStamps[ what ][ 0 ] -= (new Date()).valueOf()+0*(document.timeStamps[ what ][ 3 ]=1)
}
function updateJavaScriptBenchmark( what )
{
	return ( !document.timeStamps || !document.timeStamps[ what ]  || !document.timeStamps[ what ][3] )?-1:document.timeStamps[ what ][ 2 ] = Math.round( 100*(document.timeStamps[ what ][ 0 ] += (new Date()).valueOf() ) / ++document.timeStamps[ what ][ 1 ] )/100+(document.timeStamps[ what ][ 3 ]=0)
}
function javaScriptBenchmark( what, reportHandle )
{
	initializeJavaScriptBenchmark( what.toString() )
	typeof(what)=='function'?what():eval( what )
	updateJavaScriptBenchmark( what.toString() )

	var report = ""
	for( currentWhat in document.timeStamps )
	report += document.timeStamps[ currentWhat ][ 1 ]?currentWhat +"\n________________________________________\ntook in average ~"+ document.timeStamps[ currentWhat ][ 2 ] +"ms after "+ document.timeStamps[ currentWhat ][ 1 ] +" execution(s)\n\n\n":""
	!reportHandle?alert( report ):reportHandle.innerHTML = report.replace( /\n________________________________________\n/g, "<hr/>" ).replace( /\t/g, "&nbsp; &nbsp; &nbsp;" ).replace( /\n/g, "<br/>" )
}}