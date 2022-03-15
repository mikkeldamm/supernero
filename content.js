(async () => {
    let redirectInterval;
    let stopTimer;
    let renderTimer;
    let lastLocationHref = '';

    setInterval(() => {
        if (lastLocationHref === window.location.href) {
            return;
        }

        if (renderTimer) {
            clearTimeout(renderTimer);
        }

        renderTimer = setTimeout(() => {
            renderVoucherCreateButtonsInBank();
            renderInvoicesSumOfAmounts();
            renderBankRealTimeBalance();
            renderYearlyProfit();
        }, 3000);

        lastLocationHref = window.location.href;
    }, 500);

    function formatNumberToDKK(amount, includeMinus = true) {
        if (amount === null || amount === undefined) {
            return '';
        }

        if (typeof amount === 'string') {
            amount = Number(amount);
        }

        if (isNaN(amount)) {
            return '';
        }

        const value = amount
            .toFixed(2)
            .replace('.', ',')
            .replace(/\d(?=(\d{3})+\D)/g, '$&.');

        const valueHaveMinus = value.indexOf('-') > -1;
        const valueWithoutMinus = valueHaveMinus ? value.substring(1) : value;
        return `${includeMinus && valueHaveMinus ? '-' : ''}${valueWithoutMinus}`;
    }

    function renderInvoicesSumOfAmounts() {
        if (!document.querySelector('#trade-voucher-table')) {
            return;
        }

        const totalColumn = document.querySelector('[data-sort-col="total"]');
        if (!totalColumn) {
            return;
        }

        const sumOfInvoices = [...document.querySelectorAll('#trade-voucher-table tbody tr [data-meta=total]')]
            .map((_e) => {
                return _e.innerText || '';
            })
            .map((_a) => {
                return _a.split(' ')[0] || '';
            })
            .map((_a) => {
                return Number(_a.replace(/\./gi, '').replace(/\,/gi, '.')) || 0;
            })
            .reduce((acc, curr) => acc + curr, 0);

        totalColumn.innerHTML = `<div class="sum-of-invoices">${formatNumberToDKK(sumOfInvoices)} DKK</div>`;
    }

    function getAmount(value) {
        const a = value || '';
        const b = a.split(' ')[0] || '';
        const c = Number(b.replace(/\./gi, '').replace(/\,/gi, '.')) || 0;
        return c;
    }

    function renderBankRealTimeBalance() {
        const resultWidgetElement = document.querySelector('.widget-stats.chart');
        const bankElements = [...document.querySelectorAll('.bank-widget-case')].find((_e) => _e.style.display !== 'none');

        if (!resultWidgetElement || !bankElements) {
            return;
        }

        const bankSumElement = bankElements.querySelector('.bank-widget-case-bank-information-balance');
        const vatSumElement = document.querySelector('#vat-countdown .span6');

        if (!bankSumElement || !vatSumElement) {
            return;
        }

        const provisionalTaxSumElement = document.querySelector('.provisional-tax .provisional-tax-amount');
        const haveProvisionalTax = provisionalTaxSumElement && provisionalTaxSumElement.innerText ? true : false;
        const provisionalTaxAmount = haveProvisionalTax ? getAmount(provisionalTaxSumElement.innerText) : 0;

        const bankAmount = getAmount(bankSumElement.innerText);
        const vatAmount = getAmount(vatSumElement.querySelector('h2').innerText);
        const resultAmount = getAmount(resultWidgetElement.querySelector('#dashboard-graph-total').innerText);
        const resultVatAmount = resultAmount * 0.22;

        const result = bankAmount - vatAmount - (haveProvisionalTax ? provisionalTaxAmount : resultVatAmount);

        const bankRealElement = document.createElement('div');
        bankRealElement.classList.add('widget-stats');
        bankRealElement.classList.add('bank-real');
        bankRealElement.innerHTML = ` 
            <div class="bank-real-items">
                <div class="bank-real-item">
                    <div class="bank-real-label">Nuv. banksaldo</div>
                    <div class="bank-real-value positive">${formatNumberToDKK(bankAmount)}</div>
                </div>
                <span>${vatAmount < 0 ? '+' : '-'}</span>
                <div class="bank-real-item">
                    <div class="bank-real-label">Nuv. moms periode</div>
                    <div class="bank-real-value ${vatAmount < 0 ? 'positive' : 'negative'}">${formatNumberToDKK(vatAmount, false)}</div>
                </div>
                ${
                    !haveProvisionalTax
                        ? `
                <span>${resultVatAmount < 0 ? '+' : '-'}</span>
                <div class="bank-real-item">
                    <div class="bank-real-label">22% af nuv. resultat</div>
                    <div class="bank-real-value ${resultVatAmount < 0 ? 'positive' : 'negative'}">${formatNumberToDKK(resultVatAmount, false)}</div>
                </div>
                `
                        : `
                <span>${provisionalTaxAmount < 0 ? '+' : '-'}</span>
                <div class="bank-real-item">
                    <div class="bank-real-label">Skat for nuv. periode</div>
                    <div class="bank-real-value ${provisionalTaxAmount < 0 ? 'positive' : 'negative'}">${formatNumberToDKK(
                              provisionalTaxAmount,
                              false
                          )}</div>
                </div>`
                }
                <span>=</span>
                <div class="bank-real-item">
                    <div class="bank-real-label">Reelt rådigheds banksaldobeløb</div>
                    <div class="bank-real-value ${result < 0 ? 'negative' : 'positive'}">${formatNumberToDKK(result)}</div>
                </div>
            </div>
        `;

        resultWidgetElement.parentNode.insertBefore(bankRealElement, resultWidgetElement);
    }

    function getCountOfDaysFromFirstDayOfYearToNow() {
        const firstDayOfYear = new Date(new Date().getFullYear(), 0, 1);
        const now = new Date();

        return Math.round((now - firstDayOfYear) / (1000 * 60 * 60 * 24));
    }

    function renderYearlyProfit() {
        const widgetStatsResultsTotalElement = document.querySelector('.widget-stats-results-total');
        if (!widgetStatsResultsTotalElement) {
            return;
        }

        const widgetStatsResultsTotalValueElement = widgetStatsResultsTotalElement.querySelector('.widget-stats-results-value');
        if (!widgetStatsResultsTotalValueElement) {
            return;
        }

        const widgetStatsResultsTotalValue = getAmount(widgetStatsResultsTotalValueElement.innerText);
        if (!widgetStatsResultsTotalValue) {
            // we don't want to render anything if the amount is zero (0)
            return;
        }

        const currentAccountingDays = getCountOfDaysFromFirstDayOfYearToNow();
        const yearlyProfit = (widgetStatsResultsTotalValue / currentAccountingDays) * 365;
        const yearlyProfitFormatted = formatNumberToDKK(yearlyProfit);

        const yearlyProfitElement = document.createElement('div');
        yearlyProfitElement.classList.add('widget-stats-results-label');
        yearlyProfitElement.style.margin = '10px 0 0 0';
        yearlyProfitElement.innerHTML = `Forventet i år:<strong style="color: #46505a;display: block;">${yearlyProfitFormatted}</strong></div>`;

        widgetStatsResultsTotalValueElement.parentNode.appendChild(yearlyProfitElement);

        const widgetStatsKeyNumberValueTextElement = document.querySelector('.widget-stats-results-value-text');
        if (widgetStatsKeyNumberValueTextElement) {
            widgetStatsKeyNumberValueTextElement.remove();
        }
    }

    function wait({ milliseconds }) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve('');
            }, milliseconds);
        });
    }

    function prepareApp() {
        const styleElement = document.createElement('style');
        styleElement.innerHTML = `
            .reconciliation-item .create-voucher-purchase {
                position: absolute;
                background-color: #006edc;
                box-shadow: 0px 5px 10px -4px rgb(0 0 0 / 40%);
                border-radius: 4px;
                padding: 0 0.5em;
                z-index: 50;
                right: 10px;
                top: 8px;
                margin: auto;
                height: 28px;
                box-sizing: border-box;
                color: #fff;
                font-size: 16px;
                cursor: pointer;
                opacity: 1;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .reconciliation-item .create-voucher-purchase:hover {
                background-color: rgb(4 85 167);
            }
            .reconciliation-item:hover .create-voucher-purchase {
                opacity: 1 !important;
            }

            .bank-transaction-title {
                background-color: #fff0b8;
                padding: 10px;
                margin: 0 0 10px 0;
                border-radius: 4px;
            }
            .bank-transaction-title::before {
                content: "Bank linje";
                display: block;
                font-size: 11px;
                text-transform: uppercase;
                color: #a29151;
            }
            .sum-of-invoices {
                font-weight: 700;
                font-size: 16px;
                color: #20c18c;
            }
            .bank-real-label {
                color: #8ca0aa;
                line-height: 1.85;
                margin-bottom: 0.1rem;
            }
            .bank-real-value {
                font-size: 20px;
                font-weight: 700;
            }
            .bank-real-value.negative {
                color: #ff3232;
            }
            .bank-real-value.positive {
                color: #21c18c;
            }
            .bank-real-items {
                display: flex;
                align-items: center;
            }
            .bank-real-items span {
                font-size: 30px;
                margin: 0 30px;
                color: #5d5d5d;
            }
            .widget-stats.bank-real {
                margin-top: -100px;
                padding: 20px;
            }
        `;

        document.body.appendChild(styleElement);
    }

    function renderVoucherCreateButtonsInBank() {
        const reconciliationItems = document.querySelector('.reconciliation-items');
        if (!reconciliationItems) {
            return;
        }

        [...document.querySelectorAll('.reconciliation-item')].forEach((_element) => {
            const existingButton = _element.querySelector('.create-voucher-purchase');
            if (existingButton) {
                return;
            }

            if (_element.classList.contains('is-matched')) {
                if (existingButton) {
                    _element.removeChild(existingButton);
                }
                return;
            }

            const button = createNodeForCreateButton();
            button.addEventListener('click', onCreateVoucherPurchaseClick);

            _element.appendChild(button);
        });
    }

    async function onCreateVoucherPurchaseClick({ target }) {
        const transaction = target.parentElement;
        const titleElement = transaction.querySelector('.reconciliation-item-description');
        const dateElement = transaction.querySelector('.reconciliation-item-date');
        const amountElement = transaction.querySelector('.reconciliation-item-amount');

        const title = titleElement.innerText.trim();
        const date = dateElement.innerText.toString().trim();
        let amount = amountElement.innerText.toString().trim();
        if (amount.indexOf('-') > -1) {
            amount = amount ? amount.replace('-', '') : '';
        } else {
            amount += '-' + amount;
        }

        const bankLocationHref = window.location.href;
        document.querySelector('.top-nav-actions-list a:nth-child(2)').click();
        await prepareVoucherPurchase({ date, amount, title, bankLocationHref });
    }

    function createNodeForCreateButton() {
        const createButtonElement = document.createElement('div');

        createButtonElement.classList.add('create-voucher-purchase');
        createButtonElement.innerText = '+';
        createButtonElement.title = 'Opret bilag';

        return createButtonElement;
    }

    async function prepareVoucherPurchase({ date, amount, title, bankLocationHref }) {
        await wait({ milliseconds: 800 });

        const optionElement = document.querySelector('[data-cy="firstoption"]');
        if (!optionElement) {
            return;
        }

        optionElement.click();
        await insertVoucherPurchase({ date, amount, title, bankLocationHref });
    }

    async function insertVoucherPurchase({ date, amount, title, bankLocationHref }) {
        const dateInputElement = document.querySelector('[data-cy="cashdateinput"]');
        const amountInputElement = document.querySelector('[data-cy="inputamount"]');

        if (!dateInputElement || !amountInputElement) {
            return;
        }

        dateInputElement.value = date;
        await wait({ milliseconds: 200 });
        dateInputElement.blur();
        dateInputElement.dispatchEvent(new Event('blur', { bubbles: true }));

        amountInputElement.value = amount;
        await wait({ milliseconds: 200 });
        amountInputElement.blur();
        amountInputElement.dispatchEvent(new Event('blur', { bubbles: true }));

        const crowderSelectElement = document.querySelector('crowder-select');
        const crowderSelectElementParent = crowderSelectElement.parentElement;

        const bankTransactionTitleElement = document.createElement('div');
        bankTransactionTitleElement.classList.add('bank-transaction-title');
        bankTransactionTitleElement.innerText = title;
        crowderSelectElementParent.querySelector('.input-label').after(bankTransactionTitleElement);

        redirectInterval = setInterval(() => {
            if (!window.location.href.match(/vouchers\/purchases\/cash\/(\d+)/gi)) {
                return;
            }

            if (stopTimer) {
                clearTimeout(stopTimer);
            }

            clearInterval(redirectInterval);
            window.location.href = bankLocationHref;
        }, 200);

        stopTimer = setTimeout(() => {
            clearInterval(redirectInterval);
        }, 60000);
    }

    prepareApp();
})();
