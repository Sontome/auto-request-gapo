function isSourcePage() {
    return location.href.startsWith("https://los.tima.vn/loanbrief-search/index.html");
}

function isGapoTargetPage() {
    return window.location.href.includes("/approval/approver");
}

function normalizeText(s) {
    return (s || "").replace(/\s+/g, " ").trim();
}

function extractCustomerInfo() {
    const box = document.querySelector(".m-demo-icon__class.title-uppercase");
    if (!box) return { name: "", cif: "" };

    // text đầu: "HĐ-9655053 Nguyễn Thị Kim Oanh"
    const rawHeader = normalizeText(box.childNodes[0]?.textContent || "");
    const nameMatch = rawHeader.match(/^HĐ-\S+\s+(.+)$/i);
    const name = nameMatch ? normalizeText(nameMatch[1]) : rawHeader;

    // CIF trong span hoặc fallback regex
    const cifFromSpan = normalizeText(box.querySelector("div span")?.textContent || "");
    const cifFromText = (box.textContent.match(/CIF:\s*([0-9]+)/i) || [])[1] || "";
    const cif = cifFromSpan || cifFromText;

    return { name, cif };
}

function extractTcListNotSettled() {
    const rows = [...document.querySelectorAll("tr[data-row]")];
    const result = [];
    const allowedStatuses = new Set(["đang vay", "nợ lãi phí"]);
    for (const row of rows) {
        const cells = row.querySelectorAll("td");
        if (cells.length < 2) continue;
        // Cột TC (theo HTML mẫu là cột thứ 2)
        const tc = normalizeText(cells[1]?.querySelector("span")?.textContent || "");
        if (!tc) continue;
        // Cột trạng thái thường nằm cuối, có thẻ <a>
        const statusAnchor = cells[cells.length - 1]?.querySelector("a");
        const statusText = normalizeText(statusAnchor?.textContent || "").toLowerCase();
        if (allowedStatuses.has(statusText)) {
            result.push(tc);
        }
    }
    return [...new Set(result)];
}


function escapeHtml(str) {
    return String(str || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}
function openTcConfirmModal(initialTcList, onConfirm) {
    const overlay = document.createElement("div");
    overlay.className = "gapo-tc-overlay";
    const box = document.createElement("div");
    box.className = "gapo-tc-modal";
    box.innerHTML = `
        <div class="gapo-tc-modal__header">
            <h3 class="gapo-tc-modal__title">Danh sách TC chưa Tất toán</h3>
            <div class="gapo-tc-modal__subtitle">
                Bạn có thể xóa bớt hoặc thêm TC trước khi xác nhận.
            </div>
        </div>
        <div class="gapo-tc-modal__body">
            <div id="tc-list" class="gapo-tc-list"></div>
            <div class="gapo-tc-add-wrap">
                <input id="tc-new" class="gapo-tc-input" placeholder="Ví dụ: TC-141214" />
                <button id="tc-add" class="gapo-btn gapo-btn--add">+ Thêm</button>
            </div>
            
        </div>
        <div class="gapo-tc-modal__footer">
            <button id="tc-cancel" class="gapo-btn gapo-btn--ghost">Hủy</button>
            <button id="tc-ok" class="gapo-btn gapo-btn--primary">Xác nhận</button>
        </div>
    `;
    let tcList = [...initialTcList];
    const listEl = box.querySelector("#tc-list");
    const inputEl = box.querySelector("#tc-new");
    function renderList() {
        if (!tcList.length) {
            listEl.innerHTML = `<div class="gapo-tc-empty">Chưa có TC nào. Bạn có thể thêm thủ công.</div>`;
            return;
        }
        listEl.innerHTML = tcList
            .map(
                (tc, idx) => `
                <div class="gapo-tc-row">
                    <div class="gapo-tc-row__left">
                        <span class="gapo-tc-index">${idx + 1}</span>
                        <span class="gapo-tc-text">${escapeHtml(tc)}</span>
                    </div>
                    <button data-tc="${escapeHtml(tc)}" class="gapo-tc-remove">Xóa</button>
                </div>
            `
            )
            .join("");
        listEl.querySelectorAll("button[data-tc]").forEach((btn) => {
            btn.onclick = () => {
                const tc = btn.getAttribute("data-tc");
                tcList = tcList.filter((x) => x !== tc);
                renderList();
            };
        });
    }
    function addTc() {
        const val = (inputEl.value || "").trim().replace(/\s+/g, " ");
        if (!val) return;
        if (!tcList.includes(val)) tcList.push(val);
        inputEl.value = "";
        inputEl.focus();
        renderList();
    }
    box.querySelector("#tc-add").onclick = addTc;
    inputEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") addTc();
    });
    box.querySelector("#tc-cancel").onclick = () => overlay.remove();
    box.querySelector("#tc-ok").onclick = () => {
        const finalTcString = tcList.join(" ");
        onConfirm(finalTcString);
        overlay.remove();
    };
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) overlay.remove();
    });
    renderList();
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    inputEl.focus();
}

