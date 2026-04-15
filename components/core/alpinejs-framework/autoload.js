window.data = {};


(async () => {
    window.deferAlpineInitialization = true;



    // Първо зареждаме всички основни модули
    const [
        { ApiClient },
        { ApiClass },
        { DataCollect },
        { DataTable },
        { default: DateHelper },
        { Helpers },
        { Page }
    ] = await Promise.all([
        import(`./api.js?v${JS_VERSION}`),
        import(`../api/api.js?v=${JS_VERSION}`),
        import(`./dataCollect.js?v${JS_VERSION}`),
        import(`./dataTable.js?v${JS_VERSION}`),
        import(`./dateHelper.js?v${JS_VERSION}`),
        import(`./helpers.js?v${JS_VERSION}`),
        import(`../classes/page.js?v${JS_VERSION}`)
    ]);


    // Дефинираме ги глобално
    Object.assign(window, { ApiClient, ApiClass, DataCollect, DataTable, DateHelper, Helpers });


    // 3️⃣ Импортираме Alpine.js
    const AlpineModule = await import(`./dist/alpine.js?v${JS_VERSION}`);
    window.Alpine = AlpineModule.default || window.Alpine;


    data = Alpine.reactive({
        corePage: PAGEINIT,
        user: USER,
        pageUrl: URL_PARAMETERS,
        settings: { logo: LOGO_URL, social: SOCIAL_NETWORKS },
        openCart: false,
        openMobileMenu: false,
        screenWidth: window.screen.width,
        scrollPosition: window.pageYOffset,
        openLogin: false,
        openRegistration: false,
        openProduct: false,
        openForgotten: false,
        openGeolocation: false,
        darkMode: JSON.parse(localStorage.getItem('dark') || 'false'),
        location: [],
        modals: [],
    });



    data.pageUrl = getUrlParameters();

    window.notification = function () {
        return {
            notices: [],
            visible: [],
            add(notice) {
                notice.id = Date.now();
                notice.type = notice.type;
                this.notices.push(notice);
                this.fire(notice.id);
            },
            fire(id) {
                this.visible.push(this.notices.find(notice => notice.id == id))
                const timeShown = 3000 * this.visible.length
                setTimeout(() => {
                    this.remove(id)
                }, timeShown)
            },
            remove(id) {
                const notice = this.visible.find(notice => notice.id == id)
                const index = this.visible.indexOf(notice)
                this.visible.splice(index, 1)
            },

        };
    };


    Alpine.directive("amount", (el, { expression }, { effect, evaluate }) => {
        // Добавяме text-right на самия елемент
        el.classList.add("text-right");

        effect(() => {
            // Взимаме стойността от Alpine контекста
            let val = evaluate(expression);

            // Проверка за валидно число
            let num = parseFloat(val);
            if (isNaN(num)) {
                el.textContent = "";
                return;
            }

            // Форматираме с 2 десетични + валута
            el.textContent = num.toFixed(2) + " " + (CURRENCY.symbol || "");

        });
    });

    Alpine.start();

})();






// Алпине е приключил с обхождането на файла
window.callBackMain = async function () {

    replaceImages();

    // Извикване заявките към ядрото
    await callApiData();

}



window.alpineListeners = async function (method, element) {
    try { element.preventDefault?.(); } catch (e) { }
    const dataCollect = new DataCollect(element);
    if (!method) {
        console.error('Методът не е зададен');
        return;
    }

    if (!dataCollect.element) {
        console.error('Елементът не е дефиниран');
        return;
    }


    const { skip, cleanup, el } = Helpers.startLoading(dataCollect.element);
    if (skip) return; // вече е в loading, прескачаме


    const apiClient = new ApiClient(method, dataCollect);
    ;
    try {
        const responseStatus = await apiClient.request();
        return responseStatus;
    } finally {
        ;
        cleanup(dataCollect.element); // премахва loading и спинъра
    }

}


window.callModal = function (el) {
    const dataCollect = new DataCollect(el);
    let modalsArray = [];

    if (!dataCollect.combinedData.modal) {
        data['modals'] = modalsArray;
        return 0;
    }

    if (data['modals'][dataCollect.combinedData.modal]) {
        modalsArray[dataCollect.modal] = false;
        data['activeModal'] = false;

    } else {
        modalsArray[dataCollect.combinedData.modal] = dataCollect.combinedData;
        data['activeModal'] = true;
    }

    data['modals'] = modalsArray;

    return true;
};

