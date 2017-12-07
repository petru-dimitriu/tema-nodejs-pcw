var express = require('express');
var app = express();

var server = app.listen(8082, function ()
{
    console.log('Serverul ruleaza la portul 8082');
});

var io = require('socket.io')(server);

io.on('connection', function (client)
{
    console.log('S-a conectat un client!!!');

    client.emit('test','Bun venit');
});
