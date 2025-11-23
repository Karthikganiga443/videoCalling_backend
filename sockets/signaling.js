const rooms = {}; 
// rooms[meetingId] = { socketId: name, socketId2: name2, ... }

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join-meeting", ({ meetingId, name }) => {
      if (!rooms[meetingId]) rooms[meetingId] = {};
      rooms[meetingId][socket.id] = name;

      socket.join(meetingId);

      // send all existing peers to the new peer
      const existingUsers = Object.entries(rooms[meetingId])
        .filter(([id]) => id !== socket.id)
        .map(([id, n]) => ({ socketId: id, name: n }));

      socket.emit("existing-users", existingUsers);

      // notify others new user joined
      socket.to(meetingId).emit("user-joined", {
        socketId: socket.id,
        name
      });
    });

    // route offer/answer/ice to specific peer
    socket.on("offer", ({ target, offer }) => {
      io.to(target).emit("offer", { offer, from: socket.id });
    });

    socket.on("answer", ({ target, answer }) => {
      io.to(target).emit("answer", { answer, from: socket.id });
    });

    socket.on("ice-candidate", ({ target, candidate }) => {
      io.to(target).emit("ice-candidate", { candidate, from: socket.id });
    });

    socket.on("disconnect", () => {
      for (const meetingId in rooms) {
        if (rooms[meetingId][socket.id]) {
          delete rooms[meetingId][socket.id];

          socket.to(meetingId).emit("user-left", {
            socketId: socket.id
          });

          if (Object.keys(rooms[meetingId]).length === 0) {
            delete rooms[meetingId];
          }
          break;
        }
      }
      console.log("User disconnected:", socket.id);
    });
  });
};
