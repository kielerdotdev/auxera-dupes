<?php
	include "shared.php";

	ini_set('log_errors', true);
	ini_set('error_log', 'errors.log');

	$headers = getallheaders();

	if (!isset($headers['Steamid'])) {
		error_log("Request is missing 'Steamid' header");

		http_response_code(400);

		exit();
	}

	$steamid = $headers['Steamid'];

	if (!isset($headers['Hash'])) {
		error_log("Request is missing 'Hash' header");

		http_response_code(400);

		exit();
	}

	$hash = $headers['Hash'];
	$steamid = toCommunityID($steamid);

	$url = "$base_url/items/auth?api_key=$api_key&steamId=$steamid&hash=$hash";

	$ch = curl_init($url);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch, CURLOPT_HEADER, 0);
	$data = curl_exec($ch);
	$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
	curl_close($ch);

	if ($httpcode !== 200) {
		error_log("Got no return data");

		http_response_code($httpcode);

		exit();
	}

	http_response_code(200);
	
	echo $data
?>
