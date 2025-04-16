const express = require("express");
const passport = require("passport");
// const UserController = require("../controllers/user.controller");

const Router = express.Router;
const multer = require("multer");
const middleware = require("../middleware/allMiddleware");
const authController = require("../controllers/auth.controller");
require("../config/allConfig").getPassportConfig();

const authRouter = new Router();
const upload = multer();

function check(req, res, next) {
  console.log("google  hitted");
  next();
}

authRouter.post("/register", upload.none(), authController.register);
authRouter.post("/logIn", upload.none(), authController.logIn);
authRouter.post("/logOut", middleware.verifyToken, authController.logOut);
//logIn with google
authRouter.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
authRouter.get(
  "/google/callback",
  check,
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/logIn",
  }),
  authController.googleCallback
);

//password reset route
authRouter.post(
  "/forgotPassword",
  upload.none(),
  authController.forgotPassword
);
authRouter.post(
  "/resetPassword/:token",
  upload.none(),
  authController.resetPassword
);

module.exports = { authRouter };
