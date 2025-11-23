const Meeting = require("../models/Meeting");

// POST /api/meetings/join-or-create
exports.joinOrCreateMeeting = async (req, res) => {
  try {
    const { meetingId, password, name } = req.body;
    if (!meetingId || !password || !name)
      return res.status(400).json({ error: "name, meetingId, password required" });

    let meeting = await Meeting.findOne({ meetingId });

    if (meeting) {
      if (meeting.password !== password)
        return res.status(401).json({ error: "Wrong password" });

      if (!meeting.participants.includes(name)) {
        meeting.participants.push(name);
        await meeting.save();
      }

      return res.json({
        meetingId,
        exists: true,
        role: "participant",
        message: "Joined existing meeting"
      });
    }

    meeting = await Meeting.create({
      meetingId,
      password,
      host: name,
      participants: [name]
    });

    res.status(201).json({
      meetingId,
      exists: false,
      role: "host",
      message: "Meeting created and joined"
    });
  } catch (e) {
    if (e.code === 11000)
      return res.status(409).json({ error: "Meeting ID already taken" });
    res.status(500).json({ error: e.message });
  }
};
