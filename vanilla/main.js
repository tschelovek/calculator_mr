import Choices from "choices.js";
import {
    addInputNumberControls,
    createFlyingOutput,
    addManualCostEditor,
    formatNumber,
    cleanCostNumber
} from "./js/utils.js";

document.addEventListener('DOMContentLoaded', () => {
    const groupFilm = document.querySelector('.calc-mr__group_film');
    const groupBanner = document.querySelector('.calc-mr__group_banner');
    const groupCorob = document.querySelector('.calc-mr__group_corob');
    const groupLightLetters = document.querySelector('.calc-mr__group_light-letters');
    const groupLettersSeparated = document.querySelector('.calc-mr__group_letters-separated');
    const groupNeon = document.querySelector('.calc-mr__group_neon');
    const groupNonlightSignboard = document.querySelector('.calc-mr__group_nesvet-signboard');
    const groupLightPanel = document.querySelector('.calc-mr__group_svet-panel');
    const groupTables = document.querySelector('.calc-mr__group_tables');
    const groupMore = document.querySelector('.calc-mr__group_more');
    const groupSpectech = document.querySelector('.calc-mr__group_spectech');

    const groupsArr = [
        groupFilm,
        groupBanner,
        groupCorob,
        groupLightLetters,
        groupLettersSeparated,
        groupNeon,
        groupNonlightSignboard,
        groupLightPanel,
        groupTables,
        groupMore,
        groupSpectech
    ];
    const tripCheckboxesArr = [
        document.getElementById('vyezd_na_obekt'),
        document.getElementById('vyezd_zabor_rk'),
        document.getElementById('vyezd_proizvobmerov'),
        document.getElementById('vyezd_diagnostika'),
    ];
    const selectsArr = document.querySelectorAll('.select__wrapper select');

    const tripCost = parseInt(document.getElementById('vyezd_na_obekt').dataset?.price) || 0;
    const {output: flyingOutput} = createFlyingOutput({initValue: '0', postfix: '₽'})

    addInputNumberControls(document.querySelectorAll('.calc-mr .counter__wrapper'));

    //* Хэндлеры для всех категорий, кроме "Выезды"
    groupsArr.forEach(group => {
        //* Проверяем, является ли элемент узлом DOM-дерева, чтоб не упало при вызове .querySelector у undefined
        if (!(group instanceof HTMLElement)) return;

        //* Хэндлеры чекбоксов ценовых позиций ('.calc-mr__row')
        group.querySelectorAll('.checkbox_big-round input')
            .forEach(checkbox => checkbox.addEventListener('change', () => {
                handlerPriceRow({
                    rowDiv: checkbox.closest('.calc-mr__row'),
                    rowCheckbox: checkbox,
                })
            }));

        //* Хэндлеры инпутов внутри ценовой позиции
        group.querySelectorAll('.counter__input')
            .forEach(counter => counter.addEventListener('input', () => {
                const rowDiv = counter.closest('.calc-mr__row');
                const rowCheckbox = rowDiv.querySelector('.checkbox_big-round input');

                if (rowCheckbox?.checked) {
                    handlerPriceRow({rowDiv, rowCheckbox})
                }
            }));

        //* Хэндлеры селектов внутри ценовых позиции
        group.querySelectorAll('.calc-mr__price-positions select')
            .forEach(select => select.addEventListener('change', () => {
                const rowDiv = select.closest('.calc-mr__row');
                const rowCheckbox = rowDiv.querySelector('.checkbox_big-round input');

                if (rowCheckbox?.checked) {
                    handlerPriceRow({rowDiv, rowCheckbox})
                }
            }))

        //* Хэндлер селекта с повышающим коэффициентом в шапке группы цен '.calc-mr__group'.
        group.querySelector('.select__coefficient')?.addEventListener('change', () => {
            group.querySelectorAll('.calc-mr__row')
                .forEach(rowDiv => {
                    const rowCheckbox = rowDiv.querySelector('.checkbox_big-round input');

                    if (rowCheckbox?.checked) {
                        handlerPriceRow({rowDiv, rowCheckbox})
                    }
                })
        })

        //* Хэндлер ручного редактирования цены
        group.querySelectorAll('.calc-mr__price-positions .span-price')
            .forEach(output => addManualCostEditor(
                {
                    priceOutput: output,
                    onSubmit: calculatePriceGroupSum
                }));
    })

    //* Хэндлеры категории "Выезды" (без "Ремонт вывески")
    tripCheckboxesArr.forEach(checkbox => {
        const rowDiv = checkbox.closest('.calc-mr__row');

        checkbox.addEventListener('change', () => {
            handlerPriceRowTripGroup({rowDiv, rowCheckbox: checkbox})
        })

        rowDiv.querySelector('.counter__input')?.addEventListener('input', () => {
            if (checkbox.checked) {
                handlerPriceRowTripGroup({rowDiv, rowCheckbox: checkbox})
            }
        })

        rowDiv.querySelector('.select__hours')?.addEventListener('change', () => {
            if (checkbox.checked) {
                handlerPriceRowTripGroup({rowDiv, rowCheckbox: checkbox})
            }
        })
    })

    //* Хэндлеры ценовой позиции "Ремонт вывески" категории "Выезды"
    function initRemontVyveskiHandlers() {
        const checkbox = document.getElementById('remont_vyveski');
        const rowDiv = checkbox.closest('.calc-mr__row');

        checkbox.addEventListener('change', () => {
            handlerPriceRow({rowDiv, rowCheckbox: checkbox})
        })
        rowDiv.querySelector('.select__hours').addEventListener('change', () => {
            if (checkbox.checked) {
                handlerPriceRow({rowDiv, rowCheckbox: checkbox})
            }
        })
    }

    initRemontVyveskiHandlers();

    //* Хэндлеры опций света и проводки для отдельных букв
    function initSeparateLettersCheckboxes() {
        const rowCheckbox = document.getElementById('montazh_svet_let');
        const checkboxLight = document.getElementById('checkbox_light_letter');
        const checkboxWiring = document.getElementById('checkbox_hidden-wiring');
        const rowDiv = checkboxLight.closest('.calc-mr__row');

        checkboxLight.addEventListener('change', () => {
            if (rowCheckbox.checked) {
                handlerPriceRow({rowDiv, rowCheckbox})
            }
            if (checkboxLight.checked) {
                checkboxWiring.closest('.checkbox_wiring').classList.add('active')
            } else {
                checkboxWiring.closest('.checkbox_wiring').classList.remove('active')
            }
        })
        checkboxWiring.addEventListener('change', () => {
            if (rowCheckbox.checked) {
                handlerPriceRow({rowDiv, rowCheckbox})
            }
        })
    }

    initSeparateLettersCheckboxes()

    //* Запускаем плагин кастомных селектов
    selectsArr.forEach(select => new Choices(select, {
        searchEnabled: false,
        itemSelectText: '',
        allowHTML: false,
        shouldSort: false
    }));

    function addTripCost() {
        if (!tripCheckboxesArr.some(checkbox => checkbox.checked)) {
            document.getElementById('vyezd_na_obekt').click()
        }
    }

    function handlerPriceRowTripGroup({rowDiv, rowCheckbox}) {
        const priceOutput = rowDiv.querySelector('.span-price');

        if (!rowCheckbox.checked) {
            priceOutput.textContent = 0;

            calculatePriceGroupSum(rowDiv);

            return
        }

        const price = rowCheckbox.dataset.price;
        const myTripCost = rowCheckbox.dataset.addTrip
            ? tripCost
            : 0;
        const amountTrips = rowDiv.querySelector('.counter__wrapper.counter_trip .counter__input')
            ? rowDiv.querySelector('.counter__input').value
            : 1;
        const hours = rowDiv.querySelector('.select__hours')
            ? rowDiv.querySelector('.select__hours').value
            : 1;

        priceOutput.textContent = formatNumber((price * hours + myTripCost) * amountTrips);

        calculatePriceGroupSum(rowDiv);
    }

    function handlerPriceRow({rowDiv, rowCheckbox}) {
        const priceOutput = rowDiv.querySelector('.span-price');

        if (!rowCheckbox.checked) {
            priceOutput.textContent = 0;
            calculatePriceGroupSum(rowDiv);

            return
        }
        //* Если у чекбокса имеется атрибут data-add-trip, то добавляем к стоимости цену выезда
        if (rowCheckbox.dataset.addTrip) addTripCost();

        if (rowCheckbox.dataset.priceFirst) {
            priceOutput.textContent = getNonlinearCostSum({rowDiv, rowCheckbox})
        } else if (rowCheckbox.dataset.separatedLetters) {
            priceOutput.textContent = getSeparatedLettersSum({rowDiv, rowCheckbox})
        } else {
            priceOutput.textContent = getCommonSum({rowDiv, rowCheckbox})
        }

        calculatePriceGroupSum(rowDiv);
    }

    function getCommonSum({rowDiv, rowCheckbox}) {
        const price = getDatasetPrice(rowCheckbox);
        //* selectPrice - цена, установленная в выпадающем списке
        const selectPrice = rowDiv.querySelector('.select__price')
            ? rowDiv.querySelector('.select__price').value
            : 1;
        //* amount - Выбираем счётчики, которые НЕ счётчики блоков и НЕ счётчики выездов
        const amount = rowDiv.querySelector('.counter__wrapper:not(.counter_trip, .sufx_block) .counter__input')
            ? rowDiv.querySelector('.counter__input').value
            : 1;
        //* blocks количество блоков (в одном блоке 3кв.м)
        const blocks = rowDiv.querySelector('.counter__wrapper.sufx_block .counter__input')
            ? (rowDiv.querySelector('.counter__input').value * 3)
            : 1;
        const hours = rowDiv.querySelector('.select__hours')
            ? rowDiv.querySelector('.select__hours').value
            : 1;
        const labourShift = rowDiv.querySelector('.select__smena')
            ? rowDiv.querySelector('.select__smena').value
            : 1;
        //* Повышающий коэффициент при использовании вышек, строительных лесов и т.д.
        const increasingCoefficient = rowCheckbox.dataset.coefficient
            ? parseFloat(rowDiv.closest('.calc-mr__group').querySelector('.select__coefficient').value)
            : 1;
        const extraExpense = rowCheckbox.dataset.extraExpense
            ? Number(rowCheckbox.dataset.extraExpense)
            : 0;

        return formatNumber(
            price
            * selectPrice
            * hours
            * amount
            * blocks
            * labourShift
            * increasingCoefficient
            + extraExpense
        );
    }

    function getNonlinearCostSum({rowDiv, rowCheckbox}) {
        const amount = Number(rowDiv.querySelector('.counter__wrapper .counter__input').value);
        if (amount === 0) return 0;

        const priceFirst = Number(rowCheckbox.dataset.priceFirst);
        const priceOthers = Number(rowCheckbox.dataset.price);

        return formatNumber(priceFirst + priceOthers * (amount - 1))
    }

    function getSeparatedLettersSum({rowDiv, rowCheckbox}) {
        const checkboxLetter = document.getElementById('checkbox_light_letter');
        const checkboxHiddenWiring = document.getElementById('checkbox_hidden-wiring');
        const baseOption = rowDiv.querySelector('.select_base').value;
        const amount = Number(rowDiv.querySelector('.counter__wrapper .counter__input').value);

        if (checkboxLetter.checked) {
            const wiringType = checkboxHiddenWiring.checked ? 'Hidden_' : 'Open_';

            const costMin = Number(rowCheckbox.dataset[`light${wiringType}${baseOption}`]);
            const costMax = Number(rowCheckbox.dataset[`light${wiringType}${baseOption}Max`]);

            const sum = ((costMin + costMax) / 2) * amount;

            return formatNumber(sum)
        }

        return formatNumber(amount * Number(rowCheckbox.dataset[`nonlight_${baseOption}`]))
    }

    function calculatePriceGroupSum(groupInnerElement) {
        const group = groupInnerElement.closest('.calc-mr__group');
        const groupSumOutput = group.querySelector('.calc-mr__group__footer .span-price');

        let sum = 0;
        group.querySelectorAll('.calc-mr__price-positions .span-price')
            .forEach(spanPrice => sum += cleanCostNumber(spanPrice.textContent));

        groupSumOutput.textContent = formatNumber(sum);

        calculateTotalSum()
    }

    function calculateTotalSum() {
        const totalOutput = document.getElementById('total_sum_mr');

        let sum = 0;
        document.querySelectorAll('.calc-mr__group__footer .span-price')
            .forEach(spanPrice => sum += cleanCostNumber(spanPrice.textContent));

        const value = formatNumber(sum)

        totalOutput.textContent = value;
        flyingOutput.textContent = value;
    }

    function getDatasetPrice(element) {
        if ("priceMax" in element.dataset) {
            return (Number(element.dataset.price) + Number(element.dataset.priceMax)) / 2
        }
        return element.dataset.price
    }

})