function createOverlay() {
    const overlay = document.createElement("div");
    overlay.id = "gapo-tool-overlay";
    overlay.innerHTML = `
        <div class="box">
            <h3>Chọn chức năng</h3>
            
            <button id="mode-none">None</button>
            <button id="mode-settlement">Tất toán</button>

            <div id="form" style="display:none; margin-top:10px;">
                <input id="cif" placeholder="CIF" />
                <input id="name" placeholder="Tên khách hàng" />
                <input id="tc" placeholder="Mã TC" />

                <button id="start">Bắt đầu</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    return overlay;
}