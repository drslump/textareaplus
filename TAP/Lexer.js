TAP.Lexer = function () {
}

TAP.Lexer.lexem = function ( name, extra, pos, length )
{
	return {
		'name': name,
		'extra': extra,
		'pos': pos,
		'length': length
	};
}

/**
 * Scans a string to detect lexems in it
 *
 * @param {Object}		rule 	the lexer data structure to use
 * @param {String}		src  	the string to scan
 * @param {Function}	cb		the callback function to call when a lexem is found
 * @return the rule in which the lexer finished the string
 */
TAP.Lexer.scan = function ( rule, src, cb ) { 
    var escapeRe = /[\|\[\]\(\)\^\$\.\*\+\?\!\{\}\,\=\\]/g,
		idx, tkn,
		match;
     
	//reset the regular expression
    rule.r.lastIndex = 0;
    // find next token
    while ( match = rule.r.exec( src ) ) {
		// loop thru the captured parenthesis to find the matched token
        for (idx=1, tkn=0; tkn < rule.c.length; idx++, tkn++) { 
        	if (match[idx])
        		break;
        	// make sure we take into account the dinamic rules which also use capturing parenthesis
        	if (rule.c[tkn].s)
        		idx += rule.c[tkn].s;
        }
        
       	// check if the end of context one was
       	if (!rule.c[tkn]) {
           	cb( rule.n, '>', match.index, match[0].length, src );
           	
           	// move to the parent rules
           	rule = rule.p;
       	}
       	// The token opens a new context        	
       	else if (rule.c[tkn].c) {
			// move to the new rules
            rule = rule.c[tkn];
            
       		cb( rule.n, '<', match.index, match[0].length, src );
           
			// if we have matched a dinamic context, so we need to rebuild the escape rule
            if (rule.t) {
            	// replace all the back-references place holders with their actual content 
            	rule.r = rule.t;
                for (i=rule.s; i>0; i--) {
                	if (match[idx+i])
                  		rule.r = rule.r.replace( '#BACKREF'+i+'#', match[idx+i].replace( escapeRe, '\\$&' ) );
				}

				// rebuild the regular expression
				rule.r = new RegExp( rule.r, 'g' );
			}
       	}
       	// Simple token
       	else {
			cb( rule.c[tkn].n, '', match.index, match[0].length, src );
       	}
    
      	rule.r.lastIndex = match.index + match[0].length;
	}
		
	return rule;
}
