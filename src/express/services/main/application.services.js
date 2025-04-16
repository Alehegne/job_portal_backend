const BaseRepository = require("./BaseRepositoryService");
const Application = require("../../models/application.model");
const Joi = require("joi");

class ApplicationServices extends BaseRepository {
  constructor() {
    super(Application);
  }

  async postJob() {
    return { message: "All applications retrieved successfully" };
  }
  async validateApplicationData(applicationData) {
    const applicationSchema = Joi.object({
      jobId: Joi.string().required(),
      applicantId: Joi.string().required(),
      status: Joi.string()
        .valid("pending", "accepted", "rejected")
        .default("pending"),
      coverLetter: Joi.string().optional(),
      resumeUrl: Joi.string().optional(),
    });

    const { error } = applicationSchema.validate(applicationData, {
      abortEarly: false,
    });
    if (error) {
      return {
        success: false,
        message: `validation failed`,
        error: error.details.map((error) => error.message),
      };
    }
    return {
      success: true,
      message: "validation success",
    };
  }
  async getApplications(queries, page) {
    console.log("queries now:", queries);
    const applications = await Application.find(queries)
      .sort(page.sort)
      .skip(page.skip)
      .limit(page.limit)
      // .populate("applicantId")
      // .populate("jobId")
      .exec();
    const totalApplications = await Application.countDocuments(queries);
    const totalPages = Math.ceil(totalApplications / page.limit);
    const currentPage = page.page;
    const hasNextPage = currentPage < totalPages;
    const hasPreviousPage = currentPage > 1;
    const analytics = {
      totalApplications,
      totalPages,
      currentPage,
      hasNextPage,
      hasPreviousPage,
    };

    return {
      applications,
      analytics,
    };
  }
}

module.exports = new ApplicationServices();
