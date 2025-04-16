const Job = require("../../models/job.model");
const BaseRepository = require("./BaseRepositoryService");
const Joi = require("joi");

class JobServices extends BaseRepository {
  constructor() {
    super(Job);
  }

  async validateJobData(data) {
    const jobSchema = Joi.object({
      title: Joi.string().required(),
      company: Joi.string().required(),
      description: Joi.string().required(),
      salary: Joi.alternatives().try(Joi.number(), Joi.string()),
      location: Joi.string().required(),
      jobType: Joi.string()
        .valid("full-time", "part-time", "contract", "internship")
        .required(),
      skills: Joi.array().items(Joi.string()).required(),
      experianceLevel: Joi.string(),
    });

    const { error } = jobSchema.validate(data, { abortEarly: false });
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
  async getJob(queries, page) {
    // console.log("getting jobs<..");

    const jobs = await Job.find(queries)
      .sort(page.sort)
      .skip(page.skip)
      .limit(page.limit)
      .populate("postedBy")
      .populate("applicants")
      .exec();
    const totalJobs = await Job.countDocuments(queries);
    const totalPages = Math.ceil(totalJobs / page.limit);
    const currentPage = page.page;
    const hasNextPage = currentPage < totalPages;
    const hasPreviousPage = currentPage > 1;
    const analytics = {
      totalJobs,
      totalPages,
      currentPage,
      hasNextPage,
      hasPreviousPage,
    };

    // console.log("jobs now>>.", jobs);
    // console.log("analytics", analytics);
    return {
      jobs,
      analytics,
    };
  }
  /**
   *RECOMMENDATION ALGORITHM
   * @param {args} args
   * @param {Array} args.skills - array of skills
   * @param {String} args.experianceLevel - experiance level of the user and so on
   * will recommend jobs based on the skills, experiance level, location, and job type
   * this is a weigthed recommendation system
   * 50% for skills, 20% for experiance level, 20% for location, and 10% for job type
   *
   * @returns {Array} recommendedJobs - array of recommended jobs
   */

  async getRecommendedJobs(args) {
    const recommendedJobs = await Job.aggregate([
      {
        $addFields: {
          totalSkills: {
            $size: "$skills",
          },
          skillMatches: {
            $size: {
              $setIntersection: ["$skills", args.skills], // "requiredSkills" from Job model
            },
          },
          skillMatchScore: {
            $cond: {
              if: {
                $gt: [
                  { $size: { $setIntersection: ["$skills", args.skills] } },
                  0,
                ],
              },
              then: {
                $divide: [
                  { $size: { $setIntersection: ["$skills", args.skills] } },
                  { $size: "$skills" },
                ],
              },
              else: 0,

              // [
              //   {
              //     $gt: [
              //       { $size: { $setIntersection: ["$skills", args.skills] } },
              //       0,
              //     ],
              //   },
              //   {
              //     $divide: [
              //       { $size: { $setIntersection: ["$skills", args.skills] } },
              //       { $size: "$skills" },
              //     ],
              //   },
              //   0,

              // ],
            },
          },
          experianceMatches: {
            $cond: [{ $eq: ["$experianceLevel", args.experianceLevel] }, 1, 0],
          },
          locationMatches: {
            $cond: [
              {
                $or: [
                  { $eq: ["$location", args.location] },
                  { $eq: ["$location", args.preferredLocation] },
                ],
              },
              1,
              0,
            ],
          },
          jobTypeMatches: {
            $cond: {
              if: { $eq: ["$jobType", args.prefferedJobType] },
              then: 1,
              else: 0,
            },
          },
        },
      },
      {
        $addFields: {
          totalScore: {
            $add: [
              {
                $multiply: ["$skillMatchScore", 0.5],
              },
              {
                $multiply: ["$experianceMatches", 0.2],
              },
              {
                $multiply: ["$locationMatches", 0.2],
              },
              {
                $multiply: ["$jobTypeMatches", 0.1],
              },
            ],
          },
        },
      },
      {
        $match: {
          totalScore: { $gt: 0 },
        },
      },
      { $sort: { totalScore: -1 } },
      { $skip: args.skip },
      { $limit: args.limit },
    ]);
    //analysis
    const totalJobs = recommendedJobs.length;
    const totalPages = Math.ceil(totalJobs / args.limit);
    const hasNextPage = args.page < totalPages;
    const hasPreviousPage = args.page > 1;
    const analysis = {
      totalJobs,
      totalPages,
      currentPage: args.page,
      hasNextPage,
      hasPreviousPage,
    };

    return {
      recommendedJobs,
      analysis,
    };
  }
}

module.exports = new JobServices();
