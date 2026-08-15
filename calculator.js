(() => {
    const launcher = document.getElementById("calculator-launcher");
    const panel = document.getElementById("calculator-panel");
    const closeButton = document.getElementById("calculator-close");
    const display = document.getElementById("calculator-display");
    const history = document.getElementById("calculator-history");
    const grid = document.getElementById("calculator-grid");
    const inverseButton = document.getElementById("calculator-inverse");
    const memoryIndicator = document.getElementById("calculator-memory-indicator");
    const dragHandle = document.getElementById("calculator-drag-handle");

    if (!launcher || !panel || !display || !grid) {
        return;
    }

    let expression = "";
    let memory = 0;
    let justEvaluated = false;
    let inverseMode = false;

    function getAngleMode() {
        const checked = document.querySelector('input[name="calculator-angle"]:checked');
        return checked ? checked.value : "deg";
    }

    function toRadians(value) {
        return getAngleMode() === "deg"
            ? value * Math.PI / 180
            : value;
    }

    function fromRadians(value) {
        return getAngleMode() === "deg"
            ? value * 180 / Math.PI
            : value;
    }

    function formatNumber(value) {
        if (!Number.isFinite(value)) {
            throw new Error("Math error");
        }

        if (Object.is(value, -0)) {
            value = 0;
        }

        const abs = Math.abs(value);

        if ((abs !== 0 && abs < 1e-10) || abs >= 1e12) {
            return Number(value.toPrecision(12)).toExponential(8);
        }

        return String(Number(value.toPrecision(12)));
    }

    function prettyExpression(value) {
        return value
            .replace(/\*\*/g, " ^ ")
            .replace(/%/g, " Mod ")
            .replace(/\*/g, " × ")
            .replace(/\//g, " ÷ ")
            .replace(/\+/g, " + ")
            .replace(/-/g, " − ")
            .replace(/\s+/g, " ")
            .trim();
    }

    function updateDisplay() {
        display.value = expression ? prettyExpression(expression) : "0";
    }

    function showError() {
        display.value = "错误";
        history.textContent = "请检查输入";
        expression = "";
        justEvaluated = false;
    }

    function safeEvaluate(value = expression) {
        const source = value || display.value || "0";

        if (!/^[0-9eE+\-*/%.()\s]+$/.test(source)) {
            throw new Error("Invalid expression");
        }

        const result = Function(
            `"use strict"; return (${source});`
        )();

        if (typeof result !== "number" || !Number.isFinite(result)) {
            throw new Error("Math error");
        }

        return result;
    }

    function setResult(value, historyText = "") {
        const formatted = formatNumber(value);
        expression = formatted;
        display.value = formatted;
        history.textContent = historyText;
        justEvaluated = true;
    }

    function appendValue(value) {
        if (justEvaluated && /[0-9.(]/.test(value)) {
            expression = "";
            history.textContent = "";
        }

        justEvaluated = false;

        if (value === ".") {
            const currentNumber = expression.split(/\*\*|[+\-*/%()]/).pop();
            if (currentNumber && currentNumber.includes(".")) {
                return;
            }

            if (!currentNumber) {
                expression += "0";
            }
        }

        if (value === "(" && expression && /[0-9.)]$/.test(expression)) {
            expression += "*";
        }

        expression += value;
        updateDisplay();
    }

    function appendConstant(value) {
        if (justEvaluated) {
            expression = "";
            history.textContent = "";
        }

        justEvaluated = false;

        if (expression && /[0-9.)]$/.test(expression)) {
            expression += "*";
        }

        expression += formatNumber(value);
        updateDisplay();
    }

    function appendOperator(operator) {
        const internalOperator = operator === "power"
            ? "**"
            : operator === "mod"
                ? "%"
                : operator;

        if (!expression) {
            expression = display.value !== "错误" ? display.value : "0";
        }

        expression = expression.replace(/(\*\*|[+\-*/%])+$/, "");
        expression += internalOperator;
        justEvaluated = false;
        updateDisplay();
    }

    function evaluate() {
        if (!expression) return;

        try {
            const source = expression;
            const result = safeEvaluate(source);
            setResult(result, `${prettyExpression(source)} =`);
        } catch (error) {
            showError();
        }
    }

    function applyUnary(name) {
        try {
            const value = safeEvaluate();
            let result;
            let label = name;

            switch (name) {
                case "sin":
                    if (inverseMode) {
                        result = fromRadians(Math.asin(value));
                        label = "asin";
                    } else {
                        result = Math.sin(toRadians(value));
                    }
                    break;

                case "cos":
                    if (inverseMode) {
                        result = fromRadians(Math.acos(value));
                        label = "acos";
                    } else {
                        result = Math.cos(toRadians(value));
                    }
                    break;

                case "tan":
                    if (inverseMode) {
                        result = fromRadians(Math.atan(value));
                        label = "atan";
                    } else {
                        result = Math.tan(toRadians(value));
                    }
                    break;

                case "sinh":
                    result = inverseMode ? Math.asinh(value) : Math.sinh(value);
                    label = inverseMode ? "asinh" : "sinh";
                    break;

                case "cosh":
                    result = inverseMode ? Math.acosh(value) : Math.cosh(value);
                    label = inverseMode ? "acosh" : "cosh";
                    break;

                case "tanh":
                    result = inverseMode ? Math.atanh(value) : Math.tanh(value);
                    label = inverseMode ? "atanh" : "tanh";
                    break;

                case "ln":
                    result = Math.log(value);
                    break;

                case "log":
                    result = Math.log10(value);
                    break;

                case "exp":
                    result = Math.exp(value);
                    break;

                case "square":
                    result = value ** 2;
                    label = "x²";
                    break;

                case "cube":
                    result = value ** 3;
                    label = "x³";
                    break;

                case "sqrt":
                    result = Math.sqrt(value);
                    label = "√";
                    break;

                case "cuberoot":
                    result = Math.cbrt(value);
                    label = "∛";
                    break;

                case "reciprocal":
                    result = 1 / value;
                    label = "1/x";
                    break;

                case "int":
                    result = Math.trunc(value);
                    label = "Int";
                    break;

                case "factorial":
                    if (!Number.isInteger(value) || value < 0 || value > 170) {
                        throw new Error("Invalid factorial");
                    }

                    result = 1;
                    for (let i = 2; i <= value; i++) {
                        result *= i;
                    }
                    label = "n!";
                    break;

                default:
                    return;
            }

            setResult(result, `${label}(${formatNumber(value)})`);
        } catch (error) {
            showError();
        }
    }

    function applyPercent() {
        try {
            const value = safeEvaluate();
            setResult(value / 100, `${formatNumber(value)}%`);
        } catch (error) {
            showError();
        }
    }

    function toggleSign() {
        try {
            const value = safeEvaluate();
            setResult(-value, `± ${formatNumber(value)}`);
        } catch (error) {
            showError();
        }
    }

    function clearAll() {
        expression = "";
        display.value = "0";
        history.textContent = "";
        justEvaluated = false;
    }

    function backspace() {
        if (justEvaluated) {
            clearAll();
            return;
        }

        if (expression.endsWith("**")) {
            expression = expression.slice(0, -2);
        } else {
            expression = expression.slice(0, -1);
        }

        updateDisplay();
    }

    function currentValue() {
        try {
            return safeEvaluate();
        } catch (error) {
            return 0;
        }
    }

    function updateMemoryIndicator() {
        memoryIndicator.textContent = memory === 0 ? "" : `M = ${formatNumber(memory)}`;
    }

    function handleMemory(action) {
        switch (action) {
            case "memory-clear":
                memory = 0;
                break;
            case "memory-recall":
                appendConstant(memory);
                break;
            case "memory-store":
                memory = currentValue();
                break;
            case "memory-add":
                memory += currentValue();
                break;
            case "memory-subtract":
                memory -= currentValue();
                break;
            default:
                return;
        }

        updateMemoryIndicator();
    }

    function setPanelOpen(open) {
        panel.hidden = !open;
        launcher.setAttribute("aria-expanded", String(open));

        if (open) {
            launcher.textContent = "收起计算器";
        } else {
            launcher.textContent = "计算器";
        }
    }

    launcher.addEventListener("click", () => {
        setPanelOpen(panel.hidden);
    });

    if (closeButton) {
        closeButton.addEventListener("click", () => {
            setPanelOpen(false);
        });
    }

    grid.addEventListener("click", event => {
        const button = event.target.closest("button");
        if (!button) return;

        if (button.dataset.value !== undefined) {
            appendValue(button.dataset.value);
            return;
        }

        if (button.dataset.constant) {
            appendConstant(
                button.dataset.constant === "pi" ? Math.PI : Math.E
            );
            return;
        }

        if (button.dataset.operator) {
            appendOperator(button.dataset.operator);
            return;
        }

        if (button.dataset.function) {
            applyUnary(button.dataset.function);
            return;
        }

        const action = button.dataset.action;

        if (action && action.startsWith("memory-")) {
            handleMemory(action);
            return;
        }

        switch (action) {
            case "clear":
                clearAll();
                break;
            case "backspace":
                backspace();
                break;
            case "equals":
                evaluate();
                break;
            case "percent":
                applyPercent();
                break;
            case "sign":
                toggleSign();
                break;
            case "inverse":
                inverseMode = !inverseMode;
                inverseButton.classList.toggle("active", inverseMode);
                inverseButton.textContent = inverseMode ? "Inv ✓" : "Inv";
                break;
        }
    });

    document.addEventListener("keydown", event => {
        if (panel.hidden) return;

        const key = event.key;

        if (/^[0-9]$/.test(key) || key === "." || key === "(" || key === ")") {
            event.preventDefault();
            appendValue(key);
            return;
        }

        if (["+", "-", "*", "/"].includes(key)) {
            event.preventDefault();
            appendOperator(key);
            return;
        }

        if (key === "Enter" || key === "=") {
            event.preventDefault();
            evaluate();
            return;
        }

        if (key === "Backspace") {
            event.preventDefault();
            backspace();
            return;
        }

        if (key === "Escape") {
            event.preventDefault();
            setPanelOpen(false);
        }
    });

    if (dragHandle) {
        let dragging = false;
        let offsetX = 0;
        let offsetY = 0;

        dragHandle.addEventListener("pointerdown", event => {
            if (event.target.closest("button")) return;

            const rect = panel.getBoundingClientRect();
            dragging = true;
            offsetX = event.clientX - rect.left;
            offsetY = event.clientY - rect.top;

            panel.style.left = `${rect.left}px`;
            panel.style.top = `${rect.top}px`;
            panel.style.right = "auto";
            panel.style.bottom = "auto";

            dragHandle.setPointerCapture(event.pointerId);
        });

        dragHandle.addEventListener("pointermove", event => {
            if (!dragging) return;

            const maxLeft = Math.max(0, window.innerWidth - panel.offsetWidth);
            const maxTop = Math.max(0, window.innerHeight - panel.offsetHeight);

            const left = Math.min(
                maxLeft,
                Math.max(0, event.clientX - offsetX)
            );

            const top = Math.min(
                maxTop,
                Math.max(0, event.clientY - offsetY)
            );

            panel.style.left = `${left}px`;
            panel.style.top = `${top}px`;
        });

        dragHandle.addEventListener("pointerup", event => {
            dragging = false;
            dragHandle.releasePointerCapture(event.pointerId);
        });
    }

    clearAll();
    updateMemoryIndicator();
})();
