<?php
	include "shared.php";

	$ID = $_GET['id'];
	echo get("items/$ID/download");
?>