/**
 * SuperCare Geolocation
 * Използва browser geolocation + OpenStreetMap Nominatim (безплатен, без API ключ)
 * Кешира резултата в sessionStorage за бързодействие.
 *
 * Глобални функции:
 *   geoLocateBtn(btn)          — бутон в search: locate → задава селектите
 *   geoLocateAndRedirect(btn)  — бутон в homepage: locate → redirect към /bg/search
 *   geoAutoLocate()            — auto-locate при зареждане на всяка страница
 */

(function () {

    var CACHE_KEY = 'supercare_geo';
    var CACHE_TTL = 10 * 60 * 1000; // 10 минути

    /**
     * Взима координати от браузъра (WiFi/IP — бързо, достатъчно за град)
     */
    function getCoords() {
        return new Promise(function (resolve, reject) {
            if (!navigator.geolocation) {
                reject(new Error('Браузърът не поддържа геолокация.'));
                return;
            }
            navigator.geolocation.getCurrentPosition(
                function (pos) {
                    resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                },
                function (err) {
                    var msgs = {
                        1: 'Достъпът до местоположение е отказан.',
                        2: 'Не можахме да определим местоположението.',
                        3: 'Времето за заявка изтече.'
                    };
                    reject(new Error(msgs[err.code] || 'Неизвестна грешка.'));
                },
                { enableHighAccuracy: false, timeout: 5000, maximumAge: 600000 }
            );
        });
    }

    /**
     * Reverse geocode чрез OpenStreetMap Nominatim
     */
    function reverseGeocode(lat, lng) {
        var url = 'https://nominatim.openstreetmap.org/reverse?lat=' + lat + '&lon=' + lng + '&format=json&accept-language=bg&zoom=10';
        return fetch(url, {
            headers: { 'User-Agent': 'SuperCare.bg/1.0' }
        })
        .then(function (res) { return res.json(); })
        .then(function (json) {
            if (json.error) throw new Error('Адресът не може да бъде определен.');

            var addr = json.address || {};
            return {
                lat: lat,
                lng: lng,
                city: addr.city || addr.town || addr.village || addr.municipality || null,
                region: addr.state || addr.province || addr.county || null,
                country: addr.country || null,
                country_code: (addr.country_code || '').toUpperCase() || null
            };
        });
    }

    /**
     * Кеш — четене
     */
    function getCached() {
        try {
            var raw = sessionStorage.getItem(CACHE_KEY);
            if (!raw) return null;
            var cached = JSON.parse(raw);
            if (Date.now() - cached.ts > CACHE_TTL) {
                sessionStorage.removeItem(CACHE_KEY);
                return null;
            }
            return cached.location;
        } catch (e) {
            return null;
        }
    }

    /**
     * Кеш — записване
     */
    function setCache(location) {
        try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), location: location }));
        } catch (e) { /* ignore */ }
    }

    /**
     * Пълен процес: кеш → координати → адрес
     */
    function locate() {
        var cached = getCached();
        if (cached) {
            console.log('Geo: от кеша —', cached.city, cached.region);
            return Promise.resolve(cached);
        }

        return getCoords().then(function (coords) {
            console.log('Geo: координати —', coords.lat, coords.lng);
            return reverseGeocode(coords.lat, coords.lng);
        }).then(function (location) {
            console.log('Geo: адрес —', location.city, location.region);
            setCache(location);
            return location;
        });
    }

    /**
     * Търси съвпадение в Alpine data.regions / data.cities
     */
    function matchLocation(location) {
        var matchedRegion = null;
        var matchedCity = null;

        if (typeof data === 'undefined') {
            console.warn('Geo: data обектът не е наличен');
            return { region: null, city: null, raw: location };
        }

        // Търси регион
        if (location.region && data.regions) {
            var name = location.region.toLowerCase();
            var regions = Object.values(data.regions);
            for (var i = 0; i < regions.length; i++) {
                var t = (regions[i].title || '').toLowerCase();
                if (t === name || t.indexOf(name) !== -1 || name.indexOf(t) !== -1) {
                    matchedRegion = regions[i];
                    break;
                }
            }
        }

        // Търси град
        if (location.city && data.cities) {
            var cityName = location.city.toLowerCase();
            var cities = Object.values(data.cities);

            // Точно съвпадение
            for (var j = 0; j < cities.length; j++) {
                if ((cities[j].title || '').toLowerCase() === cityName) {
                    matchedCity = cities[j];
                    break;
                }
            }
            // Частично съвпадение
            if (!matchedCity) {
                for (var k = 0; k < cities.length; k++) {
                    var ct = (cities[k].title || '').toLowerCase();
                    if (ct.indexOf(cityName) !== -1 || cityName.indexOf(ct) !== -1) {
                        matchedCity = cities[k];
                        break;
                    }
                }
            }
        }

        // Ако нямаме регион но имаме град — вземи региона от града
        if (!matchedRegion && matchedCity && matchedCity.region_id && data.regions) {
            var allRegions = Object.values(data.regions);
            for (var r = 0; r < allRegions.length; r++) {
                if (allRegions[r].id == matchedCity.region_id) {
                    matchedRegion = allRegions[r];
                    break;
                }
            }
        }

        console.log('Geo: съвпадения — регион:', matchedRegion ? matchedRegion.title : 'няма', ', град:', matchedCity ? matchedCity.title : 'няма');
        return { region: matchedRegion, city: matchedCity, raw: location };
    }

    /**
     * Задава стойност на select, обхождайки options (не ползва querySelector).
     * Връща true ако е успял.
     */
    function setSelectValue(select, value) {
        var strVal = String(value);
        var options = select.options;
        for (var i = 0; i < options.length; i++) {
            if (String(options[i].value) === strVal) {
                select.value = strVal;
                select.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
            }
        }
        return false;
    }

    /**
     * Проверява дали select-ите на страницата имат реални option-и (не само default)
     */
    function selectsReady() {
        var regionSel = document.querySelector('select[name="region_id"]');
        // Повече от 1 option (първата е default "Избери регион")
        return regionSel && regionSel.options.length > 1;
    }

    /**
     * Задава стойностите на ВСИЧКИ region/city селекти на страницата.
     */
    function applyToSelects(result) {
        if (!result.region && !result.city) return;

        // 1. Задай региона
        if (result.region) {
            var regionSelects = document.querySelectorAll('select[name="region_id"]');
            regionSelects.forEach(function (sel) {
                var ok = setSelectValue(sel, result.region.id);
                console.log('Geo: зададен регион на', sel.closest('[apiData]') ? 'form' : 'select', '→', ok);
            });
        }

        // 2. Задай града — изчакай Alpine да ре-рендира city опциите след промяна на региона
        if (result.city) {
            setTimeout(function () {
                var citySelects = document.querySelectorAll('select[name="city_id"]');
                citySelects.forEach(function (sel) {
                    var ok = setSelectValue(sel, result.city.id);
                    console.log('Geo: зададен град →', ok, '(options:', sel.options.length, ')');
                });
            }, 600);
        }
    }


    // ===========================
    //   Глобални функции
    // ===========================

    /**
     * Бутон в search страницата — locate → match → задава селектите
     */
    window.geoLocateBtn = function (btn) {
        var icon = btn ? btn.querySelector('i') : null;
        var origClass = icon ? icon.className : '';

        if (icon) icon.className = 'fa-solid fa-spinner fa-spin text-sm';
        if (btn) btn.disabled = true;

        locate()
            .then(function (location) {
                var result = matchLocation(location);
                if (result.region || result.city) {
                    applyToSelects(result);
                } else {
                    console.warn('Geo: Няма съвпадение за', location.city, location.region);
                }
            })
            .catch(function (err) {
                console.error('Geo:', err.message);
            })
            .finally(function () {
                if (icon) icon.className = origClass;
                if (btn) btn.disabled = false;
            });
    };

    /**
     * Бутон в homepage — locate → match → redirect към /bg/search
     */
    window.geoLocateAndRedirect = function (btn) {
        var icon = btn ? btn.querySelector('i') : null;
        var origClass = icon ? icon.className : '';

        if (icon) icon.className = 'fa-solid fa-spinner fa-spin text-xs';
        if (btn) btn.disabled = true;

        locate()
            .then(function (location) {
                var result = matchLocation(location);

                var params = new URLSearchParams();
                if (result.region) params.set('region_id', result.region.id);
                if (result.city) params.set('city_id', result.city.id);

                var qs = params.toString();
                window.location.href = '/bg/search' + (qs ? '?' + qs : '');
            })
            .catch(function (err) {
                console.error('Geo:', err.message);
                if (icon) icon.className = origClass;
                if (btn) btn.disabled = false;
            });
    };

    /**
     * Auto-locate при зареждане — работи на всяка страница (search, homepage)
     * Изчаква data.regions, data.cities И реалните <option> елементи да са в DOM.
     */
    window.geoAutoLocate = function () {
        // Не правим auto-locate ако вече има параметри
        var urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('region_id') || urlParams.get('city_id')) {
            console.log('Geo auto-locate: прескочено — има URL параметри');
            return;
        }

        console.log('Geo auto-locate: стартирано');

        var attempts = 0;
        var maxAttempts = 20; // 20 * 500ms = 10 секунди макс

        var waitForData = function () {
            attempts++;

            // Чакаме Alpine data обекта с regions и cities
            var dataReady = (typeof data !== 'undefined') &&
                            data.regions && Object.keys(data.regions).length > 0 &&
                            data.cities && Object.keys(data.cities).length > 0;

            // Чакаме и реалните <option> елементи да са в DOM-а
            var domReady = selectsReady();

            if (!dataReady || !domReady) {
                if (attempts < maxAttempts) {
                    setTimeout(waitForData, 500);
                } else {
                    console.warn('Geo auto-locate: timeout — данните не се заредиха');
                }
                return;
            }

            console.log('Geo auto-locate: данни заредени (опит ' + attempts + '), търся локация...');

            locate()
                .then(function (location) {
                    var result = matchLocation(location);
                    if (result.region || result.city) {
                        applyToSelects(result);
                        console.log('Geo auto-locate: готово!');
                    } else {
                        console.log('Geo auto-locate: няма съвпадение');
                    }
                })
                .catch(function (err) {
                    console.log('Geo auto-locate:', err.message);
                });
        };

        // Стартираме след 1 секунда за да не пречи на зареждането
        setTimeout(waitForData, 1000);
    };

    // Expose за директен достъп
    window.SuperCareGeo = {
        locate: locate,
        match: matchLocation,
        apply: applyToSelects
    };

})();
