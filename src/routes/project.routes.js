const express   = require("express");
const multer    = require("multer");
const { protect } = require("../middlewares/auth.middleware");
const {
  uploadProject,
  getProjects,
  getMyProjects,
  getProjectById,
  getProjectForEdit,  // new
  updateProject,
  likeProject,
  getProjectsByUser,
  deleteProject,
} = require("../controllers/project.controller");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Public listing
router.get("/", getProjects);

// Protected: list your own
router.get("/my-projects", protect, getMyProjects);

// Public: view project page
router.get("/:id", getProjectById);

// ★ Protected: fetch for edit form
router.get("/:id/edit", protect, getProjectForEdit);

// Create
router.post(
  "/",
  protect,
  upload.fields([
    { name: "previewImage", maxCount: 1 },
    { name: "projectImages", maxCount: 10 },
    { name: "demo-video", maxCount: 1 },
    { name: "file", maxCount: 1 }
  ]),
  uploadProject
);

// Update (owner only)
router.put(
  "/:id",
  protect,
  upload.fields([
    { name: "previewImage", maxCount: 1 },
    { name: "projectImages", maxCount: 10 },
    { name: "demo-video", maxCount: 1 },
    { name: "file", maxCount: 1 }
  ]),
  updateProject
);

// Other actions
router.post("/:id/like", protect, likeProject);
router.delete("/:id",    protect, deleteProject);
router.get("/user/:userId", getProjectsByUser);

module.exports = router;