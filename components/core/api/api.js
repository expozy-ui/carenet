(async function () {
	await import(`./cache.js?v=${JS_VERSION}`);
})();

export const lang = LANG;
export const currency = localStorage.getItem('currency');

export class ApiClass {
	constructor() {
		this.response = null;
		this.statusCode = null;
	}

	// -----------------------------
	//   Общ метод за заявка
	// -----------------------------
	/**
	 * @param {string} method
	 * @param {string} endpoint
	 * @param {object|null} data
	 * @param {boolean} cachable
	 */
	async request(method, endpoint, data = null, cachable = false) {
		const url = this.buildUrl(endpoint);

		this.response = null;
		this.statusCode = null;

		// ---- GET с cache (само JSON cache) ----
		if (method === 'GET') {
			const cached = await cacheGet(url);
			if (cachable && cached && Object.keys(cached).length > 0) {
				this.response = cached;
				this.statusCode = 200;
				return cached;
			}
		}

		try {
			const options = this.buildOptions(method, data);
			const response = await fetch(url, options);



			this.statusCode = response.status;

			// ---- FILE response (винаги download ако е файл) ----
			if (this.isFileResponse(response)) {
				const blob = await response.blob();

				// Името идва от response header Content-Disposition
				const filename = this.extractFilename(response, 'download');
				// Винаги сваляй файла (ако response е ok)
				if (response.ok) {
					this.downloadBlob(blob, filename);
				}

				this.response = {
					file: true,
					ok: response.ok,
					status: response.status,
					filename,
					blob,
					contentType: blob.type || response.headers.get('content-type') || ''
				};

				return this.response;
			}

			// ---- НЕ Е файл -> JSON/Text flow ----
			const json = await this.parseNonFileResponse(response);
			this.response = json;

			// redirect само за JSON object
			if (json && typeof json === 'object' && json.redirect) {
				location.href = json.redirect;
			}

			// cache само за GET + успешен JSON обект
			if (method === 'GET' && response.ok && json && typeof json === 'object') {
				await cacheSet(url, json);
			}

			return json;
		} catch (err) {
			console.error('API ERROR:', err);
			this.response = { error: true, msg: err.message };
			return this.response;
		}
	}

	// -----------------------------
	//   Методи за удобство
	// -----------------------------
	get(endpoint, cachable = false) {
		return this.request('GET', endpoint, null, cachable);
	}

	post(endpoint, data) {
		return this.request('POST', endpoint, data, false);
	}

	put(endpoint, data) {
		return this.request('PUT', endpoint, data, false);
	}

	delete(endpoint, data) {
		return this.request('DELETE', endpoint, data, false);
	}

	// -----------------------------
	//   Помощни методи
	// -----------------------------
	buildUrl(endpoint) {
		const tmp = endpoint.split('?');
		let url = COREURL + tmp[0] + '?lang=' + lang;

		if (currency !== undefined && currency !== null && currency !== '') {
			url += '&currency=' + currency;
		}

		if (tmp[1] !== undefined) {
			url += '&' + tmp[1];
		}

		return url;
	}

	buildOptions(method, data) {
		const headers = {
			authentication: 'basic ' + SAAS_KEY,
			authorization: this.getAuth()
		};

		const options = {
			method,
			mode: 'cors',
			cache: 'no-cache',
			headers
		};

		// --- GET ---
		if (method === 'GET') return options;

		// --- DELETE ---
		if (method === 'DELETE') {
			options.headers['Content-Type'] = 'application/json';
			options.body = JSON.stringify(data ?? {});
			return options;
		}

		// --------------------------
		//   POST / PUT / PATCH
		// --------------------------
		let containsFile = false;

		if (data && typeof data === 'object') {
			for (const key in data) {
				const value = data[key];

				if (value instanceof File) {
					containsFile = true;
					break;
				}

				if (Array.isArray(value) && value.length > 0 && value[0] instanceof File) {
					containsFile = true;
					break;
				}
			}
		}

		// Ако НЯМА файлове -> JSON
		if (!containsFile) {
			options.headers['Content-Type'] = 'application/json';
			options.body = JSON.stringify(data ?? {});
			return options;
		}

		// Ако ИМА файлове -> FormData
		const formData = new FormData();

		for (const key in data) {
			const value = data[key];

			if (Array.isArray(value) && value.length > 0 && value[0] instanceof File) {
				// multiple files
				value.forEach(file => {
					formData.append(key.endsWith('[]') ? key : key + '[]', file);
				});
			} else if (Array.isArray(value)) {
				// multi-select / list values
				value.forEach(v => formData.append(key, v));
			} else if (value !== undefined && value !== null) {
				// regular field
				formData.append(key, value);
			}
		}

		options.body = formData;
		return options;
	}

	isFileResponse(response) {
		const disposition = (response.headers.get('content-disposition') || '').toLowerCase();
		const contentType = (response.headers.get('content-type') || '').toLowerCase();

		// 1) Ясен сигнал от backend
		if (disposition.includes('attachment')) return true;

		// 2) Ако НЕ е JSON, приемаме че е файл/binary payload
		if (!contentType.includes('application/json')) return true;

		return false;
	}

	async parseNonFileResponse(response) {
		const contentType = (response.headers.get('content-type') || '').toLowerCase();

		// 1) JSON
		if (contentType.includes('application/json')) {
			return await response.json().catch(() => ({}));
		}

		// 2) Text fallback (и опит за JSON parse ако backend е без правилен header)
		const text = await response.text().catch(() => '');
		if (!text) return {};

		try {
			return JSON.parse(text);
		} catch {
			return { raw: text };
		}
	}

	/**
	 * Взима filename от Content-Disposition.
	 * Нужен е backend header:
	 * Access-Control-Expose-Headers: Content-Disposition, Content-Type
	 */
	extractFilename(response, fallback = 'download') {
		const cd = response.headers.get('Content-Disposition') || '';

		let m = cd.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
		if (m?.[1]) {
			try { return decodeURIComponent(m[1].replace(/["']/g, '')); }
			catch { return m[1].replace(/["']/g, ''); }
		}

		m = cd.match(/filename\s*=\s*"([^"]+)"/i);
		if (m?.[1]) return m[1];

		m = cd.match(/filename\s*=\s*([^;]+)/i);
		if (m?.[1]) return m[1].trim().replace(/["']/g, '');

		return fallback; // <- вече е "download"
	}

	downloadBlob(blob, filename = 'file.bin') {
		const objectUrl = URL.createObjectURL(blob);

		try {
			// Не добавяме елемента в DOM -> SPA delegated listeners обикновено не го хващат
			const a = document.createElement('a');
			a.href = objectUrl;
			a.download = filename;
			a.rel = 'noopener noreferrer';
			a.click();
		} finally {
			setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
		}
	}

	getAuth() {
		const sessionId = /SESS\w*ID=([^;]+)/i.test(document.cookie) ? RegExp.$1 : false;

		return localStorage.getItem('token')
			? 'bearer ' + localStorage.getItem('token')
			: 'session ' + sessionId;
	}
}