window.href = async function (url) {

    if (!url.includes(LANG) && url != '/') {
        url = `/${LANG}${url}`;
    }

    history.pushState(null, null, url);

    data['pageUrl'] = [];
    data['openMobileMenu'] = false;
    Page.load();
    document.getElementById('main').scrollIntoView(true);
}


async function callApiData() {

    let apiDataElements = document.querySelectorAll('[apiData]');
    let promises = [];
    for (const element of apiDataElements) {
        const dataCollect = new DataCollect(element);
        const apiClient = new ApiClient(element.getAttribute('apiData'), dataCollect);

        // събираме promise
        promises.push(apiClient.request());
    }

    // изчакваме всички да приключат
    try {
        const results = await Promise.all(promises);
        return results;
    } catch (err) {
        throw err;
    }
}

function getUrlParameters() {
    const params = {};
    const urlParams = new URLSearchParams(window.location.search);

    for (const [key, value] of urlParams.entries()) {

        // ако ключът вече съществува
        if (params.hasOwnProperty(key)) {

            // ако не е масив → превръщаме в масив
            if (!Array.isArray(params[key])) {
                params[key] = [params[key]];
            }

            params[key].push(value);
        } else {
            params[key] = value;
        }
    }

    return params;
}

function replaceImages() {
    const images = document.querySelectorAll('img');
    const bgElements = document.querySelectorAll('.is-overlay-bg');

    const sizeMap = [
        { max: 640, suffix: "800x600" },
        { max: 800, suffix: "800x600" },
        { max: 1024, suffix: "1024x768" },
        { max: Infinity, suffix: "" }  // full-size image
    ];

    function getBestSize(width) {
        for (const rule of sizeMap) {
            if (width < rule.max) return rule.suffix;
        }
    }

    function replaceSrc(url, width) {
        const size = getBestSize(width);
        if (!size) return url.replace("/10x10", "");   // remove placeholder
        return url.replace("10x10", size);
    }

    let observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            const el = entry.target;
            const w = el.clientWidth || el.offsetWidth || 0;

            // Handle <img>
            if (el.tagName === "IMG") {
                const oldSrc = el.getAttribute("src");
                el.src = replaceSrc(oldSrc, w);
            }

            // Handle background-image
            if (el.classList.contains("is-overlay-bg")) {
                const styles = getComputedStyle(el);
                const bg = styles.backgroundImage;

                if (bg && bg !== "none") {
                    // extract URL
                    const url = bg.slice(5, -2);
                    const newUrl = replaceSrc(url, w);
                    el.style.backgroundImage = `url(${newUrl})`;
                }
            }

            observer.unobserve(el);
        });
    });

    window.observer = observer;


    images.forEach(img => observer.observe(img));
    bgElements.forEach(el => observer.observe(el));
}

window.initScripts = function () {

    let scripts = document.getElementById("main").querySelectorAll("script");
    for (const script of scripts) {
        let newScript = document.createElement("script");

        let textContent = script.textContent;
        if (textContent === '') {
            let src = script.src
            newScript.setAttribute('src', script.src);
        }

        newScript.textContent = textContent;
        document.body.appendChild(newScript);
    }


    var scriptElement = document.createElement('script');
    scriptElement.src = `${SITEURL}/editor/cb/box/box-flex.js`;

    document.body.appendChild(scriptElement);
}


window.changeLang = function (newLang) {
    // СЪЩИЯ ЕЗИК Е ИЗБРАН
    if (LANG == newLang) return;

    if (window.location.href.includes(`/${LANG}/`)) {
        window.location.href = window.location.href.replace(`/${LANG}/`, `/${newLang}/`);
    } else {
        window.location.href = window.location.origin + `/${newLang}/`;
    }

}

window.addEventListener('resize', function (event) {
    data['screenWidth'] = window.screen.width;
}, true);

window.addEventListener('scroll', function (event) {
    data['scrollPosition'] = window.pageYOffset;
}, true);




