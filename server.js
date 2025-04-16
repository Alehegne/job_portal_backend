const app = require("./src/express/index");
require("dotenv").config();
const MongoConnect = require("./src/express/services/connectToDb");
const { createServer } = require("http");
const { Server } = require("socket.io");
const config = require("./src/express/config/allConfig");
const initSocket = require("./src/socket");

const PORT = process.env.PORT || 5000;
//http server, passing the express app to it, so it can handle requests
const server = createServer(app);
//initialize socket.io with
const io = new Server(server, config.getSocketConfig());

MongoConnect.connectToDb();
//initialize socket.io with the server instance
initSocket(io);
//on the server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
