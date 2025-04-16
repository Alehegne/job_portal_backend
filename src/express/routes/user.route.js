const express = require("express");
const UserController = require("../controllers/user.controller");
const Router = express.Router;
const multer = require("multer");
const middleware = require("../middleware/allMiddleware");
const userController = require("../controllers/user.controller");

const userRouter = new Router();
const upload = multer();
userRouter.get(
  "/all",
  middleware.verifyToken,
  // middleware.verifyRole(["admin"]),
  middleware.queryFilter([]),
  UserController.getUser
);
//get user by email
userRouter.get("/user", middleware.verifyToken, userController.getByEmail);
userRouter.delete(
  "/delete/:id",
  middleware.verifyToken,
  middleware.verifyRole(["admin"]),
  middleware.validateObjectId,
  upload.none(),
  UserController.deleteUser
);
//get user by id
userRouter.get("/:id", middleware.validateObjectId, UserController.getUserById);
//update user by id
userRouter.put(
  "/:id/update",
  middleware.verifyToken,
  middleware.validateObjectId,
  upload.none(),
  UserController.updateProfile
);

userRouter.delete(
  "/delete",
  middleware.verifyToken,
  UserController.deleteProfile
);

module.exports = { userRouter };
