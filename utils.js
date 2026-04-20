window.GapoUtils = {

    sleep(ms) {
        return new Promise(r => setTimeout(r, ms));
    },

    log(...args) {
        console.log("🚀", ...args);
    },

    scrollTo(el) {
        el.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    },

    async waitFor(fn, timeout = 8000, interval = 80) {
        const start = Date.now();

        while (Date.now() - start < timeout) {
            const result = fn();

            if (result) return result;

            await this.sleep(interval);
        }

        return null;
    }

};