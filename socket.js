const Message = require("./api/models/Message"); // ✅ Adjust path if needed

const initializeSocket = (server) => {
  const io = require("socket.io")(server, {
    cors: {
      origin: "https://buzzsway.netlify.app",
      credentials: true,
    },
  });

  let onlineUsers = {}; // { username: socket.id }

  io.on("connection", (socket) => {
    console.log("New socket connected");

    socket.on("add-user", (username) => {
      onlineUsers[username] = socket.id;
      io.emit("online-users", Object.keys(onlineUsers));
    });

    socket.on("send-private-msg", async ({ sender, receiver, content }) => {
      const message = new Message({ sender, receiver, content });
      await message.save(); // ✅ Save to DB

      const fullMsg = {
        _id: message._id,
        sender,
        receiver,
        content,
        time: message.time,
      };

      // Send to receiver if online
      const receiverSocketId = onlineUsers[receiver];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receive-private-msg", fullMsg);
      }

      // Echo back to sender too
      const senderSocketId = socket.id;
      io.to(senderSocketId).emit("receive-private-msg", fullMsg);
    });

    socket.on("disconnect", () => {
      for (let [username, id] of Object.entries(onlineUsers)) {
        if (id === socket.id) {
          delete onlineUsers[username];
          break;
        }
      }
      io.emit("online-users", Object.keys(onlineUsers));
    });
  });
};

module.exports = initializeSocket;
