
const express = require("express");
const http = require("http");
const https = require("https");
const httpProxyMiddleware = require('http-proxy-middleware');

class Server {
    constructor(options) {
        this.options = options;

        this.setupApp();
        this.setProxy();
        this.createServer();
    }

    setupApp() {
        this.app = new express();
    }

    setProxy() {
        if (!this.options.proxy) {
            return;
        }

        if (!Array.isArray(this.options.proxy)) {
            if (Object.prototype.hasOwnProperty.call(this.options.proxy, 'target')) {
                this.options.proxy = [this.options.proxy];
            } else {
                this.options.proxy = Object.keys(this.options.proxy).map((context) => {
                    let proxyOptions;
                    const correctedContext = context
                        .replace(/^\*$/, '**')
                        .replace(/\/\*$/, '');

                    if (typeof this.options.proxy[context] === 'string') {
                        proxyOptions = {
                            context: correctedContext,
                            target: this.options.proxy[context],
                        };
                    } else {
                        proxyOptions = Object.assign({}, this.options.proxy[context]);
                        proxyOptions.context = correctedContext;
                    }

                    proxyOptions.logLevel = proxyOptions.logLevel || 'warn';

                    return proxyOptions;
                });
            }
        }

        const getProxyMiddleware = (proxyConfig) => {
            const context = proxyConfig.context || proxyConfig.path;

            if (proxyConfig.target) {
                return httpProxyMiddleware(context, proxyConfig);
            }
        };

        this.options.proxy.forEach((proxyConfigOrCallback) => {
            let proxyMiddleware;

            let proxyConfig =
                typeof proxyConfigOrCallback === 'function'
                    ? proxyConfigOrCallback()
                    : proxyConfigOrCallback;

            proxyMiddleware = getProxyMiddleware(proxyConfig);

            if (proxyConfig.ws) {
                this.websocketProxies.push(proxyMiddleware);
            }

            this.app.use((req, res, next) => {
                if (typeof proxyConfigOrCallback === 'function') {
                    const newProxyConfig = proxyConfigOrCallback();

                    if (newProxyConfig !== proxyConfig) {
                        proxyConfig = newProxyConfig;
                        proxyMiddleware = getProxyMiddleware(proxyConfig);
                    }
                }

                const isByPassFuncDefined = typeof proxyConfig.bypass === 'function';
                const bypassUrl = isByPassFuncDefined
                    ? proxyConfig.bypass(req, res, proxyConfig)
                    : null;

                if (typeof bypassUrl === 'boolean') {
                    // skip the proxy
                    req.url = null;
                    next();
                } else if (typeof bypassUrl === 'string') {
                    // byPass to that url
                    req.url = bypassUrl;
                    next();
                } else if (proxyMiddleware) {
                    return proxyMiddleware(req, res, next);
                } else {
                    next();
                }
            });
        });
    }

    createServer() {
        if (this.options.https) {
            console.warn("HTTPS is not supported!");
        } else {
            this.listeningApp = http.createServer(this.app);
        }
    }

    listen(port, host, fn) {
        if (this.listeningApp) {
            this.listeningApp.listen(port, host, fn);
        } else {
            console.log("Listening App is null.");
        }
    }
}

module.exports = Server;