

export let Helpers = {

    amount: function (val) {
        let num = parseFloat(val);
        let formatted = !isNaN(num) ? num.toFixed(2) : val;
        return `<span style="display:block; text-align:right; white-space:nowrap;">${formatted} ` + CURRENCY + `</span>`;
    },

    randomColor: function (idx, offset = 0) {

        const palette = ['brand', 'rose', 'emerald', 'amber', 'indigo']; // 5 цвята
        const n = palette.length;
        const i = Math.abs(parseInt(idx, 10) || 0);
        const o = Math.abs(parseInt(offset, 10) || 0);
        return palette[(i + o) % n];
    },


    clear_form_data: function (form) {
        for (let i = 0; i < form.elements.length; i++) {
            let e = form.elements[i];
            e.value = '';
        }
        return true;
    },

    show_errors: function (request) {

        Helpers.old_errors_remove();

        if (request == undefined || request.status == undefined) {
            return;
        }
        // Ако статус = 1 изписваме генерално съобщение
        if (request.status == 1 && request.msg) {
            Helpers.show_toast_msg(request.msg, 'success');
        }

        // При статус = 0 добавяме грешка към елемент или изписваме генерална грешка.
        if (request.status == 0 && request.errors) {

            for (const e in request.errors) {

                if (request.errors.hasOwnProperty(e)) {

                    // Грешка за конкретен елемент
                    if (e.includes('name=')) {
                        let elements = document.querySelectorAll(e);

                        for (const element of elements) {
                            element.parentNode.innerHTML += '<p class="msg-error text-red-600 !text-xs font-normal">' + `${request.errors[e]}` + '</p>';
                        }
                    }

                    // Генерална грешка Тоаст
                    else {
                        Helpers.show_toast_msg(request.errors[e], 'error');
                    }
                }

            }

        }

    },

    old_errors_remove: function () {

        const msg_errors = document.querySelectorAll('.msg-error');
        msg_errors.forEach(msg => {
            msg.remove();
        });

        const help_block = document.querySelectorAll('.help-block');
        help_block.forEach(msg => {
            msg.remove();
        });
    },

    show_toast_msg: function (msg, type) {
        document.getElementById('notification').dispatchEvent(new CustomEvent('notice', { detail: { text: msg, type: type }, bubbles: true }));
    },

    combineRequest: function (functionCall, parameters) {

        let endpoint = functionCall;
        let url_parameters = '';

        const objParameters = parameters;
        for (const key in objParameters) {

            if (objParameters.hasOwnProperty(key)) {
                if (key === 'id') {
                    endpoint += '/' + objParameters[key];
                } else {

                    // CHECK DO WE HAVE OLD KEYS IN ENDPOINT AND REPLACE THEM
                    const regex = new RegExp("[&?]" + key + "=\\w+", "g");

                    endpoint = endpoint.replace(regex, '');
                    if (Array.isArray(objParameters[key])) {
                        let tmpKey = key;

                        if (!key.endsWith('[]')) {
                            tmpKey = `${key}[]`;
                        }

                        for (const value of objParameters[key]) {
                            if (value != 'empty') {
                                url_parameters += tmpKey + '=' + value + '&';
                            }
                        }
                    } else {
                        //
                        if (objParameters[key] != 'empty' && objParameters[key] != '') {

                            url_parameters += key + '=' + objParameters[key] + '&';
                        }
                    }


                }
            }
        }


        if (url_parameters != '') {
            if (!endpoint.includes('?')) {
                endpoint += '?' + url_parameters;
            } else {
                endpoint += '&' + url_parameters;
            }
        }

        if (endpoint.substr(endpoint.length - 1) === '&' || endpoint.substr(endpoint.length - 1) === '?') {
            endpoint = endpoint.slice(0, -1);
        }
        return endpoint;
    },

    pagination: function (pagination) {
        let current = pagination.current_page,
            last = pagination.total_pages,
            delta = 2,
            left = current - delta,
            right = current + delta + 1,
            range = [],
            rangeWithDots = [],
            l;

        for (let i = 1; i <= last; i++) {
            if (i == 1 || i == last || i >= left && i < right) {
                range.push(i);
            }
        }

        for (let i of range) {
            if (l) {
                if (i - l === 2) {
                    rangeWithDots.push(l + 1);
                } else if (i - l !== 1) {
                    rangeWithDots.push('...');
                }
            }
            rangeWithDots.push(i);
            l = i;
        }
        pagination.pagesArray = rangeWithDots;
        pagination.firstElementShown = (pagination.current_page - 1) * pagination.results_per_page + 1;
        pagination.lastElementShown = Math.min(pagination.current_page * pagination.results_per_page, pagination.total_results);
        pagination.prevPage = pagination.current_page > 1;
        pagination.nextPage = pagination.current_page < pagination.total_pages;

        return pagination;
    },

    getDaysOfMonth(year, month) {

        let daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        if (LANG == 'bg') {
            daysOfWeek = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
        }


        let result = [];

        const daysInMonth = new Date(year, month, 0).getDate();


        for (let day = 1; day <= daysInMonth; day++) {

            let currentDate = new Date(year, month - 1, day);
            let dayOfWeek = currentDate.getDay();

            result.push({
                day: day,
                name: daysOfWeek[dayOfWeek],
                dayIndex: dayOfWeek,
            });


        }

        return result;


    },

    getMonthTitleByIndex(monthIndex) {
        let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

        if (LANG == 'bg') {
            months = ["Януари", "Февруари", "Март", "Април", "Май", "Юни", "Юли", "Август", "Септември", "Октомври", "Ноември", "Декември"];
        }

        return months[monthIndex - 1];
    },

    getDayTitleByIndex(dayIndex) {
        // 0 = Monday ... 6 = Sunday
        let days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

        if (LANG === 'bg') {
            days = ["Неделя", "Понеделник", "Вторник", "Сряда", "Четвъртък", "Петък", "Събота"];
        }

        return days[dayIndex];
    },


    formatDate(dateString, format = null, full = false) {
        // Ако е точно "0000-00-00" → връщаме фиксирания стринг
        if (dateString === "0000-00-00") {
            return "00.00.0000";
        }

        // Ако липсва стойност или не може да се парсне → връщаме празен стринг
        if (!dateString) {
            return "";
        }

        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return "";
        }

        // части от валидната дата
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        const hh = String(date.getHours()).padStart(2, "0");
        const mm = String(date.getMinutes()).padStart(2, "0");
        const ss = String(date.getSeconds()).padStart(2, "0");

        // избор на формат
        const useFormat = format || 'long';

        let formattedDate;
        switch (useFormat) {
            case "bg":        // 20.08.2025
                formattedDate = `${d}.${m}.${y}`;
                break;
            case "dot":       // 20.08.2025
                formattedDate = `${d}.${m}.${y}`;
                break;
            case "slashYMD":  // 2025/08/20
                formattedDate = `${y}/${m}/${d}`;
                break;
            case "slashDMY":  // 20/08/2025
                formattedDate = `${d}/${m}/${y}`;
                break;
            case "long":      // 20 август 2025 г.
                formattedDate = date.toLocaleDateString("bg-BG", { day: "2-digit", month: "long", year: "numeric" });
                break;
            default:          // 2025-08-20
                formattedDate = `${y}-${m}-${d}`;
                break;
        }

        if (full) {
            formattedDate += ` ${hh}:${mm}:${ss}`;
        }

        return formattedDate;
    },


    // стартира loading върху елемент и връща cleanup()
    startLoading(el, opts = {}) {
        if (!el || !(el instanceof Element)) return { skip: true, el: null, cleanup: () => { } };

        // само ако има Alpine @click / x-on:click
        const names = el.getAttributeNames ? el.getAttributeNames() : [];
        const hasClickAttr = names.some(n =>
            n === '@click' || n.startsWith('@click.') ||
            n === 'x-on:click' || n.startsWith('x-on:click.')
        );
        if (!hasClickAttr) return { skip: false, el, cleanup: () => { } };

        // guard срещу двойно натискане
        if (el.hasAttribute('loading')) return { skip: true, el, cleanup: () => { } };

        const position = opts.position ?? 'left'; // 'left' | 'right'
        const spinnerClass = opts.spinnerClass ?? 'fa-solid fa-loader animate-spin animate-duration-2000 loader';

        el.setAttribute('loading', '1');
        el.setAttribute('aria-busy', 'true');

        const textLikeTags = new Set(['A', 'BUTTON', 'P', 'SPAN', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LABEL', 'SMALL', 'STRONG', 'TD']);

        // запази предишни състояния
        const prev = {
            disabled: el.disabled,
            pointerEvents: el.style.pointerEvents || '',
            display: el.style.display || '',
            alignItems: el.style.alignItems || '',
        };

        let spinnerEl = null;
        if (textLikeTags.has(el.tagName)) {
            spinnerEl = document.createElement('i');
            spinnerEl.className = spinnerClass;
            spinnerEl.setAttribute('data-spinner', '');

            if (position === 'left') {
                spinnerEl.style.marginRight = '0.5rem';
                if (!prev.display) el.style.display = 'inline-flex';
                if (!prev.alignItems) el.style.alignItems = 'center';
                el.insertBefore(spinnerEl, el.firstChild);
            } else {
                spinnerEl.style.marginLeft = '0.5rem';
                el.appendChild(spinnerEl);
            }
        }

        if (el.tagName === 'BUTTON') el.disabled = true;
        else el.style.pointerEvents = 'none';

        const cleanup = (el) => {
            window.el = el;
            el.removeAttribute('loading');
            el.setAttribute('aria-busy', 'false');
            if (spinnerEl && spinnerEl.parentNode) spinnerEl.remove();
            if (el.tagName === 'BUTTON') el.disabled = prev.disabled;
            else el.style.pointerEvents = prev.pointerEvents;
            el.style.display = prev.display;
            el.style.alignItems = prev.alignItems;
        };

        return { skip: false, el, cleanup };
    },

    loadFile(url) {
        return new Promise((resolve, reject) => {
            let el;

            if (url.endsWith(".js")) {
                el = document.createElement("script");
                el.src = url;
                el.async = true;
            }
            else if (url.endsWith(".css")) {
                el = document.createElement("link");
                el.rel = "stylesheet";
                el.href = url;
            }
            else {
                reject(new Error("Unsupported file type: " + url));
                return;
            }

            el.onload = () => resolve(url);
            el.onerror = () => reject(new Error("Failed to load " + url));
            document.head.appendChild(el);
        });
    },

    image(size) {
        if (size == 'user') {
            return '/static/images/user.webp'
        }
        if (size == 'product') {
            return '/static/images/product.webp'
        }
        if (size == '1920') {
            return '/static/images/1920x1080.webp'
        }
        if (size == '1024') {
            return '/static/images/1024x768.webp'
        }
        if (size == '800') {
            return '/static/images/800x600.webp'
        }
        if (size == '640') {
            return '/static/images/640x450.webp'
        }
    },





};

window.Helpers = Helpers