import { DataCollect } from './dataCollect.js';

export class DataTable {
    constructor(el) {
        this.table = el;
        this.limit = 10;
        this.page = 1;
        this.order_by = 'id';
        this.sortDirection = 'DESC';
        this.filters = {};
        this.filterRow = document.getElementById('filterRow');
        let dataCollect = new DataCollect(el);

        this.endpoint = dataCollect.combinedData.endpoint;
        this.addData = dataCollect.combinedData;
        this.firstInit = true;



        // this.init();

    }

    async init() {

        if (this.endpoint == undefined) {
            console.error('Няма зададен endpoint за datatable');
            return;
        }


        this._initFilters();
        this._initSortListeners();
        this._initLoader();
        this.load();
    }



    async load() {

        // ако имаме запазени филтри и от последното търсене се прилагат 
        if (this.firstInit) {
            await this.applyStateFilters();
        }

        // Взимаме сегашните филтри
        await this.getFilters();

        // Правим заявка за таблицата
        await this.getRows();
    }

    async applyStateFilters() {

        this.firstInit = false;
        let stateData;
        const saveKey = `datatable_${this.endpoint}`;
        const saved = localStorage.getItem(saveKey);
        if (!saved) return null; // ❌ няма запис

        try {
            stateData = JSON.parse(saved);
        } catch (e) {
            console.error("Invalid state in localStorage", e);
            return null;
        }
        // проверка дали е от последните 10 минути
        const tenMinutes = 50 * 60 * 1000;
        if (Date.now() - stateData.timestamp > tenMinutes) {
            return null; // ❌ твърде стар запис
        }

        this.limit = stateData.data.limit;
        this.page = stateData.data.page;
        this.sortDirection = stateData.data.sortDirection;
        this.order_by = stateData.data.order_by;


        // ✅ прилагане на филтри върху filterRow
        if (this.filterRow) {
            for (const [key, value] of Object.entries(stateData.data)) {
                if (!value) continue; // прескачаме празни

                const el = this.filterRow.querySelector(`[name="${key}"]`);
                if (!el) continue; // няма такъв филтър в DOM

                if (el.tagName === "INPUT") {
                    el.value = value;
                } else if (el.tagName === "SELECT") {
                    window.el = el;
                    ;
                    el.value = value;
                    // el.dispatchEvent(new Event("change"));
                }
            }
        }


    }

    async getFilters() {
        if (!this.filterRow) return;
        let dataCollect = new DataCollect(this.filterRow);
        this.filters = dataCollect.combinedData;
    }

    _initLoader() {
        let loader = `
        <div x-show="data.table.loading" x-cloak
             class="loader w-full h-full absolute top-0 left-0 z-[100000] flex items-center justify-center bg-black/5">
            <i class="fa-solid fa-loader animate-spin animate-duration-2000 text-4xl"></i>
        </div>
    `;

        this.table.insertAdjacentHTML("beforeend", loader);
        this.table.classList.add("relative");
    }

    _initSortListeners() {
        data.table.table.querySelectorAll('thead tr th').forEach(th => {
            const name = th.getAttribute('name');
            if (!name) return; // прескачаме, ако няма name

            th.classList.add('sorting');

            th.addEventListener('click', () => {

                data.table.page = 1;

                //  Премахваме класовете от всички th, не само от текущия
                data.table.table.querySelectorAll('thead tr th').forEach(el => {
                    el.classList.remove('sorting_asc', 'sorting_desc');
                });

                if (this.order_by === name) {
                    this.sortDirection = this.sortDirection === 'ASC' ? 'DESC' : 'ASC';
                } else {
                    this.sortDirection = 'ASC';
                    this.order_by = name;
                }

                th.classList.add(this.sortDirection === 'ASC' ? 'sorting_asc' : 'sorting_desc');
                data.table.load();
            });
        });
    }

