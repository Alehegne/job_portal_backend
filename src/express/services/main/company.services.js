const BaseRepository = require("./BaseRepositoryService");
const Company = require("../../models/company.model");
const Joi = require("joi");

class CompanyServices extends BaseRepository {
  constructor() {
    super(Company);
  }

  async getCompany(query, pagination) {
    const { page, limit, sort, skip } = pagination;
    const companies = await Company.find(query)
      .limit(limit)
      .skip(skip)
      .sort(sort)
      .populate("createdBy", "fullName email")
      .populate("jobPosted", "title description jobType")
      .exec();
    return companies;
  }
  async validateCompanyData(companyData) {
    const CompanySchema = Joi.object({
      name: Joi.string().required(),
      industry: Joi.string().optional(),
      location: Joi.string().optional(),
      description: Joi.string().optional(),
      createdBy: Joi.array().items(Joi.string().required()).required(), // Array of ObjectId strings
      logoUrl: Joi.string().optional(),
      websiteUrl: Joi.string().optional(),
      email: Joi.string().email().optional(),
      phone: Joi.string().optional(),
      type: Joi.string()
        .valid("company", "startup", "enterprise")
        .optional()
        .default("startup"),
      ownerShip: Joi.string()
        .valid("proprietorship", "partnership", "corporation")
        .optional()
        .default("proprietorship"),

      isActive: Joi.boolean().default(true).optional(),
      isVerified: Joi.string().default("pending"),
      size: Joi.string().optional().valid("small", "medium", "large"),
      foundedYear: Joi.number().optional(),
    });

    const { error } = CompanySchema.validate(companyData, {
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
}

module.exports = new CompanyServices();
