<?php

function getRev()
{
	$svnid = '$Rev$';
	$num = substr($svnid, 6);
	return intval( substr($num, 0, strlen($num)-2) );
}

echo "Rev: " . getRev() . "\n";
