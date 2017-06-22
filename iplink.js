var exec = require("child_process").exec;

module.exports = {
    down: down,
    up: up,
    restart: restart
}

function down(wifi_interface, callback) {
    _exec(wifi_interface, 'down', callback);
}

function up(wifi_interface, callback) {
    _exec(wifi_interface, 'up', callback);
}

function restart(wifi_interface, callback) {
    async.series([
        function down(next_step) {
            down(wifi_interface, next_step);
        },
        function up(next_step) {
            up(wifi_interface, next_step);
        },
    ], callback);
}

function _exec(wifi_interface, command, callback) {
    exec("sudo ip link set " + wifi_interface + " " + command, function(error, stdout, stderr) {
        if (!error) console.log("'sudo ip link set  " + wifi_interface + " " + command + "' executed successfully");
        callback(error);
    });
}
