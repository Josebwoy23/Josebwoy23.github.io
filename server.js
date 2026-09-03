const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" }, maxHttpBufferSize: 1e6 });

let hostId = null;
let listeners = 0;
let isLive = false;

app.get('/', (req,res)=> res.send('JB Radio Server Running - Listeners: '+listeners));

io.on('connection', (socket)=>{
  console.log('New:', socket.id);
  io.emit('radio-status', { live: isLive, listeners });

  socket.on('host-join', (pin)=>{
    if(pin==='7788'){
      hostId = socket.id;
      isLive = true;
      console.log('Host joined:', hostId);
      io.emit('radio-status', { live: true, listeners });
    }
  });

  socket.on('listener-join', ()=>{
    listeners++;
    console.log('Listener joined, total:', listeners);
    io.emit('radio-status', { live: isLive, listeners });
  });

  // THIS IS THE FIX - Broadcast audio to ALL listeners
  socket.on('audio-chunk', (chunk)=>{
    if(socket.id===hostId){
      socket.broadcast.emit('audio-chunk', chunk);
    }
  });

  socket.on('chat-message', (data)=>{
    io.emit('chat-message', data);
  });

  socket.on('chat-delete', (id)=>{
    io.emit('chat-delete', id);
  });

  socket.on('disconnect', ()=>{
    if(socket.id===hostId){ isLive=false; hostId=null; console.log('Host left'); }
    else { if(listeners>0) listeners--; }
    io.emit('radio-status', { live: isLive, listeners });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, ()=> console.log('Server on '+PORT));
