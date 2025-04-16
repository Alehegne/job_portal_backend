const User = require("../../models/user.model");
const utils = require("../../utils/utils");
const BaseRepository = require("./BaseRepositoryService");
const jwt = require("jsonwebtoken");
const config = require("../../config/allConfig");

class UserServices extends BaseRepository {
  constructor() {
    super(User); //calling the constructor of the parent class BaseRepository
  }

  async logIn(email, password) {
    if (!email || !password) {
      return {
        success: false,
        message: "Please provide email and password",
      };
    }

    console.log("email", email);
    const user = await this.findOne({ email: email }); //from base repo
    console.log("user in login", user);
    if (!user) {
      return {
        success: false,
        message: "User not found",
      };
    }
    const isMatch = await utils.comparePassword(password, user.password);
    if (!isMatch) {
      return {
        success: false,
        message: "Invalid credentials(password), please try again",
      };
    }
    const token = utils.generateToken(user._id, user.email, user.role);
    if (!token) {
      return {
        success: false,
        message: `Token generation failed, please try again ,Admin login failed`,
      };
    }

    return {
      success: true,
      message: `${user.role} logged in successfully`,
      token: token,
    };
  }
  async sendEmail(email) {
    // try {
    const user = await this.findOne({ email: email });
    if (!user) {
      return {
        success: false,
        message: "User not found",
      };
    }
    const resetToken = user.generatePasswordResetToken(); //generate token from user model
    await user.save(); //save the user with the reset token

    //reset link, note: the reset token is not hashed,
    const frontEndUrl =
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL
        : "http://localhost:3000";
    const resetLink = `${frontEndUrl}/auth/resetPassword/${resetToken}`;
    console.log("reset link", resetLink);

    //send email to user with the reset link
    await utils.emailService(config.getResetPasswordMessage(email, resetLink));
    return;
  }
  async resetPassword(token, password) {
    const hashedToken = utils.hashToken(token); //hash the token
    //find the user with the hashed token

    const user = await this.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordTokenExpiry: { $gt: Date.now() }, //check if the token is not expired
    });
    // console.log("user in reset password", user);

    if (!user) throw new Error("Token is invalid or has expired");
    //update the password
    user.password = password;
    user.passwordResetToken = undefined; //remove the token from the user
    user.passwordResetExpires = undefined; //remove the token expiry date from the user
    await user.save(); //save the user with the new password
    return true;
  }
  async findUserById(id) {
    return await User.findById(id).select(
      "-password -resetPasswordToken -resetPasswordTokenExpiry"
    ); //exclude password and reset token from the user object
  }
  async getUsers(query) {
    const users = await User.find()
      .sort(query.sort)
      .skip(query.skip)
      .limit(query.limit);
    const total = await this.countDocuments();
    const hasNextPage = query.page < total;
    const hasPreviousPage = query.page > 1;
    const pagination = {
      total: total,
      hasNextPage: hasNextPage,
      hasPreviousPage: hasPreviousPage,
    };

    return {
      users,
      pagination,
    };
  }
}
module.exports = new UserServices();
