let params = new URLSearchParams(window.location.search);
const authToken = params.get("token");

async function updatepay() {
	const data = await $.post(
		`/payment.php?token=${authToken}`,
		{},
		{
			dataType: "json",
			xhrFields: {
				withCredentials: true,
			},
			crossDomain: true,
		}
	).then(JSON.parse);

	$(".pay").empty();

	for (let item of data) {
		if (item.state != "pending") {
			continue;
		}

		$(".pay").append(`
            <text>${item.item.title}</text>
            <button id="${item.id}">buy for ${item.price},-</button>
        `);
		$(`#${item.id}`).click(() => {
			sx.moneyRequest(
				"https://" + window.location.host + "/paymentcompleted.php",
				item.id,
				item.price
			);
		});
	}
}

async function download({id, fileName}) {
	const { type, content } = await $.post(
		`/download.php?token=${authToken}&id=${id}`,
		{},
		{
			dataType: "json",
			xhrFields: {
				withCredentials: true,
			},
			crossDomain: true,
		}
	).then(JSON.parse);

	console.log(type, content)

	if (type === "e2") {
		sx.openExpression(atob(content));
	} else if (type === "dupe") {
		sx.saveDupe(`${fileName}[sx].txt`, content);
	}
}

const pattern = /\s/g;
async function updatebought() {
	const data = await $.post(
		`/bought.php?token=${authToken}`,
		{},
		{
			dataType: "json",
			xhrFields: {
				withCredentials: true,
			},
			crossDomain: true,
		}
	).then(JSON.parse);

	$(".bought").empty();

	for (const item of data) {
		const fileName = item?.title?.toLowerCase()?.replace(/[^\w\s]/gi, '')?.replace("  ", " ") ?? 'invalidfilename';
		const id = item._id
		
		console.log(fileName)

		$(".bought")
			.append(
				`<text>${item.title}</text>
				<button id="${id}">Spawn...</button>`
			).unbind("click").on('click', function() {
				download({
					id: id,
					fileName: fileName
				});
			});
	}
}

async function update() {
	await updatepay();
	await updatebought();
}
update();
setInterval(update, 5000);
