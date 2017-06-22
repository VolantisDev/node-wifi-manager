var async = require("async"),
    iplink = require("./iplink"),
    iwconfig = require("./iwconfig"),
    ifconfig = require("./ifconfig"),
    iwlist = require("./iwlist"),
    netctl = require('./netctl');

/*****************************************************************************\
    Return a set of functions which we can use to manage and check our wifi
    connection information
\*****************************************************************************/
module.exports = {
    get_wifi_interface: get_wifi_interface,
    get_wifi_info: get_wifi_info,
    restart_interface: restart_interface,
    scan_networks: scan_networks,
    is_wifi_enabled: is_wifi_enabled,
    enable_wifi: enable_wifi
}

function get_wifi_interface(callback) {
    iwconfig.get_interface(callback);
}

// Get generic info on an interface
function get_wifi_info(wifi_interface, callback) {
    var output = [];

    async.series([
        function run_ifconfig(next_step) {
            ifconfig.status(wifi_interface, function (error, info) {
                if (!error) output.concat(info);
                next_step(error);
            });
        },
        function run_iwconfig(next_step) {
            iwconfig.status(wifi_interface, function (error, info) {
                if (!error) output.concat(info);
                next_step(error);
            });
        },
    ], function(error) {
        return callback(error, output);
    });
}

function restart_interface(wifi_interface, callback) {
    iplink.restart(wifi_interface, callback);
}

function scan_networks(wifi_interface, callback) {
    iwlist(wifi_interface, callback);
}

function is_wifi_enabled(wifi_interface, callback) {
    get_wifi_info(wifi_interface, function(error, info) {
        if (error) return callback(error, null);

        var return_info = null;
        if ("<unknown>" != info["inet_addr"] &&
            "<unknown>" == info["unassociated"]) {
            return_info = info["inet_addr"];
        }

        return callback(null, return_info);
    });
}

// Disables AP mode and reverts to wifi connection
function enable_wifi(wifi_interface, connection_info, callback) {
    async.series([
        function save_wifi_profile(next_step) {
            netctl.save_wifi_profile(wifi_interface, connection_info, next_step);
        },
        function restart_netctl_auto(next_step) {
            netctl.restart_auto(wifi_interface, next_step);
        },
        function restart_network_interface(next_step) {
            restart_network_interface(wifi_interface, next_step);
        },
        function enable_netctl_auto(next_step) {
            netctl.enable_auto(wifi_interface, next_step);
        }
    ], callback);
}
