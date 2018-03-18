var fs = require('fs');
var zlib = require('zlib');

var buffer = fs.readFileSync('./wnjpn.db.gz');
zlib.gunzip(buffer, function(err, result){
    fs.writeFileSync('./wnjpn.db.sqlite3', result);
});