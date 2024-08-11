<?php
    include 'shared.php';
	   // This function is used to validate any webhook calls from the Stavox webserver.
    // Currently, the only webhook available, is the one sent by the moneyRequest api.
    
	validateWebhookCall();

    if (isset($_POST['steamid'], $_POST['amount'], $_POST['requesttoken'])) {
		$steamId = $_POST['steamid'];
		$amount = $_POST['amount'];
		$paymentId = $_POST['requesttoken'];

		get('payment/confirm', "paymentId=$paymentId&amount=$amount", $steamId);
	}


?>