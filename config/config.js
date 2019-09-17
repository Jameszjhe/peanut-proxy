module.exports = {
    https: false,

    proxy: {
        context: "/",
        target: "http://",
        changeOrigin: true,
        logLevel: "debug",
    },
};