

export class PageClass {

	constructor() {
		this.reset();
	}

	reset() {
		this.type = null;
		this.id = 0;
		this.title = null;
		this.html = null;
		this.url = null;
		this.error404 = null;
		this.lang = null;
		this.slug = null;
		this.css = null;
		this.target_id = 0;
		this.seo_tags = null;
		this.seo_title = null;
		this.seo_description = null;
		this.seo_image = null;
		this.private = false;
	}

	async get() {
		this.reset();
		this.url = window.location.href;

		var pathname = new URL(this.url).pathname;

		var splitUrl = pathname.split('/');
		this.slug = splitUrl[2];

		if (splitUrl[2] == 'product' || splitUrl[2] == 'post') {
			this.type = splitUrl[2];
		}
		else this.type = 'index';

		if (this.type === 'post') {
			this.id = 16;
		}

		if ((splitUrl.length === 2 && splitUrl[1] === '') || (splitUrl.length > 2 && splitUrl[2] === '')) {
			this.slug = 'homepage';
			this.id = 1;

		} else {


			if (typeof splitUrl[3] !== 'undefined') {
				var tmp3 = splitUrl[3].split('-');
				this.target_id = parseInt(tmp3[0]);
			} else {
				this.slug = splitUrl[2];
			}
		}

		this.lang = splitUrl[1];


		if (!this.lang) {
			this.lang = LANG;
		}

		const api = new ApiClass();

		if (this.id > 0) {

			await api.get('pages/' + this.id);
		} else {
			await api.get('pages?slug=' + this.slug);
		}



		let page = api.response;


		if (api.statusCode != 200) {
			window.location.href = "/404";
		}


		//this.html = page.description;
		this.id = page.id;
		this.title = page.title;
		this.css = page.css;
		this.url = page.url;
		//this.target_id = 0;
		this.seo_tags = page.seo_tags;
		this.seo_title = page.seo_title;
		this.seo_description = page.seo_description;
		this.private = page.private;


		this.updateMeta();

		// let response_html = await fetch(this.get_template_url());

		let template_url = this.get_template_url();
		let response_html = await fetch(`${template_url}?v=${JS_VERSION}`);

		if (response_html.status == 200) {
			let html = await response_html.text(); // Returns it as Promise
			this.html = html;
		}

		let response_css = await fetch(this.get_css_url());

		if (response_css.status == 200) {
			let css = await response_css.text(); // Returns it as Promise
			this.css = css;
		}

		return this;
	}



	async load() {
		this.reset();

		//seo title

		await this.get();
		// ;

		// GET ALL URL PARAMETERS
		let parameters = new URL(window.location.href).searchParams;
		parameters.forEach(function (value, key) {

			if (key.endsWith('[]')) {
				if (data.pageUrl[key] == undefined) data.pageUrl[key] = [];
				data.pageUrl[key].push(value);
			} else {
				data.pageUrl[key] = value;
			}
		});

		if (this.type !== 'post' && "post" in data) {
			data['post'] = { description: '' };
		}

		if (this.type !== 'product' && "product" in data) {
			delete data['product'];
		}



		if (window.location.pathname.includes("products") && "products" in data) {
			delete data['products']['result'];
			delete data['products']['pagination'];
		}

		data['corePage'] = this;



		// ;

		if (this.slug != 'checkout') {
			document.getElementById('header').style.removeProperty('display');
			document.getElementById('footer').style.removeProperty('display');
		} else {
			document.getElementById('header').style.display = "none";
			document.getElementById('footer').style.display = "none";
		}


		document.getElementById('pageCss').innerHTML = this.css;

		this.html += '<div x-init="callBackMain()"></div>';

		document.getElementById('main').innerHTML = this.html;

		// INIT SCRIPT FROM NEW HTML
		initScripts();
	}


	gen_editor_url(token) {

		let dataJson = {
			'token': token,
			'type': this.type,
			'id': this.id
		};

		return SITEURL + '/editor/cb/editor.php?lang=' + LANG + '&i=' + btoa(JSON.stringify(dataJson));


	}

