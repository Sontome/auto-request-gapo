async function waitForGapoPage() {
    while (!window.GapoPage || !window.GapoEditor) {
        await new Promise(r => setTimeout(r, 100));
    }
}
(async function init() {
    const overlay = createOverlay();

    const noneBtn = document.getElementById("mode-none");
    const settleBtn = document.getElementById("mode-settlement");
    const form = document.getElementById("form");

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

})();
async function runSettlementFlow(data) {

    await waitForGapoPage();
    
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