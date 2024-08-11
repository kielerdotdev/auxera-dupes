<?php
	$base_url = 'https://dupes.auxera.net/api';
	$api_key = 'hC0sffiqw4eaIVdPpVPBdxJAS5U8qf4bQP9apsQ5JbFzBXBWfQg';
	$sx_key = 'c3b4fc249cc6a74938a708a945e22ea5a376b05f6c51f4ef185d43feb08a9a65561acac66dda5b833c364cd9ccbd8e8f7f0654fcc6af41ccdccbc813820d8b34';

	function toCommunityID($id) {
		if (preg_match('/^STEAM_/', $id)) {
			$parts = explode(':', $id);
			return bcadd(bcadd(bcmul($parts[2], '2'), '76561197960265728'), $parts[1]);
		} elseif (is_numeric($id) && strlen($id) < 16) {
			return bcadd($id, '76561197960265728');
		} else {
			return $id; // We have no idea what this is, so just return it.
		}
	}

	function getSteamID() {
		session_start();

		if(!isset($_GET['token'])) {
			echo "no token";
			die;
		}

		if(isset($_SESSION["steamid"])) {
			return $_SESSION["steamid"];
		}

		global $sx_key, $base_url;

		$token = $_GET['token'];

		$ch = curl_init("https://stavox.dk/tablet/apps/appstore/api/getplayerdata?playertoken=$token");
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		curl_setopt($ch, CURLOPT_HTTPHEADER, array(
			'Authorization: ' . $sx_key,
		));
		$resp = curl_exec($ch);
		curl_close($ch);

		// Return the JSON-encoded data
		$data = json_decode($resp, true);

		if($data['success'] != true) {
			echo $resp;
			die ("invalid auth");
		}

		$steamId = $data['SteamID'];
		$_SESSION["steamid"] = $steamId;

		return $steamId;
	}

	function validateWebhookCall() {
		global $sx_key;

        // If the webhook was called with an invalid method, throw an error
        if($_SERVER['REQUEST_METHOD'] != 'POST'){
            die(json_encode([
                'success' => false,
                'error' => 'invalid_method',
            ]));
        }

        // If the webhook was called without any auth header, throw another error
        if (!isset($_SERVER['HTTP_AUTHORIZATION']) || empty($_SERVER['HTTP_AUTHORIZATION'])) {
            die(json_encode([
                'success' => false,
                'error' => 'no_auth_header',
            ]));
        }

        if($_SERVER['HTTP_AUTHORIZATION'] != $sx_key){
            die(json_encode([
                'success' => false,
                'error' => 'invalid_auth',
            ]));
        }
    }

	function get($path, $params = "", $steamId = "") {
		$steamId = $steamId != "" ? $steamId : getSteamID();

		global $api_key, $base_url;
		$steamId = toCommunityID($steamId);

		$url = "$base_url/$path?__steamId=$steamId&api_key=$api_key&$params";

		$ch = curl_init($url);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		curl_setopt($ch, CURLOPT_HEADER, 0);
		$data = curl_exec($ch);
		curl_close($ch);

		return $data;
	}
?>