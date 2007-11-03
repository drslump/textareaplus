//Set up debugging functions

var dbg_global_timers = [];
function dbg_timer( calc )
{
	if (! calc)
	{
		dbg_global_timers.push( new Date() );
	}
	else
	{
		return ((new Date())-(dbg_global_timers.pop()))/1000;
	}
}

if (typeof Logger != 'undefined')
{
	function dbg_info( msg ) { Logger.info( msg ); };	
	function dbg_warn( msg ) { Logger.warn( msg ); };	
  function dbg_error( msg ) { Logger.error( msg ); };
}
else
{
	function dbg_info( msg ) { };
	function dbg_warn( msg ) { };
	function dbg_error( msg ) { };
}