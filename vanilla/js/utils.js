/**
 * Обработчик кнопок +/- у числовых инпутов в указанной обёртке
 * @param wrappersArr - HTMLCollection элементов-обёрток (в д/случае .counter__wrapper)
 */

export function addInputNumberControls(wrappersArr) {
    const event = new InputEvent("input", {
        view: window,
        bubbles: true,
        cancelable: true,
    });

    wrappersArr.forEach(wrapper => {
        const input = wrapper?.querySelector("input[type='number']");

        wrapper?.querySelector('.counter__decrement').addEventListener('click', () => {
            if (input.value > 0) input.stepDown(1);
            input.dispatchEvent(event);
        })

        wrapper?.querySelector('.counter__increment').addEventListener('click', () => {
            input.stepUp(1);
            input.dispatchEvent(event);
        })
    })
}

/**
 *
 * @param postfix строка, после output`а. Заполняется при инициализации
 * @param initValue - начальное значение
 * @returns {{output: HTMLSpanElement}} output - вывод информации
 */
export function createFlyingOutput({initValue = '', postfix = ''}) {
    const windowDiv = document.createElement('div');
    const outputSpan = document.createElement('span');
    const postfixSpan = document.createElement('span');

    windowDiv.classList.add('a3t__window');
    outputSpan.classList.add('a3t__output');
    postfixSpan.classList.add('a3t__postfix');

    outputSpan.textContent = initValue;
    postfixSpan.textContent = postfix;

    windowDiv.append(outputSpan, postfixSpan)
    document.body.append(windowDiv)

    return {output: outputSpan}
}

/**
 *
 * @param priceOutput DOM-элемент, содержимое которого будем редактировать
 * @param onSubmit - действие при сохранении
 */
export function addManualCostEditor({priceOutput, onSubmit}) {
    const targetWrapper = priceOutput.closest('.calc-mr__price-wrapper');
    let myInput = undefined;
    let myInputWrapper = undefined;
    let myBtn = undefined;

    priceOutput.addEventListener('click', handlerElementClick);

    function handlerElementClick() {
        if(!myInput) {
            const {inputWrapper, input, btn} = createInputGroup();
            myInputWrapper = inputWrapper;
            myInput = input;
            myBtn = btn;
        }

        myInput.value = cleanCostNumber(priceOutput.textContent);
        targetWrapper.append(myInputWrapper);
        myInput.focus();

        myInput.addEventListener('keypress', handlerInputSubmit);
        myBtn.addEventListener('click', handlerSubmitBtn)
        window.addEventListener('keydown', handlerEscape);
        setTimeout(() => {
                window.addEventListener('click', handlerOutClick)
            },
            200
        )
    }

    function createInputGroup() {
        const inputWrapper = document.createElement('div');
        const input = document.createElement('input');
        const btn = document.createElement('button');

        inputWrapper.classList.add('a3t__editor');
        input.classList.add('a3t__editor__input');
        btn.classList.add('a3t__editor__btn');

        input.setAttribute('type', 'number');
        btn.setAttribute('type', 'button');

        input.value = cleanCostNumber(priceOutput.textContent);
        btn.textContent = 'OK';

        inputWrapper.append(input, btn)

        return {inputWrapper, input, btn}
    }

    function handlerInputSubmit(event) {
        if (event.key === 'Enter') {
            priceOutput.textContent = formatNumber(myInput.value);
            removeInput();
            onSubmit(priceOutput)
        }
    }

    function handlerEscape(event) {
        if (event.key === "Escape") removeInput();
    }

    function handlerOutClick(event) {
        if (event.target !== myInput) removeInput();
    }

    function handlerSubmitBtn(event) {
        event.preventDefault();

        priceOutput.textContent = formatNumber(myInput.value);
        removeInput();
        onSubmit(priceOutput)
    }

    function removeInput() {
        myInput.removeEventListener('keypress', handlerInputSubmit);
        window.removeEventListener('keydown', handlerEscape);
        window.removeEventListener('click', handlerOutClick);
        myInputWrapper.remove();
    }
}

const formatter = new Intl.NumberFormat("ru-RU", {})
export function formatNumber(value) {
    return formatter.format(Number(value))
}

export function cleanCostNumber(value) {
    return Number(value.replace(/\s+/g, ''))
}

