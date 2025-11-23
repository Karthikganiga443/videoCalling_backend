const { getOrCreateRoom, rooms, config } = require("./sfuRoom");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("socket connected", socket.id);

    // Peer joins SFU room
    socket.on("joinRoom", async ({ meetingId, name }, cb) => {
      try {
        const room = await getOrCreateRoom(meetingId);

        room.peers.set(socket.id, {
          name,
          transports: new Map(),
          producers: new Map(),
          consumers: new Map()
        });

        socket.join(meetingId);

        cb({ rtpCapabilities: room.router.rtpCapabilities });

        socket.to(meetingId).emit("peerJoined", { socketId: socket.id, name });
      } catch (e) {
        cb({ error: e.message });
      }
    });

    // Create WebRTC transport
    socket.on("createTransport", async ({ meetingId }, cb) => {
      try {
        const room = rooms.get(meetingId);
        const transport = await room.router.createWebRtcTransport(config.webRtcTransport);

        room.peers.get(socket.id).transports.set(transport.id, transport);

        transport.on("dtlsstatechange", (dtlsState) => {
          if (dtlsState === "closed") transport.close();
        });

        cb({
          id: transport.id,
          iceParameters: transport.iceParameters,
          iceCandidates: transport.iceCandidates,
          dtlsParameters: transport.dtlsParameters
        });
      } catch (e) {
        cb({ error: e.message });
      }
    });

    // Connect transport
    socket.on("connectTransport", async ({ meetingId, transportId, dtlsParameters }, cb) => {
      const room = rooms.get(meetingId);
      const transport = room.peers.get(socket.id).transports.get(transportId);
      await transport.connect({ dtlsParameters });
      cb("connected");
    });

    // Produce media
    socket.on("produce", async ({ meetingId, transportId, kind, rtpParameters }, cb) => {
      const room = rooms.get(meetingId);
      const transport = room.peers.get(socket.id).transports.get(transportId);

      const producer = await transport.produce({ kind, rtpParameters });
      room.peers.get(socket.id).producers.set(producer.id, producer);

      producer.on("transportclose", () => producer.close());

      socket.to(meetingId).emit("newProducer", {
        producerId: producer.id,
        socketId: socket.id,
        kind
      });

      cb({ producerId: producer.id });
    });

    // Consume media
    socket.on("consume", async ({ meetingId, producerId, rtpCapabilities }, cb) => {
      try {
        const room = rooms.get(meetingId);
        const router = room.router;

        if (!router.canConsume({ producerId, rtpCapabilities })) {
          return cb({ error: "cannot consume" });
        }

        // use first transport as consumer transport
        const peerTransports = room.peers.get(socket.id).transports;
        const transport = [...peerTransports.values()][0];

        const consumer = await transport.consume({
          producerId,
          rtpCapabilities,
          paused: true
        });

        room.peers.get(socket.id).consumers.set(consumer.id, consumer);

        consumer.on("transportclose", () => consumer.close());
        consumer.on("producerclose", () => {
          socket.emit("producerClosed", { producerId });
          consumer.close();
          room.peers.get(socket.id).consumers.delete(consumer.id);
        });

        cb({
          consumerId: consumer.id,
          producerId,
          kind: consumer.kind,
          rtpParameters: consumer.rtpParameters
        });
      } catch (e) {
        cb({ error: e.message });
      }
    });

    socket.on("resumeConsumer", async ({ meetingId, consumerId }, cb) => {
      const room = rooms.get(meetingId);
      const consumer = room.peers.get(socket.id).consumers.get(consumerId);
      await consumer.resume();
      cb("resumed");
    });

    socket.on("disconnect", () => {
      for (const [meetingId, room] of rooms.entries()) {
        if (room.peers.has(socket.id)) {
          const peer = room.peers.get(socket.id);

          peer.transports.forEach(t => t.close());
          peer.producers.forEach(p => p.close());
          peer.consumers.forEach(c => c.close());

          room.peers.delete(socket.id);

          socket.to(meetingId).emit("peerLeft", { socketId: socket.id });

          if (room.peers.size === 0) rooms.delete(meetingId);
          break;
        }
      }
      console.log("socket disconnected", socket.id);
    });
  });
};
