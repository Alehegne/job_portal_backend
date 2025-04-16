const bcrypt = require("bcryptjs");
const nodeMailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
class Utils {
  async comparePassword(password, hash) {
    const isMatch = await bcrypt.compare(password, hash);
    return isMatch;
  }

  async emailService(info) {
    const transporter = nodeMailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
    const mailOptions = {
      from: '"Job Portal Support" <noreply@jobportal.com>',
      to: info.mailto,
      subject: info.subject,
      text: info.text || "",
      html: info.html,
    };

    try {
      await transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.log("Error sending email", error);
      throw new Error(`Error sending email : ${error}`);
    }
  }

  generateToken(id, email, role) {
    const token = jwt.sign(
      { id: id, email: email, role: role },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN,
      }
    );
    return token;
  }
  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // console.log("decoded token", decoded);
      return {
        success: true,
        data: decoded,
      };
    } catch (error) {
      console.log("error in verify token services", error);
      if (
        error.name === "TokenExpiredError" ||
        error.name === "JsonWebTokenError"
      ) {
        return {
          success: false,
          error: "Your token has expired, please login again",
        };
      }
      return {
        success: false,
        error: error,
      };
    }
  }
  hashToken(token) {
    const hash = crypto.createHash("sha256").update(token).digest("hex");
    return hash;
  }
}

module.exports = new Utils();
