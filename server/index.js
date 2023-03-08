const express = require('express');
const cors = require('cors');
const fs = require('fs');
//Gets the messages.json file and parse the file into JavaScript object
const rawData = fs.readFileSync('messages.json');
const messagesData = JSON.parse(rawData);

const app = express();
const PORT = 4000;
app.use(cors());

const server = app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`)
});

const socketIO = require('socket.io')(server, {
  cors: {
    origin: '*',
  }
});

let users = [];

socketIO.on('connection', (socket) => {
  console.log(`⚡: ${socket.id} user just connected!`);
  socket.on("message", data => {
    messagesData["messages"].push(data)
    const stringData = JSON.stringify(messagesData, null, 2)
    fs.writeFile("messages.json", stringData, (err)=> {
      console.error(err)
    })
    socketIO.emit("messageResponse", data)
  })

  socket.on('typing', (data) => socket.broadcast.emit('typingResponse', data));

  //Listens when a new user joins the server
  socket.on('newUser', (data) => {
    //Adds the new user to the list of users
    users.push(data);
    // console.log(users);
    //Sends the list of users to the client
    socketIO.emit('newUserResponse', users);
  });

  socket.on('disconnect', () => {
    console.log('🔥: A user disconnected');
    //Updates the list of users when a user disconnects from the server
    users = users.filter((user) => user.socketID !== socket.id);
    // console.log(users);
    //Sends the list of users to the client
    socketIO.emit('newUserResponse', users);
    socket.disconnect();
  });
});

app.get('/api', (req, res) => {
  res.json(messagesData);
});



