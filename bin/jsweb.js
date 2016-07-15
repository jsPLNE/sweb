#!/usr/bin/env node
var fs = require('fs');
var jsweb_home = __dirname + "/..";
var api_root = process.argv[2] || process.cwd();
if (api_root[0] !== '/') {
    try {
        process.chdir(api_root);
        api_root = process.cwd();
    } catch (error) {
        console.error(api_root, " is not a valid directory");
        process.exit(-2);
    }
}
// console.log("api_root  = ", api_root);
// console.log("jsweb_home = ", jsweb_home);

function get_ports(path) {
    try {
        fs.accessSync(path, fs.F_OK);
    } catch (error) {
        return [];
    }
    var files = fs.readdirSync(path);
    var ports = [];
    for (var i = 0; i < files.length; i++) {
        var file        = files[i];
        var base        = api_root + "/" + file;
        var mount_point = "/";
        var port        = file;
        if (port.slice(-1) === ']') {
            j = port.lastIndexOf("[");
            if (j > 0) {
                mount_point = port.substring(j + 1);
                mount_point = mount_point.substring(0, mount_point.length - 1);
                port = port.substring(0, j);
            }
        }
        if (!(/\d+/.test(port))) { continue; };
        if (!fs.statSync(base).isDirectory()) {
            continue;
        };
        port = parseInt(port, 10);
        if (port <=0 || port > 65535) { continue; };
        if (!(/[Ww]in.*/.test(process.platform))
            && port <= 1024
            && process.getuid() !== 0) {
            console.log("Port below 1024. Need root user right for: port [%s]", port);
            process.exit(-1);
        }
        mount_point = mount_point.replace(/#/g, '/');
        if (mount_point[0] !== '/') {
            mount_point = '/' + mount_point;
        }
        if (mount_point.substr(-1) === '/') {
            mount_point = mount_point.substring(0, mount_point.length - 1);
        }
        ports.push({
            port : port,
            base : base,
            mount_point : mount_point
        })
    }
    return ports;
};

var ports = get_ports(api_root);
if (ports.length === 0) {
    console.log("Can not find any directory contain jsweb at :", api_root);
    console.log("Please visit https://github.com/conwin/jsweb for more details.");
}
var child_process = require('child_process');
var servers = [];
for (var i = 0; i < ports.length; i++) {
    servers.push(child_process.fork(jsweb_home + "/lib/jsweb-server.js",
                                    [ports[i].port,
                                     ports[i].base,
                                     ports[i].mount_point]));
};

