const os = require("os");

module.exports = {
  worker: {
    rtcMinPort: 40000,
    rtcMaxPort: 49999,
    logLevel: "warn",
    logTags: ["ice", "dtls", "rtp", "srtp", "rtcp"]
  },

  router: {
    mediaCodecs: [
      {
        kind: "audio",
        mimeType: "audio/opus",
        clockRate: 48000,
        channels: 2
      },
      {
        kind: "video",
        mimeType: "video/VP8",
        clockRate: 90000,
        parameters: { "x-google-start-bitrate": 1000 }
      }
    ]
  },

  webRtcTransport: {
    listenInfos: [
      {
        protocol: "udp",
        ip: "0.0.0.0",
        announcedAddress: null  // set public IP in production
      },
      {
        protocol: "tcp",
        ip: "0.0.0.0",
        announcedAddress: null
      }
    ],
    initialAvailableOutgoingBitrate: 1_000_000
  }
};