	async saveCss() {
		const styles = document.getElementById('tailwindCss').getElementsByTagName('style');
		const lastElement = styles[styles.length - 1];
		const lastElementString = lastElement.outerHTML;
		let html = '';

		// let response = await fetch(this.get_template_url());

		let template_url = this.get_template_url();
		let response = await fetch(`${template_url}?v=${JS_VERSION}`);

		if (response.status == 200) {
			let html = await response.text(); // Returns it as Promise
			this.html = html;
		}


		const reqBody = {
			description: this.html,
			css: lastElementString,
			page_id: this.id
		};

		let api = new ApiClass();
		api.post('revisions?lang=' + this.lang, reqBody);

		fetch("/pages/editor.php?lang=" + this.lang, {
			method: 'POST',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ saveCss: 1, css: lastElementString, slug: this.slug })
		}).then(response => response.json().then(dataRes => {
			if (dataRes.status == 1) {
				window.location.reload();
			} else {
				Helpers.show_toast_msg('Save failed', 'error');
			}

		}));

	}



	get_template_url() {

		if (this.private) {
			return `${SITEURL}/pages/privatejs.php?lang=${this.lang}&slug=${this.slug}`;

		} else {
			return `${SITEURL}/static/pages/${this.lang}/${this.slug}.html`;
		}

	}

	get_css_url() {

		return `${SITEURL}/static/css/${this.lang}/${this.slug}.css?v=${JS_VERSION}`;
	}


	async updateMeta() {

		let api = new ApiClass();



		//;
		if (this.slug === 'product') {
			await api.get('products/' + this.target_id);
			let response = api.response;

			this.seo_title = response.seo_title.trim() !== '' ? response.seo_title : response.title;
			this.seo_description = response.seo_description !== '' ? response.seo_description : `${response.title} - ${SITENAME}`;
			this.seo_image = response.images[0] !== undefined ? response.images[0].image : LOGO_URL;
			this.seo_tags = response.seo_tags !== '' ? response.seo_tags : this.seo_title;

		} else if (this.slug === 'products' && this.target_id > 0) {
			await api.get('categories/' + this.target_id);
			let response = api.response;

			this.seo_title = response.title;
			this.seo_description = response.description !== '' ? response.description : this.seo_description;
			this.seo_image = response.image_url !== '' ? response.image_url : LOGO_URL;
			this.seo_tags = this.seo_title;


		} else if (this.slug === 'post') {
			await api.get('blogPosts/' + this.target_id);
			let response = api.response;

			this.seo_title = response.seo_title.trim() !== '' ? response.seo_title : response.title;
			this.seo_description = response.seo_description.trim() !== '' ? response.seo_description : `${response.title} - ${SITENAME}`;
			this.seo_image = response.images[0] !== undefined ? response.images[0].url : LOGO_URL;
			this.seo_tags = response.tags !== '' ? response.tags : this.seo_title;

		} else if (this.slug === 'blog' && this.target_id > 0) {
			await api.get('blogCategories/' + this.target_id);
			let response = api.response;

			this.seo_title = response.title;
			this.seo_tags = this.seo_title;

		}


		if (this.seo_title === '') {
			this.seo_title = this.title;
		}
		if (this.seo_description === '') {
			this.seo_description = this.seo_title;
		}
		if (this.seo_tags === '') {
			this.seo_tags = this.seo_title;
		}

		this.seo_tags = prepareTags(this.seo_tags);

		let seo_description = document.getElementsByClassName('seo_description');
		for (const e of seo_description) {
			e.content = this.seo_description;
		}

		let seo_title = document.getElementsByClassName('seo_title');
		for (const e of seo_title) {
			e.content = this.seo_title;
		}

		let seo_images = document.getElementsByClassName('seo_image');
		for (const e of seo_images) {
			e.content = this.seo_image;
		}

		let seo_tags = document.getElementsByClassName('seo_tags');
		for (const e of seo_tags) {
			e.content = this.seo_tags;
		}


		document.title = `${this.seo_title}`;
	}


	async getAllPages() {
		let api = new ApiClass();

		await api.get('pages?page=1&limit=5');

		const resultsPerPage = Api.response.pagination.results_per_page;
		let currentPage = Api.response.pagination.current_page;
		let totalPages = Api.response.pagination.total_pages;

		let allResults = Api.response.result;

		while (currentPage <= totalPages) {
			currentPage++;

			try {
				await api.get('pages?limit=' + resultsPerPage + '&page=' + currentPage);
				if (!Api.response.result) {
					throw new Error(`Грешка при извличане на страница ${currentPage}`);
				}

				const pageResults = Api.response.result;
				allResults = allResults.concat(pageResults);


			} catch (error) {
				console.error(error);
				break;
			}
		}

		return allResults;
	}






};

function prepareTags(string) {
	if (Array.isArray(string)) {
		return string.join(", ");
	}

	return string.replace(/ /g, ', ');
}


window.Page = new PageClass();
// window.PageClass = PageClass;
//Page.getAllPages()
//  .then((allPages) => {
//    console.log(allPages);
//  })
//  .catch((error) => {
//    console.error(error);
//  });
