
export class ApiClient {


    constructor(method, dataCollect) {

        const types = ['local', 'api'];
        const requestTypes = ['get', 'post', 'put', 'delete'];
        this.type = requestTypes.some(rt => method.startsWith(rt + '.')) ? types[1] : types[0];

        this.method = this.type == 'local' ? method : method.substring(method.indexOf('.') + 1);
        this.requestType = this.type == 'api' ? method.substring(0, method.indexOf('.')).toLowerCase() : '';
        this.response = {};
        this.dataCollect = dataCollect;
        this.endpoint = this._getEndpoint();
    }

    async request() {

        if (this.dataCollect.attributesData.confirm != undefined) {
            let msg = this.dataCollect.attributesData.confirm || _CONFIRM_MSG;
            var confirmResult = confirm(msg);
            if (!confirmResult) return 0;
        }

        this.response = await this._callFunction();

        if (Object.keys(this.response || {}).length === 0 && (this.requestType == 'post' || this.requestType == 'put')) {
            return Helpers.show_toast_msg('Системата не успя да обработи заявката.', 'error');
        }

        Helpers.old_errors_remove();



        if (this.response.pagination !== undefined) {
            this.response.pagination = Helpers.pagination(this.response.pagination);
        } else {
            for (const key in this.response) {
                if (
                    this.response[key] &&
                    typeof this.response[key] === "object" &&
                    this.response[key].pagination !== undefined
                ) {
                    this.response[key].pagination = Helpers.pagination(this.response[key].pagination);
                }
            }
        }


        if (this.response[this.dataCollect.keyGet] != undefined) {
            this.response.obj = this.response[this.dataCollect.keyGet];

        } else if (this.response.obj != undefined) {
            this.response.obj = this.response.obj;

        } else {
            this.response.obj = { ...this.response };
        }

        if (this.dataCollect.pushurl) {
            this.response.obj.pushurl = true;
            const cleanEndpoint = this.endpoint.replace(this.method, "");
            history.replaceState(null, null, window.location.pathname + cleanEndpoint);
        }

        if ("status" in this.response) {
            Helpers.show_errors(this.response);

            if (this.response.status === 1) {

                if ("clear" in this.dataCollect.attributesOptions && this.dataCollect.form.form) {
                    Helpers.clear_form_data(this.dataCollect.form.form);
                }
            }
        }


        if ('scroll' in this.dataCollect.attributesOptions) {
            document.getElementById('main').scrollIntoView(true);
        }

        // Ако имаме грешки поставяме отговора в друга променлива за да не счупваме обекта. 
        if (this.response.error != undefined || this.response.errors != undefined) {
            this.dataCollect.keyName = 'errorResponse';
        }
        if (this.dataCollect.keyName != '') {
            data[this.dataCollect.keyName] = this.response.obj;
        } else {
            data[this.method] = this.response.obj
        }

        let responseStatus = ("status" in this.response) ? this.response.status : 1


        // Дефинираме success или error callbacks на елемента.  
        const type = Number(responseStatus) === 0 ? 'error' : 'success';
        this.dataCollect.element.dispatchEvent(new CustomEvent(type, {
            detail: { response: this.response, status: Number(responseStatus) },
            bubbles: false
        }));


        // IF WE HAVE REDIRECT URL
        // if ("url" in this.response) return href(this.response.url);


        return responseStatus;

    }

    async _callFunction() {


        if (this.type === 'local') {

            // "moduleName.methodName"
            const [moduleName, functionName] = this.method.split('.');

            // lowerCamelCase за файл
            const importFile = moduleName.charAt(0).toLowerCase() + moduleName.slice(1);

            let module;

            try {
                // Зареждаме JS файла
                module = await import(`../../static/${importFile}.js?v=${JS_VERSION}`);
            } catch (error) {
                console.error(`File ../../static/${importFile}.js not found for local method: ${this.method}`);
                return { error: true, msg: "Local module file not found" };
            }

            // Функцията трябва да е експортирана от файла
            const fn = module[functionName] || (module[moduleName] && module[moduleName][functionName]);

            if (typeof fn !== "function") {
                console.error(`Function "${functionName}" not found in module ${importFile}.js`);
                return { error: true, msg: "Local function not found" };
            }

            try {
                // Извикваме локалната функция
                const result = await fn(this.dataCollect);
                return result;
            } catch (err) {
                console.error(`Error executing local function "${functionName}"`, err);
                return { error: true, msg: err.message };
            }
        }



        if (this.type == 'api') {

            let api = new ApiClass();

            try {

                // GET заявки нямат data
                if (this.requestType === 'get') {

                    // let endpoint = Helpers.combineRequest(this.method, this.dataCollect.combinedData);
                    return await api.get(this.endpoint);
                }

                // За post / put / delete → подаваме data
                return await api[this.requestType](this.endpoint, this.dataCollect.combinedData);

            } catch (error) {
                console.log(error);
            }
        }


        return [];

    }

    _getEndpoint() {
        // GET заявка → комбинираме параметрите
        if (this.requestType === 'get') {
            return Helpers.combineRequest(this.method, this.dataCollect.cleanData);
        }

        // DELETE заявка → ако има id → method/id
        if (this.requestType === 'delete') {
            const id = this.dataCollect.combinedData.id;

            if (id) {
                return `${this.method}/${id}`;
            }

            return this.method;
        }

        // Всички други → връщаме стандартния method
        return this.method;
    }

}