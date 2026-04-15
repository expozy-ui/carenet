
const devSaveButton = document.getElementById("dev_save");
if (devSaveButton !== null) {
    devSaveButton.onclick = async function () {
        Page.get();
        await alpineTemplatesGen();
        await classGen();
        await Page.saveCss();
    };
}

const devScanButton = document.getElementById("dev_scan_all");
if (devScanButton !== null) {
    devScanButton.onclick = startDevScan;
}

// Стартираме проверката веднага - waitForReady() вътре ще изчака всичко да се зареди
checkDevScan();

async function waitForReady(timeout = 15000) {
    const start = Date.now();
    return new Promise((resolve, reject) => {
        const check = () => {
            const styles = document.getElementById('tailwindCss')?.getElementsByTagName('style');
            if (styles && styles.length > 0 && typeof window.Page !== 'undefined') {
                resolve();
            } else if (Date.now() - start > timeout) {
                reject(new Error('Timeout'));
            } else {
                setTimeout(check, 200);
            }
        };
        check();
    });
}

async function checkDevScan() {
    const scan = JSON.parse(localStorage.getItem('devScan') || 'null');
    if (!scan) return;

    const { pages, index } = scan;

    // Предишната страница е записана - минаваме към следващата
    if (scan.saved) {
        const nextIndex = index + 1;
        if (nextIndex >= pages.length) {
            localStorage.removeItem('devScan');
            alert('Готово! Всички ' + pages.length + ' страници са генерирани.');
            return;
        }
        scan.index = nextIndex;
        scan.saved = false;
        localStorage.setItem('devScan', JSON.stringify(scan));
        window.location.href = `/${LANG}/${pages[nextIndex]}`;
        return;
    }

    // Проверяваме дали сме на правилната страница
    const currentSlug = new URL(window.location.href).pathname.split('/')[2] || 'homepage';
    if (currentSlug !== pages[index]) {
        window.location.href = `/${LANG}/${pages[index]}`;
        return;
    }

    // Изчакваме Alpine + Tailwind да са готови
    try {
        await waitForReady();
    } catch (e) {
        console.error('DevScan timeout на страница:', pages[index]);
        const nextIndex = index + 1;
        if (nextIndex >= pages.length) {
            localStorage.removeItem('devScan');
            return;
        }
        scan.index = nextIndex;
        localStorage.setItem('devScan', JSON.stringify(scan));
        window.location.href = `/${LANG}/${pages[nextIndex]}`;
        return;
    }

    // Маркираме като записано ПРЕДИ saveCss (той прави reload)
    scan.saved = true;
    localStorage.setItem('devScan', JSON.stringify(scan));

    Page.get();
    await alpineTemplatesGen();
    await classGen();
    await Page.saveCss();
}

async function startDevScan() {
    const response = await fetch(`/${LANG}/dev_pages`);
    if (!response.ok) {
        alert('Грешка при зареждане на списъка със страници');
        return;
    }

    const skipPages = ['post', 'product', 'products'];
    const pages = (await response.json()).filter(p => !skipPages.includes(p));
    if (!pages.length) return;

    const scan = { pages, index: 0, saved: false };
    localStorage.setItem('devScan', JSON.stringify(scan));
    window.location.href = `/${LANG}/${pages[0]}`;
}

async function processTemplates(container, templates) {
    return new Promise(resolve => {
        templates.forEach(async function (template) {
            if (!template.classList.contains("dontSelect")) {

                var templateContent = template.content;
                var div = document.createElement("div");
                div.appendChild(templateContent.cloneNode(true));

                var nestedTemplates = div.querySelectorAll("template");
                if (nestedTemplates.length > 0) {
                    await processTemplates(div, nestedTemplates);
                }

                container.appendChild(div);
            }
        });

        resolve();
    });
}

async function alpineTemplatesGen() {
    var templates = document.querySelectorAll("template");

    var container = document.getElementById("templatesDiv");
    container.innerHTML = '';

    await processTemplates(container, templates);
}

async function classGen() {

    var elementsWithAttribute = document.querySelectorAll('[\\:class]');

    elementsWithAttribute.forEach(function (element) {

        var attributeValue = element.getAttribute(':class');
        var replacedValue = attributeValue.replace(/['"]/g, ' ');

        replacedValue = document.getElementById('templatesDiv').classList.value + ' ' + replacedValue;
        document.getElementById('templatesDiv').setAttribute('class', replacedValue);

    });

    await new Promise(resolve => setTimeout(resolve, 1000));

}
