export let Newsletter = {

	post_newsletter: async function (dataCollect) {
		;
		// Добавяме специалния флаг
		dataCollect['newsletter-checkbox'] = true;

		let api = new ApiClass();
		await api.post('subscribe', dataCollect.combinedData);

		return api.response;
	},

	delete_subscribe: async function (dataCollect) {

		// delete → работи като get (combineRequest)
		let endpoint = Helpers.combineRequest('subscribe', dataCollect.combinedData);

		let api = new ApiClass();
		await api.delete(endpoint, dataCollect);

		return api.response;
	},

};

window.Newsletter = Newsletter;
