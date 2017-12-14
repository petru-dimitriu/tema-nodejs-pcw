var express = require('express');
var app = express();


var gameStatus = "WAITING";
var loggedOnPlayers = 0;
var winners = 0;

var server = app.listen(8082, function ()
{
    console.log('Serverul ruleaza la portul 8082');
});

var io = require('socket.io')(server);
var clientList = []; 

io.on('connection', function (client)
{
    console.log('S-a conectat un client!!!');

    if (gameStatus != "WAITING")
    {
        client.emit('busy');
        return;
    }
    client.emit('welcome','');
    clientList.push(client);
    broadcastStatus();

    // elimina clientul din lista cand se conecteaza
    client.on('disconnect', function ()
    {
       
        indexClient = clientList.indexOf(client);
        // clientul avea setat numele player-ului deci era logat => scadem numarul de player-i logati
        if (client.playerName !== null)
        {
            loggedOnPlayers--;
            if (loggedOnPlayers < 0)
                loggedOnPlayers = 0;
        }
        clientList.splice(indexClient,1);
    });

    client.on('enter', function (name)
    {
        
        client.playerName = name;
        loggedOnPlayers++;
        client.emit('entered');
        if (loggedOnPlayers != 0 && loggedOnPlayers == clientList.length)
        {
            broadcastReady();
            setTimeout(broadcastStartGame,1000);
        }
    });

    client.on('updateStatus', function(percent) {
        client.percent = percent;
       
    });

    client.on('winner', function() {
        broadcastWinner(client.playerName);
        winners++;
        if (winners == clientList.length) {
            broadcastEnd();
            disconnectFromAllClients();
            gameStatus = "WAITING";
        }
    });

    setInterval(broadcastStatus, 1000);
});

// trimite catre toti clientii starea curenta a jocului

function broadcastStatus()
{
    var playerNameList = [];

    for (var i = 0; i < clientList.length ; i++)
    {
        if (clientList[i].playerName !== undefined) {
            player = {};
            player.name = clientList[i].playerName;
            player.percent = clientList[i].percent;
            playerNameList.push(player);
        }
    }
    
    var status = 
    { "status" : gameStatus,
      "connectedPlayers" : clientList.length,
      "loggedOnPlayers" : loggedOnPlayers,
      "playerNameList" : playerNameList
    };

    for (var i = 0 ; i < clientList.length; i ++) {
        clientList[i].emit('status',status);
    }
}

function broadcastReady()
{
    for (var i = 0; i < clientList.length ; i++)
    {
        clientList[i].emit('ready');
    }
}

function broadcastEnd()
{
    for (var i = 0; i < clientList.length ; i++)
    {
        clientList[i].emit('end');
    }
}

function broadcastStartGame()
{
    var texts = [`
Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
`,
`At vero eos et accusamus et iusto odio dignissimos ducimus, qui blanditiis praesentium voluptatum deleniti atque corrupti, quos dolores et quas molestias excepturi sint, obcaecati cupiditate non provident, similique sunt in culpa, qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio.`,
`Nam libero tempore, cum soluta nobis est eligendi optio, cumque nihil impedit, quo minus id, quod maxime placeat, facere possimus, omnis voluptas assumenda est, omnis dolor repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet, ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat.`
];
    
    text = texts[Math.floor(Math.random()*texts.length)];
    gameStatus = "PLAYING";
    for (var i = 0; i < clientList.length ; i++)
    {
        clientList[i].emit('startGame',text);
    }
}

function broadcastWinner(winnerName)
{
    for (var i = 0; i < clientList.length ; i++)
    {
        clientList[i].emit('getWinner',winnerName);
    }
}

function disconnectFromAllClients()
{
    for (var i = 0; i < clientList.length; i ++)
    {
        clientList[i].playerName = undefined;
        clientList[i].percent = undefined;
    }
}
