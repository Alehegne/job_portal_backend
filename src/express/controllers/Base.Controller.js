class BaseController {
  async handleRequest(req, res, next, handler) {
    try {
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  }
  async errorMessage(message, status, next) {
    // console.log(
    //   "error message middleware called nowwwwww",
    //   message,
    //   status,
    //   next
    // );
    // console.log(
    //   "error message middleware called in BaseController",

    //   next
    // );
    const error = new Error(message);
    error.status = status;
    next(error);
  }

  async successResponse(res, data) {
    // console.log("response ......success");
    return res.status(data.status || 200).json({
      success: true,
      message: data.message || "Success",
      data: data.data || null,
      analytics: data.analytics || null,
    });
  }
}

module.exports = BaseController;
// This is a base controller class that can be extended by other controllers