function createSourceStartButton() {
    if (document.getElementById("gapo-source-start")) return;

    const btn = document.createElement("button");
    btn.id = "gapo-source-start";
    btn.textContent = "Tạo đề xuất Tất toán";
    btn.style.cssText = `
        position: fixed;
        right: 20px;
        bottom: 20px;
        z-index: 999999;
        padding: 10px 14px;
        border-radius: 8px;
        border: none;
        background: #6c7293;
        color: #fff;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 6px 16px rgba(0,0,0,0.2);
    `;
    btn.addEventListener("mouseenter", () => {
        btn.style.background = "#565c78"; // đậm hơn
    });
    
    btn.addEventListener("mouseleave", () => {
        btn.style.background = "#6c7293";
    });

    btn.onclick = () => {
        const { name, cif } = extractCustomerInfo();
        const tcList = extractTcListNotSettled();

        openTcConfirmModal(tcList, (finalTcString) => {
            const tcValue = (finalTcString || "").trim();
            // Chặn nếu không có TC
            if (!tcValue) {
                alert(" Vui lòng mở một hợp đồng cần tất toán trước khi xác nhận.");
                return;
            }
            // const ok = confirm(
            //     `Xác nhận gửi dữ liệu?\n\n` +
            //     `Tên: ${name || "(trống)"}\n` +
            //     `CIF: ${cif || "(trống)"}\n` +
            //     `TC: ${finalTcString || "(trống)"}`
            // );
            // if (!ok) return;

            chrome.runtime.sendMessage(
                {
                    // Giữ type cũ để tương thích background.js hiện tại
                    type: "START_GAPO_FROM_SOURCE",
                    payload: {
                        name,
                        cif,
                        tc: finalTcString
                    }
                },
                () => {
                    const err = chrome.runtime.lastError;
                    if (err) {
                        alert("Không gửi được dữ liệu sang background: " + err.message);
                    }
                }
            );
        });
    };

    document.body.appendChild(btn);
}

async function waitForGapoPage() {
    while (!window.GapoPage || !window.GapoEditor) {
        await new Promise((r) => setTimeout(r, 100));
    }
}

async function runSettlementFlow(data) {
    await waitForGapoPage();

    if (!window.GapoPage || !window.GapoEditor) {
        GapoUtils.log("Chưa load đủ Gapo API");
        return;
    }

    GapoUtils.log("START");
    await GapoPage.addApprovNew();

    await GapoEditor.fill(0, `Tất toán ${data.tc} ${data.name}`);
    await waitForGapoPage();

    await GapoEditor.fill(
        1,
        `
Tên khách hàng: ${data.name}
CIF: ${data.cif}
MÃ TC: ${data.tc}
Lý do y/c tất toán: tất toán bớt hđ
Nhờ A/c hỗ trợ đóng hđ cho KH
    `
    );

    await GapoPage.addFollower();
    await GapoPage.addApprover();

    GapoUtils.log("DONE ALL FLOW");
}

async function boot() {
    // có data auto thì chạy luôn, bỏ qua overlay nhập tay
    if (window.GapoConfig?.cif && window.GapoConfig?.name && window.GapoConfig?.tc) {
        await runSettlementFlow(window.GapoConfig);
        return;
    }
    return;
    const overlay = createOverlay();
    const noneBtn = document.getElementById("mode-none");
    const settleBtn = document.getElementById("mode-settlement");
    const form = document.getElementById("form");

    if (!noneBtn || !settleBtn) return;

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

chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type !== "RUN_SETTLEMENT_WITH_DATA") return;
    if (!isGapoTargetPage()) return;

    const data = msg.payload || {};
    window.GapoConfig = data;
    window.__gapo_booted__ = false;

    (async () => {
        await runSettlementFlow(data);
    })();
});

async function tryBoot() {
    if (!isGapoTargetPage()) return;

    const waitRoot = () =>
        new Promise((resolve) => {
            const check = () => {
                if (document.querySelector("body")) return resolve();
                requestAnimationFrame(check);
            };
            check();
        });

    await waitRoot();
    await new Promise((r) => setTimeout(r, 800));

    if (window.__gapo_booted__) return;
    window.__gapo_booted__ = true;

    await boot();
}

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

if (isSourcePage()) {
    createSourceStartButton();
} else if (isGapoTargetPage()) {
    // tryBoot();
    // window.addEventListener("routechange", tryBoot);
    // window.addEventListener("popstate", tryBoot);
}



let lastUrl = location.href;
