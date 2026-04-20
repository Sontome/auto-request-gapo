// page.js
window.GapoPage = {
    // =========================
    // COMMON WAITERS
    // =========================
    waitUntil(fn, timeout = 10000, interval = 200) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
    
            const loop = async () => {
                try {
                    const result = fn();
                    if (result) return resolve(result);
    
                    if (Date.now() - start > timeout) {
                        return reject(new Error("waitFor timeout"));
                    }
    
                    setTimeout(loop, interval);
                } catch (e) {
                    setTimeout(loop, interval);
                }
            };
    
            loop();
        });
    },

    waitVisible(selector, timeout = 10000) {
        return this.waitUntil(() => {
            const el = document.querySelector(selector);
            if (!el) return null;
    
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) return el;
    
            return null;
        }, timeout);
    },

    click(el) {
        if (!el) return false;

        el.scrollIntoView({
            behavior: "instant",
            block: "center",
            inline: "center"
        });

        el.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
        el.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
        el.dispatchEvent(new MouseEvent("click", { bubbles: true }));

        return true;
    },

    // =========================
    // FOLLOWER BUTTON
    // =========================
    findApprovDefault() {
        const buttons = [...document.querySelectorAll("button")];
    
        const matches = buttons.filter(btn => {
            const txt = btn.innerText
                ?.replace(/\s+/g, " ")
                .trim()
                .toLowerCase();
    
            return txt?.includes("đề xuất tr");
        });
    
        return matches.at(-1) || null;
    },
    findFollowerButton() {
        const buttons = [...document.querySelectorAll("button")];

        return buttons.find(btn => {
            const txt = btn.innerText?.trim().toLowerCase();
            return txt === "thêm người theo dõi";
        }) || null;
    },
    findCreateButton() {
        const buttons = [...document.querySelectorAll("button")];

        return buttons.find(btn => {
            const txt = btn.innerText?.trim().toLowerCase();
            return txt?.includes("tạo yêu cầu");
        }) || null;
    },
    findApproverButton() {
        const buttons = [...document.querySelectorAll("button")];
    
        return buttons.find(btn => {
            // loại mấy button to khác
            const style = btn.getAttribute("style") || "";
    
            // chỉ target nút nhỏ icon "+"
            const isSmallIcon = style.includes("max-width: 32px");
    
            // check svg path đặc trưng dấu "+"
            const hasPlusIcon = btn.querySelector("svg path[d*='M12 3']");
    
            return isSmallIcon && hasPlusIcon;
        }) || null;
    },
    setNativeValue(el, value) {
        const valueSetter = Object.getOwnPropertyDescriptor(el, "value")?.set;
        const prototype = Object.getPrototypeOf(el);
        const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
    
        if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
            prototypeValueSetter.call(el, value);
        } else if (valueSetter) {
            valueSetter.call(el, value);
        } else {
            el.value = value;
        }
    
        el.dispatchEvent(new Event("input", { bubbles: true }));
    },
    
    async addFollower() {
        const names = [
            "nguyễn thị hà",
            "phạm thị hương"
        ];
    
        // mở popup
        const btn = await this.waitUntil(() => this.findFollowerButton(), 10000);
        this.click(btn);
    
        GapoUtils.log("Mở popup follower");
    
        for (let i = 0; i < names.length; i++) {
            const name = names[i];
    
            // đợi input load lại thật sự
            const input = await this.waitUntil(() =>
                document.querySelector('input[placeholder="Tìm kiếm"]'),
                10000
            );
            GapoUtils.log("Thấy ô tìm kiếm");
            input.focus();
    
            // clear + set chuẩn React
            this.setNativeValue(input, "");
            

            this.setNativeValue(input, name);
            GapoUtils.log("Search: " + name);
            await new Promise(r => setTimeout(r, 400));
            // đợi list update
            let item = await this.waitUntil(() => {
                const nodes = [...document.querySelectorAll(
                    ".gapo-Typography.gapo-Typography--bodySmall.gapo-Typography--ellipsis"
                )];
            
                return nodes.find(el =>
                    el.innerText?.trim().includes("Phòng vận hành")
                );
            }, 10000);
            
            if (!item) {
                throw new Error("Không tìm thấy Phòng vận hành");
            }
            let nodes = [...document.querySelectorAll(
                ".gapo-Typography.gapo-Typography--bodySmall.gapo-Typography--ellipsis"
            )].filter(el =>
                el.innerText?.trim().includes("Phòng vận hành")
            );
            
            if (!nodes.length) {
                throw new Error("Không tìm thấy Phòng vận hành");
            }
            
            
            GapoUtils.log("đã thấy tên");
            let target =
                item.closest("button") ||
                item.closest('[role="button"]') ||
                item.parentElement;
    
            this.click(target);
    
            GapoUtils.log("Đã add: " + name);
    
            // 🔥 QUAN TRỌNG: đợi UI update thật sự
            let result = await this.waitUntil(() => {
                const el = [...document.querySelectorAll(
                    ".gapo-Typography.gapo-Typography--headingXSmall"
                )].find(e => {
                    const txt = e.innerText?.trim();
                    return txt === "1 THÀNH VIÊN" || txt === "2 THÀNH VIÊN";
                });
            
                return el ? el.innerText.trim() : null;
            }, 10000);
            
            // đợi popup stable trước khi add người tiếp theo
            await new Promise(r => setTimeout(r, 10));
        }
        
        const doneBtn = await this.waitUntil(() => {
            const btn = [...document.querySelectorAll("button")]
                .find(el => el.innerText?.trim() === "Xong");
        
            if (!btn) return null;
        
            const rect = btn.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return null;
        
            return btn;
        }, 10000);
        
        if (!doneBtn) {
            throw new Error("Không tìm thấy nút Xong");
        }
        this.click(doneBtn);
        GapoUtils.log("DONE follower");
    },
    findAddFileButton() {
        const buttons = [...document.querySelectorAll("button")];
    
        return buttons.find(btn =>
            btn.querySelector('input[type="file"]')
        ) || null;
    },
    async runSettlement(data) {
        GapoUtils.log("START settlement");
    
        GapoUtils.log(data);
    
        // dùng data.cif, data.name, data.tc thay cho hardcode
    },
    async addApprover() {
        const names = [
            "trịnh xuân sơn"
        ];
    
        // mở popup
        const btn = await this.waitUntil(() => this.findApproverButton(), 10000);
        this.click(btn);
    
        GapoUtils.log("Mở popup Approver");
    
        for (let i = 0; i < names.length; i++) {
            const name = names[i];
    
            // đợi input load lại thật sự
            const input = await this.waitUntil(() =>
                document.querySelector('input[placeholder="Tìm kiếm"]'),
                10000
            );
            GapoUtils.log("Thấy ô tìm kiếm");
            input.focus();
    
            // clear + set chuẩn React
            this.setNativeValue(input, "");
            

            this.setNativeValue(input, name);
            GapoUtils.log("Search: " + name);
            await new Promise(r => setTimeout(r, 400));
            // đợi list update
            let item = await this.waitUntil(() => {
                const nodes = [...document.querySelectorAll(
                    ".gapo-Typography.gapo-Typography--bodySmall.gapo-Typography--ellipsis"
                )];
            
                return nodes.find(el =>
                    el.innerText?.trim().includes("Phòng vận hành")
                );
            }, 10000);
            
            if (!item) {
                throw new Error("Không tìm thấy Phòng vận hành");
            }
            let nodes = [...document.querySelectorAll(
                ".gapo-Typography.gapo-Typography--bodySmall.gapo-Typography--ellipsis"
            )].filter(el =>
                el.innerText?.trim().includes("Phòng vận hành")
            );
            
            if (!nodes.length) {
                throw new Error("Không tìm thấy Phòng vận hành");
            }
            
            
            GapoUtils.log("đã thấy tên");
            let target =
                item.closest("button") ||
                item.closest('[role="button"]') ||
                item.parentElement;
    
            this.click(target);
    
            GapoUtils.log("Đã add: " + name);
    
            // 🔥 QUAN TRỌNG: đợi UI update thật sự
            let result = await this.waitUntil(() => {
                const el = [...document.querySelectorAll(
                    ".gapo-Typography.gapo-Typography--headingXSmall"
                )].find(e => {
                    const txt = e.innerText?.trim();
                    return txt === "1 THÀNH VIÊN" || txt === "2 THÀNH VIÊN";
                });
            
                return el ? el.innerText.trim() : null;
            }, 10000);
            
            // đợi popup stable trước khi add người tiếp theo
            await new Promise(r => setTimeout(r, 10));
        }
        
        const doneBtn = await this.waitUntil(() => {
            const btn = [...document.querySelectorAll("button")]
                .find(el => el.innerText?.trim() === "Xong");
        
            if (!btn) return null;
        
            const rect = btn.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return null;
        
            return btn;
        }, 10000);
        
        if (!doneBtn) {
            throw new Error("Không tìm thấy nút Xong");
        }
        this.click(doneBtn);
        const approver = await this.waitUntil(() => {
            const el = [...document.querySelectorAll(".gapo-Typography")]
                .find(node =>
                    node.innerText?.trim().includes("Người phê duyệt")
                );
        
            if (!el) return null;
        
            const rect = el.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return null;
        
            return el;
        }, 10000);
        GapoUtils.log("DONE Approver");
        await new Promise(r => setTimeout(r, 1000));
        let btnadd = await this.waitUntil(() => this.findAddFileButton(), 10000);
        this.click(btnadd);
    },
    async addApprovNew() {

        let btn = await this.waitUntil(() => this.findCreateButton(), 10000);
    
        if (!btn) {
            throw new Error("Không tìm thấy nút Tạo yêu cầu");
        }
    
        this.click(btn);
    
        GapoUtils.log("Mở popup Approver");
        btn = await this.waitUntil(() => this.findApprovDefault(), 10000);

        if (!btn) throw new Error("Không tìm thấy Đề xuất trực tiếp");

        this.click(btn);
        GapoUtils.log("Mở Default Approver");
    }
};