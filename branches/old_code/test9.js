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


var TAP = {
	// Constants
	STATUS_OK		: 0,
	STATUS_CHANGED 	: 1
};








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
//TAP.Buffer.Lexem = function ( /** String */ name, /** String */ flag, /** Number */ pos, /** Number */ length ) {
//	this.name = name;
//	this.extra = extra;
//	this.pos = pos;
//	this.length = length;
//}






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

var lex_PHP = {
	match	: /<\?(=?|[Pp][Hh][Pp]\b)/,
	end		: /\?>/,
	name	: 'PHP',
	captures: {
	},
	children: [
	],
	repository: {
	}
};

var lexems = [];

var buffer;

function doIt( id ) {
	var php={n:"text",r:/(<\?(?:[pP][hH][pP]\b|=|\s|$))/gm};php.c=[];php.c[0]={n:"PHP",r:/((?:\/\/|#).*$)|(\/\*)|(")|(<<<([a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)\s*$)|(')|(\$[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)|(\b[+-]?0[Xx][0-9A-Fa-f]+\b)|(\b[+-]?[0-9]*\.+[0-9]+(?:[Ee][+-]?[0-9]*)?\b)|(\b[+-]?0[0-9]+\b)|(\b[+-]?[0-9]+\b)|(~|\|\||\|\=|\||\^\=|\^|@|\?(?!>)|>>\=|>>|>\=|>|\=\=\=|\=\=|\=|<\=|<<\=|<<|<|::|:|\/\=|\/|\.\=|\.|->|-\=|--|-|\+\=|\+\+|\+|\*\=|\*|&\=|&&|&|%\=|%\=|%|%|\!\=\=|\!\=|\!|\[|\]|\(|\)|\{|\}|\;)|(\b[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*\b)|(\?>)/gm};php.c[0].c=[];php.c[0].c[0]={n:"Comment"};php.c[0].c[0].p=php.c[0];php.c[0].c[1]={n:"Comment",r:/(\*\/)/gm};php.c[0].c[1].c=[];php.c[0].c[1].p=php.c[0];php.c[0].c[2]={n:"DoubleQuoteString",r:/(\\.)|((?:\$\{|\{\$)[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)|(\$[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)|(")/gm};php.c[0].c[2].c=[];php.c[0].c[2].c[0]={n:"Backslash"};php.c[0].c[2].c[0].p=php.c[0].c[2];php.c[0].c[2].c[1]={n:"Variable",r:/(->|[\[\]])|(\b[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*\b)|('[^'\\]*(?:\\.[^'\\]*)*')|(\})/gm};php.c[0].c[2].c[1].c=[];php.c[0].c[2].c[1].c[0]={n:"Operator"};php.c[0].c[2].c[1].c[0].p=php.c[0].c[2].c[1];php.c[0].c[2].c[1].c[1]={n:"Ident"};php.c[0].c[2].c[1].c[1].p=php.c[0].c[2].c[1];php.c[0].c[2].c[1].c[2]={n:"SingleQuoteString"};php.c[0].c[2].c[1].c[2].p=php.c[0].c[2].c[1];php.c[0].c[2].c[1].p=php.c[0].c[2];php.c[0].c[2].c[2]={n:"Variable"};php.c[0].c[2].c[2].p=php.c[0].c[2];php.c[0].c[2].p=php.c[0];php.c[0].c[3]={n:"HeredocString",s:1,t:"(\\\$)|((?:\$\{|\{\$)[a-zA-Z_\\x7f-\\xff][a-zA-Z0-9_\\x7f-\\xff]*)|(\$[a-zA-Z_\\x7f-\\xff][a-zA-Z0-9_\\x7f-\\xff]*)|(^#BACKREF1#;?$)"};php.c[0].c[3].c=[];php.c[0].c[3].c[0]={n:"Backslash"};php.c[0].c[3].c[0].p=php.c[0].c[3];php.c[0].c[3].c[1]={n:"Variable",r:/(->|[\[\]])|(\b[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*\b)|('[^'\\]*(?:\\.[^'\\]*)*')|(\})/gm};php.c[0].c[3].c[1].c=[];php.c[0].c[3].c[1].c[0]={n:"Operator"};php.c[0].c[3].c[1].c[0].p=php.c[0].c[3].c[1];php.c[0].c[3].c[1].c[1]={n:"Ident"};php.c[0].c[3].c[1].c[1].p=php.c[0].c[3].c[1];php.c[0].c[3].c[1].c[2]={n:"SingleQuoteString"};php.c[0].c[3].c[1].c[2].p=php.c[0].c[3].c[1];php.c[0].c[3].c[1].p=php.c[0].c[3];php.c[0].c[3].c[2]={n:"Variable"};php.c[0].c[3].c[2].p=php.c[0].c[3];php.c[0].c[3].p=php.c[0];php.c[0].c[4]={n:"SingleQuoteString",r:/(\\')|(')/gm};php.c[0].c[4].c=[];php.c[0].c[4].c[0]={n:"Backslash"};php.c[0].c[4].c[0].p=php.c[0].c[4];php.c[0].c[4].p=php.c[0];php.c[0].c[5]={n:"Variable"};php.c[0].c[5].p=php.c[0];php.c[0].c[6]={n:"Number"};php.c[0].c[6].p=php.c[0];php.c[0].c[7]={n:"Number"};php.c[0].c[7].p=php.c[0];php.c[0].c[8]={n:"Number"};php.c[0].c[8].p=php.c[0];php.c[0].c[9]={n:"Number"};php.c[0].c[9].p=php.c[0];php.c[0].c[10]={n:"Operator"};php.c[0].c[10].p=php.c[0];php.c[0].c[11]={n:"Ident"};php.c[0].c[11].p=php.c[0];php.c[0].p=php;
	lexer = php;
	
	var src = document.getElementById( id ).value;
	
	buffer = new TAP.Buffer( php, src );
	
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
}