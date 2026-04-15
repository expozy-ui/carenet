var lang = localStorage.getItem('lang');
lang = 'bg';

if (lang != 'bg' && lang != 'en') {
    lang = 'en';
}
window.addEventListener('load', function () {
    // obtain plugin
    var cc = initCookieConsent();

    // run plugin with your configuration
    cc.run({
        current_lang: lang,
        // autoclear_cookies: true,                   // default: false
        // page_scripts: true,                        // default: false

        // mode: 'opt-in'                          // default: 'opt-in'; value: 'opt-in' or 'opt-out'
        // delay: 0,                               // default: 0
        // auto_language: '',                      // default: null; could also be 'browser' or 'document'
        // autorun: true,                          // default: true
        // force_consent: false,                   // default: false
        // hide_from_bots: false,                  // default: false
        // remove_cookie_tables: false             // default: false
        // cookie_name: 'cc_cookie',               // default: 'cc_cookie'
        // cookie_expiration: 182,                 // default: 182 (days)
        // cookie_necessary_only_expiration: 182   // default: disabled
        // cookie_domain: location.hostname,       // default: current domain
        // cookie_path: '/',                       // default: root
        // cookie_same_site: 'Lax',                // default: 'Lax'
        // use_rfc_cookie: false,                  // default: false
        // revision: 0,                            // default: 0

        guiOptions: {
            consentModal: {
                layout: "wide",
                position: "bottom center",
                equalWeightButtons: true,
                flipButtons: false
            },
            preferencesModal: {
                layout: "box",
                position: "bottom center",
                equalWeightButtons: true,
                flipButtons: false
            }
        },


        onFirstAction: function (user_preferences, cookie) {
            // callback triggered only once on the first accept/reject action
        },

        onAccept: function (cookie) {
            // callback triggered on the first accept/reject action, and after each page load
        },

        onChange: function (cookie, changed_categories) {
            // callback triggered when user changes preferences after consent has already been given
        },

        languages: {
            'en': {
                consent_modal: {
                    title: 'We use cookies!',
                    description: 'Hi, this website uses essential cookies to ensure its proper operation and tracking cookies to understand how you interact with it. The latter will be set only after consent. <button type="button" data-cc="c-settings" class="cc-link">Let me choose</button>',
                    primary_btn: {
                        text: 'Accept all',
                        role: 'accept_all'              // 'accept_selected' or 'accept_all'
                    },
                    secondary_btn: {
                        text: 'Reject all',
                        role: 'accept_necessary'        // 'settings' or 'accept_necessary'
                    }
                },
                settings_modal: {
                    title: 'Cookie preferences',
                    save_settings_btn: 'Save settings',
                    accept_all_btn: 'Accept all',
                    reject_all_btn: 'Reject all',
                    close_btn_label: 'Close',
                    cookie_table_headers: [
                        { col1: 'Name' },
                        { col2: 'Domain' },
                        { col3: 'Expiration' },
                        { col4: 'Description' }
                    ],
                    blocks: [
                        {
                            title: 'Cookie usage 📢',
                            description: 'I use cookies to ensure the basic functionalities of the website and to enhance your online experience. You can choose for each category to opt-in/out whenever you want. For more details relative to cookies and other sensitive data, please read the full <a href="/index/5-cookies.html" class="cc-link">cookies policy</a>.'
                        }, {
                            title: 'Strictly necessary cookies',
                            description: 'These cookies are essential for the proper functioning of my website. Without these cookies, the website would not work properly',
                            toggle: {
                                value: 'necessary',
                                enabled: true,
                                readonly: true          // cookie categories with readonly=true are all treated as "necessary cookies"
                            }
                        }, {
                            title: 'Performance and Analytics cookies',
                            description: 'These cookies allow the website to remember the choices you have made in the past',
                            toggle: {
                                value: 'analytics',     // your cookie category
                                enabled: true,
                                readonly: false
                            },
                            cookie_table: [             // list of all expected cookies
                                {
                                    col1: '^_ga',       // match all cookies starting with "_ga"
                                    col2: 'google.com',
                                    col3: '2 years',
                                    col4: 'This cookie name is associated with Google Universal Analytics - which is a significant update to Google\'s more commonly used analytics service. This cookie is used to distinguish unique users by assigning a randomly generated number as a client identifier. It is included in each page request in a site and used to calculate visitor, session and campaign data for the sites analytics reports.',
                                    is_regex: true
                                },
                                {
                                    col1: '_gid',
                                    col2: 'google.com',
                                    col3: '1 day',
                                    col4: '	This cookie is set by Google Analytics. It stores and update a unique value for each page visited and is used to count and track pageviews.',
                                }
                            ]
                        }, {
                            title: 'Advertisement and Targeting cookies',
                            description: 'These cookies collect information about how you use the website, which pages you visited and which links you clicked on. All of the data is anonymized and cannot be used to identify you',
                            toggle: {
                                value: 'targeting',
                                enabled: true,
                                readonly: false
                            }
                        }
                    ]
                }
            },
            'bg': {
                consent_modal: {
                    title: 'Ние използваме бисквитки!',
                    description: 'Бихме искали да Ви уведомим, че сайтът използва бисквити. Основната им цел е да гарантират функционирането на сайта ни, както и да направят вашия престой по-приятен и улеснен.</br> Имате възможност да изберете категориите бисквити, които разрешавате, като по всяко време може да откажете или промените вашия избор. <button type="button" data-cc="c-settings" class="cc-link">Нека аз избера</button>',
                    primary_btn: {
                        text: 'Приемам всичко',
                        role: 'accept_all'              // 'accept_selected' or 'accept_all'
                    },
                    secondary_btn: {
                        text: 'Отхвърлете всички',
                        role: 'accept_necessary'        // 'settings' or 'accept_necessary'
                    }
                },
                settings_modal: {
                    title: 'Предпочитания за бисквитки',
                    save_settings_btn: 'Запазете настройките',
                    accept_all_btn: 'Приемам всичко',
                    reject_all_btn: 'Отхвърлете всички',
                    close_btn_label: 'Затвори',
                    cookie_table_headers: [
                        { col1: 'Name' },
                        { col2: 'Domain' },
                        { col3: 'Expiration' },
                        { col4: 'Description' }
                    ],
                    blocks: [
                        {
                            title: 'Използване на бисквитки 📢',
                            description: 'Този уебсайта използва бисквитки, за да гарантирам основните функции на уебсайта и да подобря вашето онлайн изживяване. Можете да изберете за всяка категория да се позволят или откажат бисквитките, когато пожелаете. За повече подробности относно бисквитките  моля, прочетете пълната <a href="/index/5-cookies.html" class="cc-link">политика за бисквитките</a>.'
                        }, {
                            title: 'Строго необходими бисквитки',
                            description: 'Тези бисквитки са от съществено значение за правилното функциониране на уебсайта. Без тези бисквитки уебсайтът няма да работи правилно.',
                            toggle: {
                                value: 'necessary',
                                enabled: true,
                                readonly: true          // cookie categories with readonly=true are all treated as "necessary cookies"
                            }
                        }, {
                            title: 'Бисквитки за ефективност и анализ',
                            description: 'Тези бисквитки позволяват на уебсайта да запомни изборите, които сте направили в миналото',
                            toggle: {
                                value: 'analytics',     // your cookie category
                                enabled: true,
                                readonly: false
                            },
                            cookie_table: [             // list of all expected cookies
                                {
                                    col1: '^_ga',       // match all cookies starting with "_ga"
                                    col2: 'google.com',
                                    col3: '2 years',
                                    col4: 'Това име на бисквитка е свързано с Google Universal Analytics - което е значителна актуализация на по-често използваната услуга за анализ на Google. Тази бисквитка се използва за разграничаване на отделни потребители чрез присвояване на произволно генериран номер като идентификатор на клиента. Той се включва във всяка заявка за страница в даден сайт и се използва за изчисляване на данни за посетители, сесии и кампании за отчетите за анализ на сайтове.',
                                    is_regex: true
                                },
                                {
                                    col1: '_gid',
                                    col2: 'google.com',
                                    col3: '1 day',
                                    col4: 'Тази бисквитка се задава от Google Analytics. Той съхранява и актуализира уникална стойност за всяка посетена страница и се използва за преброяване и проследяване на показванията на страници.	',
                                }
                            ]
                        }, {
                            title: 'Рекламни и таргетиращи бисквитки',
                            description: 'Тези бисквитки събират информация за това как използвате уебсайта, кои страници сте посетили и върху кои връзки сте кликнали. Всички данни са анонимизирани и не могат да бъдат използвани за идентифициране на Вашата самоличност',
                            toggle: {
                                value: 'targeting',
                                enabled: true,
                                readonly: false
                            }
                        }
                    ]
                }
            }

        }
    });
});
