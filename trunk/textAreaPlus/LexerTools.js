/**
 * Creates an object representing a rule
 *
 * @constructor
 * @param {String}	name 		The rule name
 * @param {RegExp}	startRule  	Lexem pattern
 * @param {RegExp}	endRule		(Optional) ending pattern for a rule
 * @param {Array}	rules		(Optional) array of TAP_Lexer_Rule objects
 */
 function TAP_Lexer_Rule( name, startRule, endRule, rules ) 
{
	this.name = name;
	
	if (typeof(startRule) != 'string')
		this.re = String(startRule).substring( String(startRule).indexOf('/')+1, String(startRule).lastIndexOf('/') );
	else
		this.re = startRule;
		
	// find capturing parenthesis by removing the escaped backslashes first...
	var reStr = String(this.re).replace(/\\\\/g, '');
	// ...then get all non-escaped parenthesis not followed by a question mark
	var result = reStr.match( /([^\\]|^)\(([^\?]|$)/g );
	if (result)
		this.parenthesis = result.length;
	else
		this.parenthesis = 0;
	
	if (typeof(endRule) != 'undefined')
	{
		if (typeof(endRule) != 'string')
			this.endRe = String(endRule).substring( String(endRule).indexOf('/')+1, String(endRule).lastIndexOf('/') );
		else
			this.endRe = endRule;

		this.rules = rules;
	}
	else
	{
		this.rules = [];
	}
}

/**
 * Builds a lexer data structure from a definition
 *
 * @param {Array}	definition	array of TAP_Lexer_Rule objects
 * @param {String}	endRe  		(Optional) ending pattern
 * @param {RegExp}	parent		(Optional) a containing data structure
 * @return a lexer data structure
 */
function TAP_Lexer_Build( definition, endRe, parent )
{
    var rule;
    var rules = [];
    var tokensReArr = [];
    
    for (var i=0; i < definition.length; i++)
    {
    	rule = {
    		'n' /* name */			: definition[i].name,
    		'r' /* regexp */		: null,
    		't'	/* template */		: null,
    		's'	/* parenthesis */	: definition[i].parenthesis ? definition[i].parenthesis : 0,    		
    		'p'	/* parent rule */	: parent ? parent : null,
    		'c'	/* children rules */: null
    	};
    	
    	if (definition[i].endRe)
    		rule.c = TAP_Lexer_Build( definition[i].rules ? definition[i].rules : [], definition[i].endRe, rule );
       	
       	rules.push( rule );
		tokensReArr.push( definition[i].re );
    }
    
	if (endRe)
		tokensReArr.push( endRe );
	
	if (tokensReArr.length)
	{		
		if (endRe.search(/#BACKREF[1-9]+[0-9]*#/) != -1)
			parent.t = '(' + tokensReArr.join(')|(') + ')';
		else
			parent.r = new RegExp( '(' + tokensReArr.join(')|(') + ')', 'mg' );
	}

	return rules;
}

/**
 * Creates a language definition array from an XML file
 *
 * @param {Document}	xmldoc	A XML document with the lexing rules
 * @return a lexer language definition array
 */
function TAP_Lexer_XML2Definition( xmldoc )
{
	var templates = {};

	function parseRule( elm )
	{
		var def = [];
		
		for (var j=0; j<elm.childNodes.length; j++)
		{
			if (elm.childNodes[j].nodeType != 1)
				continue;
				
			if (elm.childNodes[j].nodeName == 'template')
			{
				if (templates[ elm.childNodes[j].getAttribute('ref') ])
					def = def.concat( templates[ elm.childNodes[j].getAttribute('ref') ] );
			}
			else if (elm.childNodes[j].hasAttribute('end'))
			{	
				def.push( 
					new TAP_Lexer_Rule( elm.childNodes[j].getAttribute('name'), elm.childNodes[j].getAttribute('start'), elm.childNodes[j].getAttribute('end'), 
						parseRule( elm.childNodes[j] )
					)
				);
			}
			else
			{	
				def.push(
					new TAP_Lexer_Rule( elm.childNodes[j].getAttribute('name'), elm.childNodes[j].getAttribute('start') )
				);
			}
			
		}	
		return def;	
	}

	// Parse rule templates
	var tplElm = xmldoc.getElementsByTagName('templates')[0];
	if (tplElm)
	{
		for (var j=0; j<tplElm.childNodes.length; j++)
		{
			if (tplElm.childNodes[j].nodeName == 'template')
			{
				templates[ tplElm.childNodes[j].getAttribute('id') ] = parseRule( tplElm.childNodes[j] );
			}
		}
	}	

	return parseRule( xmldoc.firstChild.getElementsByTagName('rules')[0], templates );
}

/**
 * Serializes the internal lexer data structure into Javascript code for its distribution
 *
 * @param {Object}	lexer 		the lexer data structure
 * @param {String}	variable  	the name of the variable to use
 * @param {Array}	path		(Optional) path to the current node
 * @return a string with the Javascript code for the given lexer data structure
 */
function TAP_Lexer_Serialize( lexer, variable, path )
{
	var j;
	var s = '';
	
	if (! path.length)
		s += 'var ' + variable + '=';
			
	s += '{';
	s += 'n:"' + lexer.n + '"';
	if (lexer.s)
		s += ',s:' + lexer.s;
	if (lexer.r)
		s += ',r:' + String(lexer.r);
	// templates are stored as strings so we need to escape some stuff
	if (lexer.t)
		s += ',t:"' + lexer.t.replace(/\\(x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4}|[0-9]+)/g, '\\$&').replace(/"/g, '\\"') + '"';
	s += '};'; 
	
	// process the children
	if (lexer.c)
	{	
		// get parent
		var parent = variable;
		for (j=0; j<path.length; j++)
			parent += '.c[' + path[j] + ']';
		
		s += parent + '.c=[];';
		for (j=0; j<lexer.c.length; j++)
		{
			s += parent + '.c[' + j + ']='
			s += TAP_Lexer_Serialize( lexer.c[j], variable, path.concat( [j] ) );
			s += parent + '.c[' + j + '].p=' + parent + ';';
		}
	}
		
	return s;
}