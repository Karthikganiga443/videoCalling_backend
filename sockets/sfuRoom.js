const mediasoup = require("mediasoup");
const config = require("../config/mediasoup");

let worker;
const rooms = new Map(); 
// meetingId -> { router, peers: Map(socketId -> peerData) }

async function initWorker() {
  worker = await mediasoup.createWorker(config.worker);
  console.log("mediasoup worker created");

  worker.on("died", () => {
    console.error("mediasoup worker died, exiting...");
    process.exit(1);
  });
}
initWorker();

async function getOrCreateRoom(meetingId) {
  if (rooms.has(meetingId)) return rooms.get(meetingId);

  const router = await worker.createRouter({ mediaCodecs: config.router.mediaCodecs });
  const room = { router, peers: new Map() };
  rooms.set(meetingId, room);
  return room;
}

module.exports = { getOrCreateRoom, rooms, config };
