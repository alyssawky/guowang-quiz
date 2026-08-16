// 自动把同一道资料分析题中的多张网页原生图表放到同一行。
(function () {
    const GRID_CLASS = "da-multi-visual-grid";

    function groupParent(parent) {
        if (!parent || parent.classList.contains(GRID_CLASS)) return;

        const visuals = Array.from(parent.children).filter(
            child => child.classList && child.classList.contains("da-native-visual")
        );

        if (visuals.length < 2) return;

        // 已经被处理过就不重复包裹。
        if (visuals.some(item => item.parentElement && item.parentElement.classList.contains(GRID_CLASS))) {
            return;
        }

        const grid = document.createElement("div");
        grid.className = GRID_CLASS;
        parent.insertBefore(grid, visuals[0]);
        visuals.forEach(item => grid.appendChild(item));
    }

    function scan(root) {
        if (!root) return;

        const visuals = [];
        if (root.nodeType === 1 && root.classList && root.classList.contains("da-native-visual")) {
            visuals.push(root);
        }
        if (root.querySelectorAll) {
            visuals.push(...root.querySelectorAll(".da-native-visual"));
        }

        const parents = new Set(visuals.map(item => item.parentElement).filter(Boolean));
        parents.forEach(groupParent);
    }

    function install() {
        scan(document);

        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) scan(node);
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", install, { once: true });
    } else {
        install();
    }
})();
