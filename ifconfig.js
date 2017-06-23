var exec = require('child_process').exec;

module.exports = {
  status: _status,
};

function _status(wifi_interface, callback) {
    var fields = {
        hw_addr: /HWaddr\s([^\s]+)/,
        inet_addr: /inet addr:([^\s]+)/
    };

    var output = {
        hw_addr: '<unknown>',
        inet_addr: '<unknown>'
    };

    exec("ifconfig " + wifi_interface, function(error, stdout, stderr) {
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
