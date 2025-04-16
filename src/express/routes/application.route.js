const express = require("express");
const applicationController = require("../controllers/application.controller");
const multer = require("multer");
const middleware = require("../middleware/allMiddleware");

const applicationRouter = express.Router();
const upload = multer();
// console.log("applicationRouter initialized:-");

//post application by jobSeeker, or admin
applicationRouter.post(
  "/apply",
  upload.none(),
  middleware.verifyToken,
  middleware.verifyRole(["jobSeeker", "admin"]),
  applicationController.apply
);
//employer fetches job

applicationRouter.get(
  "/fetch",
  middleware.verifyToken,
  middleware.verifyRole(["employer", "jobSeeker", "admin"]),
  middleware.queryFilter(["status", "appliedAt"]),
  applicationController.fetchApplications
);
//accept or reject application by employer
applicationRouter.put(
  "/update/:id/status",
  middleware.verifyToken,
  middleware.verifyRole(["employer"]),
  middleware.validateObjectId,
  upload.none(),
  applicationController.updateApplicationStatus
);

module.exports = applicationRouter;
