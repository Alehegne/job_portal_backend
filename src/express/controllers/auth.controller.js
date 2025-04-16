const BaseController = require("./Base.Controller");
const authServices = require("../services/main/auth.service");
const UserServices = require("../services/main/user.services");
const Config = require("../config/allConfig");
const utils = require("../utils/utils");

class AuthController extends BaseController {
  constructor() {
    super(); // Call the constructor of the parent class
    // Initialize any properties or methods specific to UserController here
    //automatically bind the methods to the current context
    // console.log("Object", Object.getOwnPropertyNames(UserController.prototype)); gives all the properties inside the specified class or obj
    Object.getOwnPropertyNames(AuthController.prototype).forEach((method) => {
      if (method != "constructor" && typeof this[method] === "function") {
        this[method] = this[method].bind(this);
      }
    });
  }
  async register(req, res, next) {
    return this.handleRequest(req, res, next, async (req, res) => {
      console.log("post user controller called");
      const data = req.body;
      const { email, password, role } = data;
      if (!email || !password || !role) {
        return this.errorMessage(
          "Please provide email, password and role",
          400,
          next
        );
      }
      //check if the user already exists
      const existingUser = await UserServices.findOne({ email: email });
      if (existingUser) {
        return this.errorMessage("User already exists", 400, next);
      }
      const user = await UserServices.create(data);
      console.log("users successfully created", user);

      if (!user) {
        return this.errorMessage("User not created", 400, next);
      }
      return this.successResponse(res, {
        message: "User created successfully",
        data: user,
        status: 201,
      });
    });
  }

  async logIn(req, res, next) {
    return this.handleRequest(req, res, next, async (req, res) => {
      // console.log("log in user controller called");
      const { email, password } = req.body;
      if (!email || !password) {
        return this.errorMessage(
          "Please provide email and password",
          400,
          next
        );
      }
      const user = await authServices.login(email, password);
      if (!user.success) {
        console.log("unsuccessful login");
        return this.errorMessage(user.message, 400, next);
      }
      console.log("successful login");
      //set the token in the cookie
      res.cookie("token", user.token, Config.getCookieConfig());
      return this.successResponse(res, {
        message: user.message,
        data: user.data,
        status: 200,
      });
    });
  }
  async logOut(req, res, next) {
    return this.handleRequest(req, res, next, async (req, res) => {
      console.log("log out user controller called");
      res.clearCookie("token");
      return this.successResponse(res, {
        message: "User logged out successfully",
        status: 200,
      });
    });
  }

  async forgotPassword(req, res, next) {
    this.handleRequest(req, res, next, async (req, res) => {
      console.log("reset password controller called");
      const { email } = req.body;
      console.log("email in reset password controller", email);
      if (!email) {
        return this.errorMessage("Please provide email", 400, next);
      }
      await authServices.sendEmail(email);
      return this.successResponse(res, {
        message: "Password reset link sent to your email",
        status: 200,
      });
    });
  }
  async resetPassword(req, res, next) {
    return this.handleRequest(req, res, next, async (req, res) => {
      console.log("reset password controller called");
      const { token } = req.params;
      const { password } = req.body;
      if (!token || !password)
        return this.errorMessage(
          "Please provide token and password",
          400,
          next
        );
      // console.log("token in reset password controller", token);
      await authServices.resetPassword(token, password);
      return this.successResponse(res, {
        message: "Password reset successfully",
        status: 200,
      });
    });
  }
  async googleCallback(req, res, next) {
    return this.handleRequest(req, res, next, async (req, res) => {
      const user = req.user; //got from google strategy
      //create a token for the user
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }
      const token = utils.generateToken(
        user._id,
        user.email,
        user.role || "jobSeeker"
      );
      // Store token in cookie
      res.cookie("token", token, Config.getCookieConfig());

      return res.status(200).json({
        success: true,
        message: "Google authentication successful",
        user: req.user,
      });
    });
  }
}

module.exports = new AuthController();
