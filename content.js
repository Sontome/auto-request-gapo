function isTargetPage() {
    return window.location.href.includes("/approval/approver");
}
async function waitForGapoPage() {
    while (!window.GapoPage || !window.GapoEditor) {
        await new Promise(r => setTimeout(r, 100));
    }
}

async function boot() {
    const overlay = createOverlay();

    const noneBtn = document.getElementById("mode-none");
    const settleBtn = document.getElementById("mode-settlement");
    const form = document.getElementById("form");

    if (!noneBtn || !settleBtn) return; // chống chạy lại SPA

    let selectedMode = null;

    noneBtn.onclick = () => {
        selectedMode = "none";
        overlay.remove();
        GapoUtils.log("NONE mode");
    };

    settleBtn.onclick = () => {
        selectedMode = "settlement";
        form.style.display = "block";
    };

    document.getElementById("start").onclick = async () => {
        const data = {
            cif: document.getElementById("cif").value,
            name: document.getElementById("name").value,
            tc: document.getElementById("tc").value
        };

        overlay.remove();

        if (selectedMode === "none") {
            GapoUtils.log("SKIP automation");
            return;
        }

        if (selectedMode === "settlement") {
            window.GapoConfig = data;
            await runSettlementFlow(data);
        }
    };
}
async function runSettlementFlow(data) {

    await waitForGapoPage();
    if (!window.GapoPage || !window.GapoEditor) {
        GapoUtils.log("Chưa load đủ Gapo API");
        return;
    }
    
    GapoUtils.log("START");
    await GapoPage.addApprovNew();
    // dùng config user nhập
    await GapoEditor.fill(0, `Tất toán ${data.tc} ${data.name}`);
    await waitForGapoPage();
    await GapoEditor.fill(1, `
Tên khách hàng: ${data.name}
CIF: ${data.cif}
MÃ TC: ${data.tc}
Lý do y/c tất toán: tất toán bớt hđ
Nhờ A/c hỗ trợ đóng hđ cho KH
    `);

    await GapoPage.addFollower();
    await GapoPage.addApprover();

    GapoUtils.log("DONE ALL FLOW");
}
function isTargetPage() {
    return window.location.href.includes("/approval/approver");
}

async function tryBoot() {
    if (!isTargetPage()) return;

    // chờ UI mount thật sự (quan trọng)
    const waitRoot = () =>
        new Promise(resolve => {
            const check = () => {
                if (document.querySelector("body")) return resolve();
                requestAnimationFrame(check);
            };
            check();
        });

    await waitRoot();

    await new Promise(r => setTimeout(r, 800));

    if (window.__gapo_booted__) return;
    window.__gapo_booted__ = true;

    await boot();
}



// bắt SPA change route
function patchHistoryOnce() {
    if (window.__gapo_history_patched__) return;
    window.__gapo_history_patched__ = true;

    const originalPushState = history.pushState;

    history.pushState = function () {
        const result = originalPushState.apply(this, arguments);

        setTimeout(() => {
            window.dispatchEvent(new Event("routechange"));
        }, 50);

        return result;
    };

    window.addEventListener("popstate", () => {
        setTimeout(() => {
            window.dispatchEvent(new Event("routechange"));
        }, 50);
    });
}
patchHistoryOnce();

// lần đầu load
patchHistoryOnce();

tryBoot();

window.addEventListener("routechange", tryBoot);
window.addEventListener("popstate", tryBoot);

setInterval(() => {
    const onTarget = window.location.href.includes("/approval/approver");

    // nếu đã rời page → reset trạng thái
    if (!onTarget) {
        window.__gapo_booted__ = false;
        return;
    }

    // nếu vào đúng page mà chưa boot → boot lại
    if (onTarget && !window.__gapo_booted__) {
        tryBoot();
    }
}, 500);
let lastUrl = location.href;

setInterval(() => {
    if (location.href !== lastUrl) {
        lastUrl = location.href;

        window.__gapo_booted__ = false;
        tryBoot();
    }
}, 300);