var async = require("async")
var iplink = require("./iplink")
var iwconfig = require("./iwconfig")
var ifconfig = require("./ifconfig")
var iwlist = require("./iwlist")
var netctl = require('./netctl')

/*****************************************************************************\
    Return a set of functions which we can use to manage and check our wifi
    connection information
\*****************************************************************************/
module.exports = {
    get_wifi_interface: _get_wifi_interface,
    get_wifi_info: _get_wifi_info,
    restart_interface: _restart_interface,
    scan_networks: _scan_networks,
    is_wifi_enabled: _is_wifi_enabled,
    is_wifi_connected: _is_wifi_connected,
    save_profile: _save_profile,
    delete_profile: _delete_profile,
    enable_wifi: _enable_wifi,
    disable_wifi: _disable_wifi
}

function _get_wifi_interface(callback) {
    iwconfig.get_interface(callback)
}

// Get generic info on an interface
function _get_wifi_info(wifi_interface, callback) {
    var output = []

    async.series([
        function run_ifconfig(next_step) {
            ifconfig.status(wifi_interface, function (error, info) {
                if (!error) output.concat(info);
                next_step(error);
            })
        },
        function run_iwconfig(next_step) {
            iwconfig.status(wifi_interface, function (error, info) {
                if (!error) output.concat(info);
                next_step(error);
            })
        },
    ], function(error) {
        return callback(error, output)
    })
}

function _restart_interface(wifi_interface, callback) {
    iplink.restart(wifi_interface, callback)
}

function _scan_networks(wifi_interface, callback) {
    iwlist(wifi_interface, callback)
}

function _is_wifi_enabled(wifi_interface, callback) {
    netctl.is_auto_enabled(wifi_interface, callback)
}

function _is_wifi_connected(wifi_interface, callback) {
    get_wifi_info(wifi_interface, function(error, info) {
        if (error) return callback(error, null)

        var return_info = null;
        if ("<unknown>" != info["inet_addr"] &&
            "<unknown>" == info["unassociated"]) {
            return_info = info["inet_addr"]
        }

        return callback(null, return_info)
    })
}

function _save_profile(wifi_interface, connection_info, callback) {
    async.series([
        function save_wifi_profile(next_step) {
            netctl.save_wifi_profile(wifi_interface, connection_info, next_step)
        },
        function restart_netctl_auto(next_step) {
            netctl.restart_auto(wifi_interface, next_step)
        }
    ], callback)
}

function _delete_profile(wifi_interface, ssid, callback) {
    async.series([
        function delete_wifi_profile(next_step) {
            netctl.delete_wifi_profile(wifi_interface, connection_info.wifi_ssid, next_step)
        },
        function restart_netctl_auto(next_step) {
            netctl.restart_auto(wifi_interface, next_step)
        }
    ], callback)
}

function _enable_wifi(wifi_interface, callback) {
    async.series([
        function restart_netctl_auto(next_step) {
            netctl.restart_auto(wifi_interface, next_step)
        },
        function restart_network_interface(next_step) {
            restart_network_interface(wifi_interface, next_step)
        },
        function enable_netctl_auto(next_step) {
            netctl.enable_auto(wifi_interface, next_step)
        }
    ], callback)
}

function _disable_wifi(wifi_interface, callback) {
    async.series([
        function stop_netctl_auto(next_step) {
            netctl.stop_auto(wifi_interface, next_step)
        },
        function disable_netctl_auto(next_step) {
            netctl.disable_auto(wifi_interface, next_step)
        }
    ], callback)
}
