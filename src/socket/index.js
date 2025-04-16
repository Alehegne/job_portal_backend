const { Server } = require("socket.io");
const initSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("a client connected, client id:", socket.id);

    socket.emit("welcome", "welcome to the socket server");
    socket.on("message", (data) => {
      console.log("message from client", data);
      socket.broadcast.emit("new-message", data);
    });

    socket.on("disconnect", () => {
      console.log("client disconnected", socket.id);
    });
  });
};

module.exports = initSocket;
