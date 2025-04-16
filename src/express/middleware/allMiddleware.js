const utils = require("../utils/utils");
const mongoose = require("mongoose");

class Middleware {
  // Middleware to verify authentication
  asyncHandler(fn) {
    return function (req, res, next) {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
  verifyToken(req, res, next) {
    // console.log("verify token middleware called");
    // console.log("req cookies", req.cookies);
    const token = req.cookies.token;

    // console.log("token in verify token middleware", token);
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized, please login",
      });
    }
    const decoded = utils.verifyToken(token);
    // console.log("decoded token in verify token middleware noww", decoded);
    if (!decoded.success) {
      return res.status(401).json({
        success: false,
        message: decoded.error || "Unauthorized, please login",
      });
    }
    req.user = decoded.data;
    // console.log("req.user in verify token middleware", req.user);
    next();
  }
  verifyRole(roles) {
    return (req, res, next) => {
      // console.log("verify role middleware called");
      // console.log("req.user in verify role middleware", req.user);
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message:
            "Forbidden, you don't have permission to access this resource",
        });
      }

      next();
    };
  }
  errorHandler(error, req, res, next) {
    // handle error middleware

    // console.log("handle error middleware called");
    console.error(error);
    const timeStamp = new Date().toISOString();
    return res.status(error.status || 500).json({
      success: false,
      message:
        error.message + " " + timeStamp ||
        "Internal Server Error, please try again later" + " " + timeStamp,
      stack: error.stack || null,
    });
  }
  debug(req, res, next) {
    console.log("debug middleware called");
    console.log(
      "method:",
      req.method,
      " url:",
      req.url,
      "body:",
      req.body,
      "params:",
      req.params,
      "query:",
      req.query
    );
    next();
  }
  queryFilter(allowedFilters = []) {
    return (req, res, next) => {
      // console.log("query filter middleware called");
      const {
        page = 1,
        limit = 15,
        sort,
        order = "desc",
        search,
        ...filters
      } = req.query;
      let query = {};
      //apply filter if they are in the allowed filters list
      // console.log("filters nowwwwwwww:", filters);
      allowedFilters.forEach((filter) => {
        if (filters[filter]) {
          if (filter === "skills") {
            //insensitive search for skills
            const skillsRegex = filters[filter]
              .split(",")
              .map((skill) => new RegExp(skill, "i")); // case insensitive regex, with out regex, wont work
            console.log("skillsRegex", skillsRegex);
            query[filter] = { $in: skillsRegex };
          } else if (filter == "salary") {
            const separator = filters[filter].includes(",") ? "," : "-";
            // console.log("separator", separator);
            query[filter] = {
              $gte: parseInt(filters[filter].split(separator)[0]),
              $lte: parseInt(filters[filter].split(separator)[1]),
            };
          } else if (filter === "title" && search) {
            query[filter] = {
              $regex: search,
              $options: "i",
            };
          } else if (filter === "appliedAt") {
            const now = new Date();

            if (filters[filter] === "today") {
              query[filter] = {
                $gte: new Date(now.setHours(0, 0, 0, 0)),
              };
            } else if (filters[filter] === "this week") {
              query[filter] = {
                $gte: new Date(now.setDate(now.getDate() - 7)),
              };
            } else if (filters[filter] === "this month") {
              query[filter] = {
                $gte: new Date(now.setMonth(now.getMonth() - 1)),
              };
            } else if (filters[filter] === "this year") {
              query[filter] = {
                $gte: new Date(now.setFullYear(now.getFullYear() - 1)),
              };
            }
          } else {
            if (filter === "phone") {
              query[filter] = filters[filter]; // phone is not a regex, so no need to convert to regex
            } else if (filter === "foundedYear")
              query[filter] = parseInt(filters[filter]);
            // foundedYear is number, so convert to number
            else if (filter === "isActive") {
              query[filter] = filters[filter] === "true" ? true : false; // isVerified is boolean, so convert to boolean
            } else query[filter] = new RegExp(filters[filter], "i"); // case insensitive regex, with out regex, wont work
          }
          // console.log("query nowwwwwwww:", query);
        }
      });
      const sortBy = sort || "createdAt";
      req.filter = query;
      req.pagination = {
        limit: parseInt(limit),
        page: parseInt(page),
        skip: (page - 1) * limit,
        sort: {
          [sortBy]: order === "desc" ? -1 : 1,
        },
      };
      next();
    };
  }
  validateObjectId(req, res, next) {
    // console.log("validate object id middleware called");
    const { id } = req.params;
    // console.log("id in validate object id middleware", id);
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "id is required",
      });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "id is not valid",
      });
    }
    // console.log("id is valid", id);
    next();
  }
}

module.exports = new Middleware();