    _initFilters() {
        if (!this.filterRow) return;

        // Дефинираме debounce, ако още го няма
        if (!this._debounce) {
            this._debounce = (func, delay) => {
                let timer;
                return (...args) => {
                    clearTimeout(timer);
                    timer = setTimeout(() => func.apply(this, args), delay);
                };
            };
        }

        // Оригиналният handler
        const originalHandler = (e) => {
            if (e.target.classList.contains('range_calendar')) {
                const val = e.target.value.trim();
                // режем по празно място
                const parts = val.split(" ").filter(Boolean);
                if (parts.length < 2 && parts.length != 0) {
                    // имаме само една дата → спираме
                    return;
                }
            }

            data.table.page = 1;
            this.load();
        };

        // Запазваме originalHandler, за да можем да го премахваме
        this._filterHandler = originalHandler;

        // Създаваме debounced версия само веднъж
        if (!this._debouncedFilterHandler) {
            this._debouncedFilterHandler = this._debounce(originalHandler, 500);
        }

        const inputs = this.filterRow.querySelectorAll('input, select');
        inputs.forEach(input => {

            if (input.type != 'hidden') {
                if (input.type === 'checkbox' || input.tagName === 'SELECT') {
                    input.addEventListener('change', this._filterHandler);
                } else {
                    input.addEventListener('input', this._debouncedFilterHandler);
                }
            }
        });
    }

    removeFilters() {
        const elements = this.filterRow.querySelectorAll('input, select, textarea');
        this.page = 1;
        elements.forEach(el => {
            const tag = el.tagName.toLowerCase();
            const type = el.type;

            if (tag === 'select') {
                el.selectedIndex = 0;

            } else if (tag === 'textarea') {
                el.value = '';

            } else if (tag === 'input') {
                switch (type) {
                    case 'checkbox':
                    case 'radio':
                        el.checked = false;
                        break;

                    default:
                        el.value = '';
                }
            }
        });

        this.order_by = 'id';
        this.sortDirection = 'DESC';

        this.load();
    }


    async getRows() {
        data.table.loading = true;
        let res;

        let ajaxData = {
            datatable: 1,
            limit: this.limit,
            page: this.page,
            order_by: this.order_by,
            sortDirection: this.sortDirection,
            ...(this.filters || {}),
            ...(this.addData || {})
        }

        delete ajaxData.endpoint;

        try {
            res = await $.ajax({
                type: 'POST',
                url: `${ADMINAPI}/datatable/${this.endpoint}`,
                dataType: 'json',
                data: ajaxData
            });
        } catch (err) {
            Helpers.show_errors(err.responseJSON);
            return [];
        }

        if (res.pagination) {
            data.table.pagination = Helpers.pagination(res.pagination);
        }
        if (res.result) {
            data.table.rows = res.result;
        }

        this._renderNoRecords(res);
        // this._saveState(ajaxData);

        data.table.loading = false;

        return res;
    }

    async changeLimit(limit) {
        this.limit = limit;
        data.table.getRows();
        return;
    }

    async changePage(page) {

        if (page == 'prevPage' && data.table.pagination.prevPage == true) {
            data.table.page = data.table.page - 1;
            data.table.getRows();
            return;
        }

        if (page == 'nextPage' && data.table.pagination.nextPage == true) {
            data.table.page = data.table.page + 1;
            data.table.getRows();
            return;
        }


        if (Number.isInteger(page) && page <= this.pagination.total_pages) {
            data.table.page = page;
            data.table.getRows();
            return;
        }

    }

    _saveState(ajaxData) {
        // ✅ Запазваме последната заявка
        const saveKey = `datatable_${this.endpoint}`;
        const stateData = {
            endpoint: this.endpoint,
            data: ajaxData,
            timestamp: Date.now()
        };
        localStorage.setItem(saveKey, JSON.stringify(stateData));
    }

    _renderNoRecords(res) {
        let tbody = data.table.table.querySelector("tbody");

        // винаги махаме стария ред, ако има
        let noRecords = document.getElementById("noRecords");
        if (noRecords) noRecords.remove();

        // ако няма резултати → добавяме нов ред
        if (!res.result || res.result.length === 0) {
            let html = `
            <tr id="noRecords">
                <td colspan="100%">
                    <p class="!py-4 !text-base text-center">Няма активни записи</p>
                </td>
            </tr>
        `;
            tbody.insertAdjacentHTML("beforeend", html);
        }
    }

    /* ======== START EXPORT ФУНКЦИИ И БИБЛИОТЕКИ  ========*/

