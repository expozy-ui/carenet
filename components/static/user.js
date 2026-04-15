export let User = {

	login: async function (dataCollect) {

		let response = [];
		let api = new ApiClass();
		await api.post('login', dataCollect.combinedData);

		if (api.response.status === 1) {

			api.response.user['logged_in'] = true;
			response['obj'] = api.response.user;
			data.user = response['obj'];

			if (!dataCollect.combinedData.same_page) {
				href('/userpage');
			} else {
				window.location.reload();
			}

			localStorage.setItem('token', api.response.token);

			fetch('/pages/editorLogin.php', {
				method: 'POST',
				cache: 'no-cache',
				credentials: 'same-origin',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ login: 1, user: api.response.user, token: api.response.token })
			}).then(res => res.json()).then(function (response2) {
			});

			return response;
		} else {
			return api.response;
		}
	},

	// POST USERS
	post_users: async function (dataCollect) {

		let api = new ApiClass();
		await api.post('users', dataCollect.combinedData);

		if (api.response.status == 1) {
			api.response.user['logged_in'] = true;
			data.user = api.response.user;
			href('/userpage');
			localStorage.setItem('token', api.response.token);
		}

		return api.response;
	},

	// UPDATE ACCOUNT
	put_accounts: async function (dataCollect) {
		let api = new ApiClass();
		await api.put('accounts', dataCollect.combinedData);
		return api.response;
	},

	// ADD USER ADDRESS
	post_user_address: async function (dataCollect) {
		let api = new ApiClass();
		await api.post('user_address', dataCollect.combinedData);

		if (api.response?.status === 1) {
			return await User.get_my_addresses({});
		}

		return api.response;
	},

	// DELETE USER ADDRESS
	delete_user_address: async function (dataCollect) {
		let endpoint = Helpers.combineRequest('user_address', dataCollect.combinedData);

		let api = new ApiClass();
		await api.delete(endpoint, dataCollect);

		if (api.response?.status === 1) {
			return await User.get_my_addresses({});
		}

		return api.response;
	},

	// GET ACCOUNT
	get_accounts: async function (dataCollect) {
		let api = new ApiClass();
		await api.get('accounts', false);

		if (api.response?.id && api.response.id !== 0) {
			api.response.logged_in = true;
		}

		return api.response;
	},

	// GET MY ADDRESSES
	get_my_addresses: async function (dataCollect) {
		if (!data.user.logged_in) return [];

		let api = new ApiClass();
		await api.get('my_addresses', false);
		return api.response;
	},

	// FORGOT PASSWORD
	post_forgot_password: async function (dataCollect) {
		let api = new ApiClass();
		await api.post('forgot_password', dataCollect.combinedData);
		return api.response;
	},



};

window.User = User;
