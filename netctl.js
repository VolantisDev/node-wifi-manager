var _ = require("underscore")._
var async = require("async")
var fs = require("fs")
var systemctl = require("systemctl")
var exec = require("child_process").exec

// Better template format
_.templateSettings = {
    interpolate: /\{\{(.+?)\}\}/g,
    evaluate :   /\{\[([\s\S]+?)\]\}/g
}

// Helper function to write a given template to a file based on a given context
function write_template_to_file(template_path, file_name, context, callback) {
    async.waterfall([
        function read_template_file(next_step) {
            fs.readFile(template_path, {encoding: "utf8"}, next_step)
        },
        function update_file(file_txt, next_step) {
            var template = _.template(file_txt)
            fs.writeFile(file_name, template(context), next_step)
        }
    ], callback)
}

module.exports = {
    enable_auto: _enable_auto,
    disable_auto: _disable_auto,
    start_auto: _start_auto,
    stop_auto: _stop_auto,
    restart_auto: _restart_auto,
    is_auto_enabled: _is_auto_enabled,
    save_wifi_profile: _save_wifi_profile,
    delete_wifi_profile: _delete_wifi_profile,
    is_wifi_profile_saved: _is_wifi_profile_saved
}

function _enable_auto(interface_name, callback) {
    systemctl.enable("netctl-auto@" + interface_name, callback)
}

function _disable_auto(interface_name, callback) {
    systemctl.disable("netctl-auto@" + interface_name, callback)
}

function _stop_auto(interface_name, callback) {
    systemctl.stop("netctl-auto@" + interface_name, callback)
}

function _start_auto(interface_name, callback) {
    systemctl.start("netctl-auto@" + interface_name, callback)
}

function _is_auto_enabled(interface_name, callback) {
    systemctl.is_enabled('netctl-auto@' + interface_name, callback)
}

function _restart_auto(interface_name, callback) {
    systemctl.restart("netctl-auto@" + interface_name, callback)
}

function _save_wifi_profile(wifi_interface, connection_info, callback) {
    async.waterfall([
        function read_template_file(next_step) {
            fs.readFile("./templates/netctl/wifi.template", {encoding: "utf8"}, next_step)
        },
        function update_file(file_txt, next_step) {
            var template = _.template(file_txt)
            fs.writeFile("/etc/netctl/" + wifi_interface + '-' + connection_info.wifi_ssid, template(connection_info), next_step)
        }
    ], callback)
}

function _delete_wifi_profile(wifi_interface, wifi_ssid, callback) {
    fs.unlink('/etc/netctl/' + wifi_interface + '-' + wifi_ssid, callback)
}

function _is_wifi_profile_saved(wifi_interface, wifi_ssid, callback) {
    var exists = fs.existsSync('/etc/netctl/' + wifi_interface + '-' + wifi_ssid)

    callback(null, exists)
}
