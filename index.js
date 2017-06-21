var _ = require("underscore")._,
    async = require("async"),
    fs = require("fs"),
    systemctl = require("systemctl"),
    exec = require("child_process").exec,
    iwconfig = require("./iwconfig"),
    wifi = require("node-wifi");

// Better template format
_.templateSettings = {
    interpolate: /\{\{(.+?)\}\}/g,
    evaluate :   /\{\[([\s\S]+?)\]\}/g
};

/*****************************************************************************\
    Return a set of functions which we can use to manage and check our wifi
    connection information
\*****************************************************************************/
module.exports = {
    enable_wifi: _enable_wifi,
    get_wifi_info: _get_wifi_info,
    is_wifi_enabled: _is_wifi_enabled,
    is_wifi_enabled_sync: _is_wifi_enabled_sync,
    restart_wireless_network: _restart_wireless_network,
    get_wifi_interface_name: _get_wifi_interface_name,
    scan_networks: _scan_networks
}

// Helper function to write a given template to a file based on a given context
function write_template_to_file(template_path, file_name, context, callback) {
    async.waterfall([
        function read_template_file(next_step) {
            fs.readFile(template_path, {encoding: "utf8"}, next_step);
        },
        function update_file(file_txt, next_step) {
            var template = _.template(file_txt);
            fs.writeFile(file_name, template(context), next_step);
        }
    ], callback);
}

// Inner function which runs a given command and sets a bunch of fields
function run_command_and_set_fields(cmd, fields, callback) {
    exec(cmd, function(error, stdout, stderr) {
        if (error) return callback(error);

        for (var key in fields) {
            re = stdout.match(fields[key]);

            if (re && re.length > 1) {
                output[key] = re[1];
            }
        }

        callback(null);
    });
}

function _get_wifi_interface_name(callback) {
    iwconfig.status(function(error, status) {
        callback(error, status[0]['interface'] || null);
    });
}

// Get generic info on an interface
function _get_wifi_info(callback) {
    var ifconfig_fields = {
        "hw_addr":         /HWaddr\s([^\s]+)/,
        "inet_addr":       /inet addr:([^\s]+)/,
    },
    iwconfig_fields = {
        "ap_addr":         /Access Point:\s([^\s]+)/,
        "ap_ssid":         /ESSID:\"([^\"]+)\"/,
        "unassociated":    /(unassociated)\s+Nick/,
    },
    output = {
        hw_addr:      "<unknown>",
        inet_addr:    "<unknown>",
        ap_addr:      "<unknown_ap>",
        ap_ssid:      "<unknown_ssid>",
        unassociated: "<unknown>",
    };

    _get_wifi_interface_name(function (error, interface_name) {
        async.series([
            function run_ifconfig(next_step) {
                run_command_and_set_fields("ifconfig " + interface_name, ifconfig_fields, next_step);
            },
            function run_iwconfig(next_step) {
                iwconfig.status(interface_name, function (error, status) {
                    run_command_and_set_fields("iwconfig " + interface_name, iwconfig_fields, next_step);
                });
                
            },
        ], function(error) {
            return callback(error, output);
        });
    });
}

function _restart_wireless_network(wlan_iface, callback) {
    async.series([
        function down(next_step) {
            exec("sudo ip link set " + wlan_iface + " down", function(error, stdout, stderr) {
                if (!error) console.log("ifdown " + wlan_iface + " successful...");
                next_step();
            });
        },
        function up(next_step) {
            exec("sudo ip link set " + wlan_iface + " up", function(error, stdout, stderr) {
                if (!error) console.log("ifup " + wlan_iface + " successful...");
                next_step();
            });
        },
    ], callback);
}



function _scan_networks(callback) {
    _get_wifi_interface_name(function (error, interface_name) {
        wifi.init({
            iface: interface_name
        });

        wifi.scan(callback);
    });
}

// Wifi related functions
function _is_wifi_enabled_sync(info) {
    if ("<unknown>" != info["inet_addr"]         &&
        "<unknown>" == info["unassociated"] ) {
        return info["inet_addr"];
    }

    return null;
}

function _is_wifi_enabled(callback) {
    _get_wifi_info(function(error, info) {
        if (error) return callback(error, null);
        return callback(null, _is_wifi_enabled_sync(info));
    });
}

// Disables AP mode and reverts to wifi connection
function _enable_wifi(wifi_interface, connection_info, callback) {
    _is_wifi_enabled(function(error, result_ip) {
        if (error) return callback(error);

        if (result_ip) {
            console.log("\nWifi connection is enabled with IP: " + result_ip);
            return callback(null);
        }

        async.series([
            function remove_networkd_wifi_profile(next_step) {
                fs.unlink("/etc/systemd/network/" + wifi_interface + ".template", next_step);
            },

            function restart_systemd_networkd_service(next_step) {
                systemctl.restart('systemd-networkd', next_step);
            },

            function update_interfaces(next_step) {
                write_template_to_file(
                    "./assets/etc/netctl/wifi.template",
                    "/etc/netctl/" + wifi_interface,
                    connection_info, next_step);
            },

            function stop_dhcp_service(next_step) {
                systemctl.stop('dhcpd4@' + wifi_interface, next_step);
            },

            function stop_hostapd_service(next_step) {
                systemctl.stop('hostapd', next_step);
            },

            function enable_netctl_auto(next_step) {
                systemctl.restart('netctl-auto@' + wifi_interface, next_step);
            },

            function restart_network_interfaces(next_step) {
                _restart_wireless_network(wifi_interface, next_step);
            }

        ], callback);
    });
}
