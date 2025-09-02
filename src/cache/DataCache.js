// const DataCache = new Map();

// export default DataCache;

// cache/DataCache.js

const PREFIX = "cache-";
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

const DataCache = (() => {
    const memoryCache = {};

    function set(key, value, { ttl = DEFAULT_TTL } = {}) {
        const expiry = ttl ? Date.now() + ttl : null;
        memoryCache[key] = { value, expiry };

        const item = JSON.stringify({ value, expiry });
        try {
            sessionStorage.setItem(PREFIX + key, item);
        } catch (err) {
            console.warn("sessionStorage full or unavailable", err);
        }
    }

    function get(key, { backgroundRefresh = false, fetcher = null } = {}) {
        const mem = memoryCache[key];
        if (mem && (!mem.expiry || mem.expiry > Date.now())) {
            return mem.value;
        }

        const raw = sessionStorage.getItem(PREFIX + key);
        if (!raw) return null;

        try {
            const { value, expiry } = JSON.parse(raw);
            const isExpired = expiry && expiry < Date.now();

            if (!isExpired) {
                memoryCache[key] = { value, expiry };
                return value;
            }

            // Expired
            if (backgroundRefresh && typeof fetcher === "function") {
                fetcher().then(data => {
                    if (data) set(key, data); // refresh cache in background
                });
            }

            return value; // stale value shown temporarily
        } catch (e) {
            sessionStorage.removeItem(PREFIX + key);
            return null;
        }
    }

    function clear(key) {
        delete memoryCache[key];
        sessionStorage.removeItem(PREFIX + key);
    }

    function clearAll() {
        Object.keys(sessionStorage)
            .filter(k => k.startsWith(PREFIX))
            .forEach(k => sessionStorage.removeItem(k));
        for (let k in memoryCache) {
            delete memoryCache[k];
        }
    }

    return {
        set,
        get,
        clear,
        clearAll,
    };
})();

export default DataCache;