    async exportToCSV() {

        try {
            await this._loadScriptOnce(`${ADMINURL}/assets/global/plugins/sheet.js`);
        } catch (err) {
            console.error('Грешка при зареждане на sheet.js:', err);
            return;
        }

        const table = this.table;
        const headerCells = table.querySelectorAll("thead th");
        const rowElements = table.querySelectorAll("tbody tr");

        const columnCount = headerCells.length - 1; // без последната колона

        const headers = Array.from(headerCells)
            .slice(0, columnCount)
            .map(th => th.innerText.trim());

        const data = [];

        rowElements.forEach(row => {
            const cells = row.querySelectorAll("td");
            const rowData = [];

            for (let i = 0; i < columnCount; i++) {
                let value = cells[i]?.innerText.trim() ?? "";

                // Принудително като текст, за водещи нули
                if (/^0\d+/.test(value)) {
                    value = `${value}`;
                }

                rowData.push(value);
            }

            data.push(rowData);
        });

        // Добавяме заглавия на първи ред
        data.unshift(headers);

        // Генерираме worksheet
        const worksheet = XLSX.utils.aoa_to_sheet(data);

        // Генерираме CSV от worksheet
        const csv = XLSX.utils.sheet_to_csv(worksheet);

        // Създаваме и изтегляме файла
        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }); // добавяме BOM
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;

        let title = this._getExportFileNameFromTitle();
        // Запазваме файла

        a.download = `${title}.csv`
        a.click();
    }


    async exportToXLSX() {
        try {
            await this._loadScriptOnce(`${ADMINURL}/assets/global/plugins/sheet.js`);
        } catch (err) {
            console.error('Грешка при зареждане на sheet.js:', err);
            return;
        }

        const table = this.table;
        const headerCells = table.querySelectorAll("thead th");
        const rowElements = table.querySelectorAll("tbody tr");

        const columnCount = headerCells.length - 1; // последната е за бутони

        // Заглавия
        const headers = Array.from(headerCells)
            .slice(0, columnCount)
            .map(th => th.innerText.trim());

        // Данниg
        const data = [];

        rowElements.forEach(row => {
            const cells = row.querySelectorAll("td");
            const rowData = [];

            for (let i = 0; i < columnCount; i++) {
                let value = cells[i]?.innerText.trim() ?? "";

                // Принуждаваме Excel да го третира като текст (за водещи нули)
                if (/^0\d+/.test(value)) {
                    value = `${value}`;
                }

                rowData.push(value);
            }

            data.push(rowData);
        });

        // Включваме заглавията най-отгоре
        data.unshift(headers);

        // Създаваме worksheet и файл
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

        let title = this._getExportFileNameFromTitle();
        // Запазваме файла
        XLSX.writeFile(workbook, `${title}.xlsx`);
    }

    async exportToPDF() {

        try {
            await this._loadScriptOnce(`${ADMINURL}/assets/global/plugins/pdfmake.min.js`);
            await this._loadScriptOnce(`${ADMINURL}/assets/global/plugins/vfs_fonts.js`);
        } catch (err) {
            console.error('Грешка при зареждане на библиотеките:', err);
            return;
        }

        const headers = [];
        const body = [];

        // Заглавия (без последната колона)
        const ths = Array.from(this.table.querySelectorAll('thead tr th'));
        ths.slice(0, -1).forEach(th => {
            headers.push({ text: th.innerText.trim(), style: 'tableHeader' });
        });

        // Редове (без последната колона)
        this.table.querySelectorAll('tbody tr').forEach((tr, i) => {
            const tds = Array.from(tr.querySelectorAll('td')).slice(0, -1);

            if (tds.length !== headers.length) return;

            const row = tds.map(td => ({
                text: td.innerText.trim(),
                style: i % 2 === 0 ? 'tableBodyEven' : 'tableBodyOdd'
            }));
            body.push(row);
        });

        // PDF структура
        const docDefinition = {
            pageOrientation: 'landscape',
            content: [
                { text: this._getExportFileNameFromTitle(), style: 'title', margin: [0, 0, 0, 10] },
                {
                    alignment: 'center', // ⬅️ Центриране на таблицата
                    table: {
                        headerRows: 1,
                        body: [headers, ...body]
                    },
                    layout: 'noBorders'
                }
            ],
            styles: {
                tableHeader: {
                    bold: true,
                    fontSize: 11,
                    color: 'white',
                    fillColor: '#2d4154',
                    alignment: 'center'
                },
                tableBodyEven: {},
                tableBodyOdd: {
                    fillColor: '#f3f3f3'
                },
                title: {
                    alignment: 'center',
                    fontSize: 15
                }
            },
            defaultStyle: {
                fontSize: 9
            }
        };

        pdfMake.createPdf(docDefinition).download('export.pdf');
    }


    _getExportFileNameFromTitle() {
        const pageTitle = document.title.trim();
        const date = new Date().toISOString().split('T')[0]; // формат: 2025-08-04
        return `${pageTitle} - ${date}`;
    }

    _loadScriptOnce(scriptUrl) {
        // Проверка дали вече е зареден
        if (document.querySelector(`script[src="${scriptUrl}"]`)) {
            return Promise.resolve(); // вече е зареден
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = scriptUrl;
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Не може да се зареди sheet.js'));
            document.head.appendChild(script);
        });
    }

    /* ======== END EXPORT FUNCTIONS  ========*/
}



