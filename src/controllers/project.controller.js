const Project    = require("../models/project.model");
const cloudinary = require("../config/cloudinary");

// Helper: buffer → Cloudinary
const uploadToCloudinary = (buffer, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (err, result) => err ? reject(err) : resolve(result.secure_url)
    );
    stream.end(buffer);
  });

/**
 * Public: create a new project
 */
exports.uploadProject = async (req, res) => {
  try {
    const {
      domain,
      "project-title": title,
      "project-description": description,
      "project-links": projectLinks,
      "team-members": teamMembers,
    } = req.body;

    let fileUrl      = "";
    let previewUrl   = "";
    let photoUrls    = [];
    let demoVideoUrl = "";

    if (req.files?.file) {
      fileUrl = await uploadToCloudinary(req.files.file[0].buffer, "project_showcase");
    }
    if (req.files?.previewImage) {
      previewUrl = await uploadToCloudinary(req.files.previewImage[0].buffer, "project_previews");
    }
    if (req.files?.projectImages) {
      photoUrls = await Promise.all(
        req.files.projectImages.map(f => uploadToCloudinary(f.buffer, "project_showcase"))
      );
    }
    if (req.files?.["demo-video"]) {
      demoVideoUrl = await uploadToCloudinary(req.files["demo-video"][0].buffer, "project_videos");
    }

    const linksArray       = projectLinks ? projectLinks.split(",").map(l => l.trim()).filter(l => l) : [];
    const teamMembersArray = teamMembers ? teamMembers.split(",").map(m => m.trim()).filter(m => m) : [];

    const project = new Project({
      userId:       req.user.id,
      title,
      description,
      domain,
      fileUrl,
      previewUrl,
      photoUrls,
      demoVideoUrl,
      projectLinks: linksArray,
      teamMembers:  teamMembersArray,
    });
    await project.save();

    res.status(201).json({ success: true, message: "Project created successfully", data: project });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Public: list all projects
 */
exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find()
      .sort({ createdAt: -1 })
      .populate("userId", "name email username");
    res.json({ success: true, data: projects });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Protected: list the logged‑in user’s projects
 */
exports.getMyProjects = async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.user.id })
      .populate("userId", "name email username");
    res.json({ success: true, data: projects });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Public: get any project (for view‑only page)
 */
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("userId", "name email username");
    if (!project) {
      return res.status(404).json({ success: false, error: "Project not found" });
    }
    res.json({ success: true, data: project });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * ★ Protected: fetch for editing.
 *    Only the owner may succeed.
 */
exports.getProjectForEdit = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("userId", "_id");
    if (!project) {
      return res.status(404).json({ success: false, error: "Project not found" });
    }
    if (project.userId._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: "Not authorized to edit this project" });
    }
    // safe to send full data now
    res.json({ success: true, data: project });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Protected: apply edits (owner only)
 */
exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, error: "Project not found" });
    }
    if (project.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: "Not authorized" });
    }

    // fields from form
    const {
      domain,
      "project-title": title,
      "project-description": description,
      "project-links": projectLinks,
      "team-members": teamMembers,
    } = req.body;

    // preserve or replace URLs
    let fileUrl      = project.fileUrl;
    let previewUrl   = project.previewUrl;
    let photoUrls    = project.photoUrls;
    let demoVideoUrl = project.demoVideoUrl || "";

    if (req.files?.file) {
      fileUrl = await uploadToCloudinary(req.files.file[0].buffer, "project_showcase");
    }
    if (req.files?.previewImage) {
      previewUrl = await uploadToCloudinary(req.files.previewImage[0].buffer, "project_previews");
    }
    if (req.files?.projectImages) {
      photoUrls = await Promise.all(
        req.files.projectImages.map(f => uploadToCloudinary(f.buffer, "project_showcase"))
      );
    }
    if (req.files?.["demo-video"]) {
      demoVideoUrl = await uploadToCloudinary(req.files["demo-video"][0].buffer, "project_videos");
    }

    const linksArray       = projectLinks ? projectLinks.split(",").map(l => l.trim()).filter(l => l) : [];
    const teamMembersArray = teamMembers ? teamMembers.split(",").map(m => m.trim()).filter(m => m) : [];

    // apply updates
    project.title         = title;
    project.description   = description;
    project.domain        = domain;
    project.fileUrl       = fileUrl;
    project.previewUrl    = previewUrl;
    project.photoUrls     = photoUrls;
    project.demoVideoUrl  = demoVideoUrl;
    project.projectLinks  = linksArray;
    project.teamMembers   = teamMembersArray;

    await project.save();
    res.json({ success: true, message: "Project updated successfully", data: project });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};


// Like a project
exports.likeProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success:false, error:"Project not found" });

    if (project.likedBy.includes(req.user.id)) {
      return res.status(400).json({ success:false, error:"You have already liked this project." });
    }

    project.likedBy.push(req.user.id);
    project.likes += 1;
    await project.save();
    res.json({ success:true, data: project });
  } catch (err) {
    res.status(500).json({ success:false, error: err.message });
  }
};

// Projects by a specific user
exports.getProjectsByUser = async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.params.userId })
      .populate("userId", "name email username");
    res.json({ success:true, data: projects });
  } catch (err) {
    res.status(500).json({ success:false, error: err.message });
  }
};

// Delete a project
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success:false, error:"Project not found" });
    if (project.userId.toString() !== req.user.id)
      return res.status(403).json({ success:false, error:"Not authorized" });

    await project.deleteOne();
    res.json({ success:true, message:"Project deleted successfully" });
  } catch (err) {
    res.status(500).json({ success:false, error: err.message });
  }
};