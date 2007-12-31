<?php

function getRevisionSignature()
{
	$svn = '$Rev$ - $Date$';
	$re = '/\s([0-9]+)\s\$\s-\s$Date:\s([0-9]{4}-[0-9]{2}-[0-9]{2})/';
	preg_match( $re, $svn, $m );

	return "{$m[1]} ({$m[2]})";
}

echo "Rev: " . getRev() . "\n";
