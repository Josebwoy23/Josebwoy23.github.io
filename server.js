const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let hostSocket = null;
let listeners = 0;

app.get('/', (req,res)=>res.send(`JB TRUE RADIO - LIVE: ${hostSocket!==null} - Listeners: ${listeners}`));

io.on('connection', (socket)=>{
  socket.on('host-join',(pin)=>{
    if(pin==='7788'){
      hostSocket=socket;
      io.emit('radio-status',{live:true,listeners});
      console.log('JB HOST LIVE');
    } else socket.emit('error','Wrong PIN');
  });
  socket.on('listener-join',()=>{
    listeners++; io.emit('radio-status',{live:hostSocket!==null,listeners});
    if(hostSocket) socket.emit('radio-status',{live:true,listeners});
  });
  socket.on('audio-chunk',(chunk)=>{
    if(socket===hostSocket) socket.broadcast.emit('audio-chunk',chunk);
  });
  socket.on('disconnect',()=>{
    if(socket===hostSocket){hostSocket=null; io.emit('radio-status',{live:false,listeners});}
    else {listeners=Math.max(0,listeners-1); io.emit('radio-status',{live:hostSocket!==null,listeners});}
  });
});
const PORT=process.env.PORT||3000;
server.listen(PORT,()=>console.log('RUNNING ON '+PORT));

