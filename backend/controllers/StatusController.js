import Status from "../models/Status.js";


export const uploadStatus = async (req, res) => {
  try {
    const { mediaUrl, type } = req.body;

    if (!mediaUrl || !type) {
      return res.status(400).json({
        message: "mediaUrl and type are required",
      });
    }

    const status = await Status.create({
      user: req.user.id,
      mediaUrl,
      type,
    });

    res.status(201).json(status);
  } catch (error) {
    console.log("Error in uploadStatus:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getMyStatus = async (req, res) => {
  try {
    const statuses = await Status.find({
      user: req.user.id,
    }).sort({ createdAt: -1 });

    res.json(statuses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllStatuses = async (req, res) => {
  try {
    const statuses = await Status.find({
      user: { $ne: req.user.id },
    })
      .populate("user", "username profilePic")
      .sort({ createdAt: -1 });

    res.json(statuses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const viewStatus = async (req, res) => {
  try {
    const { statusId } = req.params;

    const status = await Status.findById(statusId);

    if (!status) {
      return res.status(404).json({ message: "Status not found" });
    }

    if (!status.viewers.includes(req.user.id)) {
      status.viewers.push(req.user.id);
      await status.save();
    }

    res.json({ message: "Viewed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteStatus = async (req, res) => {
  try {
    const { statusId } = req.params;

    const status = await Status.findOne({
      _id: statusId,
      user: req.user.id,
    });

    if (!status) {
      return res.status(404).json({ message: "Not found" });
    }

    await status.deleteOne();

    res.json({ message: "Status deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};