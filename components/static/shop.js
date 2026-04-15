export let Shop = {

	// CARTS
	put_carts: async function (dataCollect) {
		let api = new ApiClass();
		await api.put('carts', dataCollect.combinedData);
		return api.response;
	},

	post_carts: async function (dataCollect) {
		let api = new ApiClass();
		await api.post('carts', dataCollect.combinedData);
		return api.response;
	},

	get_cart: async function (dataCollect) {
		let endpoint = Helpers.combineRequest('cart', dataCollect.combinedData);
		let api = new ApiClass();
		await api.get(endpoint, false);
		return api.response;
	},

	delete_carts: async function (dataCollect) {
		let api = new ApiClass();
		await api.delete(`carts/${dataCollect.combinedData.id}`, dataCollect);
		return api.response;
	},


	// ORDERS
	get_orders: async function (dataCollect) {
		let endpoint = Helpers.combineRequest('orders', dataCollect.combinedData);
		let api = new ApiClass();
		await api.get(endpoint, false);
		return api.response;
	},

	post_orders: async function (dataCollect) {
		const paymentMethod = dataCollect?.combinedData?.payment_method;

		const api = new ApiClass();

		// Фикс за safari редирект
		if (paymentMethod === 'stripe') {
			api.post('orders', dataCollect.combinedData);
			return; // приключваш тук
		}

		// OTHER METHODS: изчакваш резултат
		await api.post('orders', dataCollect.combinedData);

		const response = api.response;
		if (response?.status == 1) {
			href(`/${LANG}/ordersummary?order_id=${response.order_id}`);
		}

		return response;
	},

	put_orders: async function (dataCollect) {
		let api = new ApiClass();
		await api.put('orders', dataCollect.combinedData);
		return api.response;
	},


	// COMBINATIONS
	get_combinations: async function (dataCollect) {
		let endpoint = Helpers.combineRequest('combinations', dataCollect.combinedData);
		let api = new ApiClass();
		await api.get(endpoint, true);
		return api.response;
	},


	// CATEGORIES
	get_categories: async function (dataCollect) {

		let endpoint = Helpers.combineRequest('categories', dataCollect.combinedData);
		let api = new ApiClass();
		await api.get(endpoint, true);
		return api.response;
	},


	// PRODUCTS
	get_products: async function (dataCollect) {

		let endpoint = Helpers.combineRequest("products", dataCollect.combinedData);

		const api = new ApiClass();
		await api.get(endpoint, false);

		if (dataCollect.pushurl) {
			const cleanEndpoint = endpoint.replace("products", "");
			history.replaceState(null, null, window.location.pathname + cleanEndpoint);
		}

		return api.response;
	},


	// WISHLIST
	post_wishlist: async function (dataCollect) {
		let api = new ApiClass();
		await api.post('wishlist', dataCollect.combinedData);
		return api.response;
	},

	delete_wishlist: async function (dataCollect) {
		;
		let api = new ApiClass();
		await api.delete(`wishlist/${dataCollect.combinedData.id}`);
		return api.response;
	},

	get_wishlist: async function (dataCollect) {
		let endpoint = Helpers.combineRequest('wishlist', dataCollect.combinedData);
		let api = new ApiClass();
		await api.get(endpoint, false);
		return api.response;
	},


	// PROMOCODES
	post_promocode: async function (dataCollect) {
		let api = new ApiClass();
		await api.post('promocode', dataCollect.combinedData);
		return api.response;
	},

	delete_promocode: async function (dataCollect) {
		let api = new ApiClass();
		await api.delete('promocode', dataCollect.combinedData);
		return api.response;
	},


	// CART COMBINATIONS
	delete_cart_combination: async function (dataCollect) {
		let api = new ApiClass();
		await api.delete('cart_combination', dataCollect.combinedData);
		return api.response;
	},


	// FAVOURITES
	get_favourites: async function (dataCollect) {
		let endpoint = Helpers.combineRequest('favourites', dataCollect.combinedData);
		let api = new ApiClass();
		await api.get(endpoint, false);
		return api.response;
	},


	// PRODUCT FILTERS
	get_product_filters: async function (dataCollect) {
		let endpoint = Helpers.combineRequest('product_filters', dataCollect.combinedData);
		let api = new ApiClass();
		await api.get(endpoint, false);
		return api.response;
	},


	// PRODUCT ATTRIBUTES
	get_product_attributes: async function (dataCollect) {
		let endpoint = Helpers.combineRequest('product_attributes', dataCollect.combinedData);
		let api = new ApiClass();
		await api.get(endpoint, false);
		return api.response;
	},

};

window.Shop = Shop;