function getTableActionBar() {
    return `
      <div class="flex justify-between gap-2 py-4">
      <template x-if="data.table">
                  <div>
                    <div class="flex items-center gap-2">
                      <p class="!m-0 !text-sm">Покажи</p>
                      <select @change="data.table.changeLimit($el.value)"  class="!h-8  !px-2 !py-1 flex items-center justify-center">
                        <option :selected="data.table.limit == '10' " value="10">10</option>
                        <option :selected="data.table.limit == '20'" value="20">20</option>
                        <option :selected="data.table.limit == '50'" value="50">50</option>
                        <option :selected="data.table.limit == '100'" value="100">100</option>
                        <option :selected="data.table.limit == '150'" value="150">150</option>
                        <option :selected="data.table.limit == '9999'" value="9999">All</option>
                      </select>
                      <p class="!m-0 !text-sm">резултата</p>
                    </div>
                  </div>
                  </template>
                  <div class="flex gap-2">
                    <a @click="data.table.exportToCSV()" class="btn ">CSV</a>
                    <a @click="data.table.exportToXLSX()" class="btn ">Excel</a>
                    <a @click="data.table.exportToPDF()" class="btn">PDF</a>

                  </div>
                </div>
    `;
}

function getTablePaginationBar() {
    return `
       <template x-if="data.table.pagination">
                  <form>
                    <div class="flex items-center justify-between mt-2 text-sm ">
                      <div>
                        <p class="!m-0">
                            <span>Резултати от</span>
                            <span x-text="data.table.pagination.firstElementShown"></span>
                            <span>до</span>
                            <span x-text="data.table.pagination.lastElementShown"></span>
                            <span>от общо</span>
                            <span x-text="data.table.pagination.total_results"></span>
                        </p>
                      </div>
                      <div class="flex gap-1 ">
                        <button type="button" @click="data.table.changePage('prevPage')" :class="data.table.pagination.prevPage ? 'light' : 'disabled' " class="btn">Назад</button>
                        <template x-for="page in data.table.pagination.pagesArray">
                          <button type="button" @click="data.table.changePage(page)" x-text="page" :class="data.table.pagination.current_page == page ? 'primary ' : 'light ' " class="btn ">1</button>
                        </template>
                        <button type="button" @click="data.table.changePage('nextPage')" :class="data.table.pagination.nextPage ? 'light' : 'disabled' " class="btn">Напред</button>
                      </div>
                    </div>
                  </form>
                </template>
    `;
}


function addNorecords() {
    let tbody = data.table.table.querySelector('tbody');
    let columns = data.table.table.querySelectorAll('thead th').length;

    tbody.innerHTML += `
        <tr id="noRecords">
            <td colspan="${columns}">
                <p class="!py-4 !text-base">Няма активни записи</p>
            </td>
        </tr>`;
}

function getStatusBadge(status_id) {
    let cls = (status_id == 1 ? 'success' : 'danger');
    let text = (status_id == 1 ? _ACTIVE : _INACTIVE);
    return `<div style="text-align:center;"><span class='badge ${cls}'>${text}</span></div>`;
}


window.addNorecords = addNorecords;
window.getTableActionBar = getTableActionBar;
window.getTablePaginationBar = getTablePaginationBar;
window.getStatusBadge = getStatusBadge;

