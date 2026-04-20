window.GapoEditor = {

    getEditors() {
        return [...document.querySelectorAll(".styles_inputWrapper__g1Eh8")];
    },

    async getReadyEditor(index = 0) {
        return await GapoUtils.waitFor(() => {
            const box = this.getEditors()[index];

            if (!box) return null;

            const input = box.querySelector(".public-DraftEditor-content");

            if (!input) return null;

            return box;
        });
    },

    async click(index = 0) {

        const box = await this.getReadyEditor(index);

        if (!box) {
            GapoUtils.log("Editor chưa sẵn sàng", index);
            return false;
        }

        GapoUtils.scrollTo(box);

        const target = box.querySelector(".public-DraftEditor-content");

        target.dispatchEvent(new MouseEvent("mousedown", {
            bubbles: true
        }));

        target.click();
        target.focus();

        GapoUtils.log("Đã click editor", index);

        return true;
    },

    async fill(index = 0, text = "") {

        const box = await this.getReadyEditor(index);
        if (!box) return false;
    
        await this.click(index);
    
        // 🔥 luôn re-query editable fresh
        const editable = await GapoUtils.waitFor(() => {
            const el = box.querySelector(".public-DraftStyleDefault-block");
            return el || null;
        });
    
        if (!editable) return false;
    
        editable.focus();
    
        // 🔥 reset selection sạch hoàn toàn
        const sel = window.getSelection();
        sel.removeAllRanges();
    
        // reset DOM state trước khi insert
        editable.innerHTML = "";
    
        await new Promise(r => setTimeout(r, 50));
    
        const finalText = "" + text;
    
        // 👉 insert an toàn hơn execCommand + range
        editable.textContent = finalText;
    
        // set cursor cuối (SAFE RANGE)
        const range = document.createRange();
        range.selectNodeContents(editable);
        range.collapse(false);
    
        sel.removeAllRanges();
        sel.addRange(range);
    
        editable.dispatchEvent(new InputEvent("input", {
            bubbles: true
        }));
    
        GapoUtils.log("Đã nhập:", text);
    
        return true;
    }
};