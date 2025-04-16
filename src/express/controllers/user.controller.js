const UserServices = require("../services/main/user.services");
const cacheKeys = require("../utils/cacheService/cacheKeys");
const cacheService = require("../utils/cacheService/cacheService");
const { invalidateUsersCache } = require("../utils/helper");
const BaseController = require("./Base.Controller");

class UserController extends BaseController {
  constructor() {
    super(); // Call the constructor of the parent class
    // Initialize any properties or methods specific to UserController here
    //automatically bind the methods to the current context
    // console.log("Object", Object.getOwnPropertyNames(UserController.prototype)); gives all the properties inside the specified class or obj
    Object.getOwnPropertyNames(UserController.prototype).forEach((method) => {
      if (method != "constructor" && typeof this[method] === "function") {
        this[method] = this[method].bind(this);
      }
    });
  }
  async getUser(req, res, next) {
    return this.handleRequest(req, res, next, async (req, res) => {
      console.log("get user controller called");
      console.log("req.pagination", req.pagination);
      const { page, limit, skip, sort } = req.pagination;
      const userCacheKey = cacheKeys.users({ page, limit, skip, sort });
      console.log("usercachkey,", userCacheKey);

      // const { users, pagination } = await UserServices.getUsers({
      //   page,
      //   limit,
      //   skip,
      //   sort,
      // });
      const { users, pagination } = await cacheService.getOrSet(
        userCacheKey,
        async () => {
          const response = await UserServices.getUsers({
            page,
            limit,
            skip,
            sort,
          });
          return response;
        },
        6 * 60
      );
      if (users === null || users.length === 0) {
        return this.errorMessage("No users found", 404, next);
      }

      return this.successResponse(res, {
        message: "Users found",
        data: users,
        analytics: pagination,
        status: 200,
      });
    });
  }
  async deleteUser(req, res, next) {
    return this.handleRequest(req, res, next, async (req, res) => {
      const { id } = req.params;
      console.log("delete user controller called", id);
      if (!id) {
        return this.errorMessage("Please provide user id", 400, next);
      }
      const user = await UserServices.delete(id);
      if (!user) {
        return this.errorMessage("User not found", 404, next);
      }
      //invalidate the user
      invalidateUsersCache();

      return this.successResponse(res, {
        message: "User deleted successfully",
        data: user,
        status: 200,
      });
    });
  }
  async getUserById(req, res, next) {
    return this.handleRequest(req, res, next, async (req, res) => {
      const { id } = req.params;
      console.log("get user by id controller called", id);
      if (!id) {
        return this.errorMessage("Please provide user id", 400, next);
      }

      const user_key = cacheKeys.userById(id);
      // const user = await UserServices.findById(id);
      const user = await cacheService.getOrSet(user_key, async () => {
        const user = await UserServices.findUserById(id);
        return user;
      });
      if (!user) {
        return this.errorMessage("User not found", 404, next);
      }

      return this.successResponse(res, {
        message: "User found",
        data: user,
        status: 200,
      });
    });
  }
  //get by email
  async getByEmail(req, res, next) {
    return this.handleRequest(req, res, next, async (req, res) => {
      const { email } = req.query;
      if (!email) return this.errorMessage("provide email", 400, next);

      const user = await UserServices.findWithQuery({ email: email });
      if (!user) return this.errorMessage("user not found", 404, next);

      return this.successResponse(res, {
        data: user,
      });
    });
  }
  /*
  update user profile
  - only the user  can update their profile
  - only the admin can update any user profile
  - email, password, and phone number canbe updated in the settings page
  -it accepts links to the profile picture
  */
  async updateProfile(req, res, next) {
    return this.handleRequest(req, res, next, async (req, res) => {
      console.log("update profile controller called", req.params.id);
      //updated user data
      const updated = req.body;
      //check if the user wants to update password, email, or phone number
      if (updated.password || updated.email || updated.phoneNumber) {
        return this.errorMessage(
          "You are not allowed to update this field, update it in the settings page",
          403,
          next
        );
      }
      const { id } = req.params;
      if (!id) {
        return this.errorMessage("Please provide user id", 400, next);
      }
      console.log("update information", updated);
      //from the request body
      const authorizedUserId = req.user.id;
      if (id !== authorizedUserId && req.user.role !== "admin") {
        return this.errorMessage(
          "You are not authorized to update this user",
          403,
          next
        );
      }
      //update user
      const updatedUser = await UserServices.update(id, updated);

      if (!updatedUser) {
        return this.errorMessage("User not found", 404, next);
      }
      const updatedBy = req.user.role === "admin" ? "by admin" : "";
      //return success response
      return this.successResponse(res, {
        message: `user profile updated successfully ${updatedBy}`,
        data: updatedUser,
        status: 200,
      });
    });
  }

  /*
    -the owner of the profile and the admin have the authority to delete
    -the id is sent as a query
    
  */
  async deleteProfile(req, res, next) {
    return this.handleRequest(req, res, next, async (req, res) => {
      console.log("delete profile controller called", req.query.id);
      const { id } = req.query;
      if (!id) {
        return this.errorMessage("Please provide user id", 400, next);
      }
      console.log("delete profile information id", id);
      //get the user id from the req
      const userId = req.user.id;
      console.log("user id req", userId);
      if (id != userId && req.user.role !== "admin") {
        return this.errorMessage("unauthorized!", 403, next);
      }
      const deletedProfile = UserServices.delete(id);
      if (!deletedProfile) {
        return this.errorMessage("User not found", 404, next);
      }

      const deletedBy = req.user.role === "admin" ? "by admin" : "";
      return this.successResponse(res, {
        message: `user profile deleted successfully ${deletedBy}`,
        data: deletedProfile,
        status: 200,
      });
    });
  }
}

module.exports = new UserController();
