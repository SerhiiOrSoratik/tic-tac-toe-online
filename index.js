const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);

server.listen(3000);

app.get("/", function (request, respons) {
  respons.sendFile(__dirname + "/index.html");
});

let players = [];
let userOnline = 0;
let field = [
        [" ", " ", " "],
        [" ", " ", " "],
        [" ", " ", " "],
      ];

  io.sockets.on("connection", (socket) => {
    let lastMove = 0;
    userOnline++;
    console.log("connect");

    if (userOnline === 1) {
        players.push({ id: socket.id, symbol: 'x', move: 1 });
    }
    else if (userOnline === 2) {
        players.push({ id: socket.id, symbol: 'o', move: 2 });
        field = [
            [" ", " ", " "],
            [" ", " ", " "],
            [" ", " ", " "],
          ];
        io.sockets.emit("start game", field);
    }
    else if (userOnline > 2) {
        socket.disconnect(true);
        userOnline--;
    }
    console.log("online user: " + userOnline);


    socket.on("disconnect", (data) => {
      console.log("disconnect");
      userOnline--;
      lastMove = 0;
      players.splice(players.indexOf((player) => player.id === socket.id), 1);
      field = [
        [" ", " ", " "],
        [" ", " ", " "],
        [" ", " ", " "],
      ];
    });

    socket.on('new game', () => {
        field = [
            [" ", " ", " "],
            [" ", " ", " "],
            [" ", " ", " "],
          ];
        io.sockets.emit('start game', field);
    })

    socket.on("move", (data) => {
        move(data, socket, lastMove);
    });
  });

const move = (data, socket, lastMove) => {
    if (lastMove !== players.find((pl) => pl.id === socket.id).move) {
        const position = data.position.split(' ');

        if (position[0] >= 0 && position[0] <= 2 && position[1] >= 0 && position[1] <= 2) {
           const x = position[1];
          const y = position[0];
            if (field[x][y] === ' ') {
                    
                    field[x][y] = players.find((pl) => pl.id === socket.id).symbol.toString();
                    io.sockets.emit("move complete", {field: field, nextMove: lastMove === 1 ? 'o' : 'x'});     
                    checkConditionGame(field, players.find((pl) => pl.id === socket.id).symbol.toString());
                    lastMove = players.find((pl) => pl.id === socket.id).move;
                 
            }
            else {
                 console.log('wrong move')
            }
        }
    }
}

const checkConditionGame = (field, symbol) => {
  if (field[0].includes(" ") === false && field[1].includes(" ") === false && field[2].includes(" ") === false) {
        console.log("DRAW!", "Draw!");
        io.sockets.emit("end");
  } else if (
        (field[0][0] === symbol && field[1][0] === symbol && field[2][0] === symbol) ||
        (field[0][1] === symbol && field[1][1] === symbol && field[2][1] === symbol) ||
        (field[0][2] === symbol && field[1][2] === symbol && field[2][2] === symbol) ||
        (field[0][0] === symbol && field[0][1] === symbol && field[0][2] === symbol) ||
        (field[1][0] === symbol && field[1][1] === symbol && field[1][2] === symbol) ||
        (field[2][0] === symbol && field[2][1] === symbol && field[2][2] === symbol) ||
        (field[0][0] === symbol && field[1][1] === symbol && field[2][2] === symbol) ||
        (field[0][2] === symbol && field[1][1] === symbol && field[2][0] === symbol)) {
        console.log("Win!");
        io.sockets.emit("end", "Winner: " + symbol);
    }
};
