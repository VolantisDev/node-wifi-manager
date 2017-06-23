var exec = require('child_process').exec;

module.exports = {
  status: _status,
  get_interface: _get_interface
};

function _get_interface(callback) {
    exec("iwconfig", function (error, stdout, stderr) {
        if (error) return callback(error);

        re = stdout.match(/^([^\s]+)/);

        wifi_interface = null;

        if (re && re.length > 1) {
            wifi_interface = re[1];
        }

        callback(null, wifi_interface);
    });
}

function _status(wifi_interface, callback) {
    var fields = {
        "ap_addr":         /Access Point:\s([^\s]+)/,
        "ap_ssid":         /ESSID:\"([^\"]+)\"/,
        "unassociated":    /(unassociated)\s+Nick/,
    };

    var output = {
        ap_addr:      "<unknown_ap>",
        ap_ssid:      "<unknown_ssid>",
        unassociated: "<unknown>",
    };

    exec("iwconfig " + wifi_interface, function(error, stdout, stderr) {
        if (error) return callback(error);

        for (var key in fields) {
            re = stdout.match(fields[key]);

            if (re && re.length > 1) {
                output[key] = re[1];
            }
        }

        callback(null, output);
    });
}
