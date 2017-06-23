var _ = require("underscore")._,
    async = require("async"),
    fs = require("fs"),
    systemctl = require("systemctl"),
    exec = require("child_process").exec;

// Better template format
_.templateSettings = {
    interpolate: /\{\{(.+?)\}\}/g,
    evaluate :   /\{\[([\s\S]+?)\]\}/g
};

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

module.exports = {
    enable_auto: _enable_auto,
    disable_auto: _disable_auto,
    start_auto: _start_auto,
    stop_auto: _stop_auto,
    restart_auto: _restart_auto,
    save_wifi_profile: _save_wifi_profile
}

function _enable_auto(interface_name, callback) {
    systemctl.enable("netctl-auto@" + interface_name, callback);
}

function _disable_auto(interface_name, callback) {
    systemctl.disable("netctl-auto@" + interface_name, callback);
}

function _stop_auto(interface_name, callback) {
    systemctl.stop("netctl-auto@" + interface_name, callback);
}

function _start_auto(interface_name, callback) {
    systemctl.start("netctl-auto@" + interface_name, callback);
}

function _restart_auto(interface_name, callback) {
    systemctl.restart("netctl-auto@" + interface_name, callback);
}

function _save_wifi_profile(wifi_interface, connection_info, callback) {
    async.waterfall([
        function read_template_file(next_step) {
            fs.readFile("./templates/netctl/wifi.template", {encoding: "utf8"}, next_step);
        },
        function update_file(file_txt, next_step) {
            var template = _.template(file_txt);
            fs.writeFile("/etc/netctl/" + wifi_interface, template(connection_info), next_step);
        }
    ], callback);
}
