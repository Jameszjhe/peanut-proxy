#!/usr/bin/env node

const Server = require("../lib/server");
const config = require("../config/config.js");

const server = new Server(config);

const port = process.env.PORT = 9090;
const host = process.env.HOST = "0.0.0.0";

server.listen(port, host, (err) => {
    if (err) {
        console.error(err);
    } else {
        console.info(`Server is running on ${host}:${port}`);
    }
});