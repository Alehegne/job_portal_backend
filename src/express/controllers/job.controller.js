const BaseController = require("./Base.Controller");
const jobServices = require("../services/main/job.services");
const userServices = require("../services/main/user.services");
const Job = require("../models/job.model");
const CacheService = require("../utils/cacheService/cacheService");
const cacheKeys = require("../utils/cacheService/cacheKeys");

class JobController extends BaseController {
  constructor() {
    super();

    Object.getOwnPropertyNames(JobController.prototype).forEach((method) => {
      if (this[method] && typeof this[method] === "function") {
        this[method] = this[method].bind(this);
      }
    });
  }

  async postJob(req, res, next) {
    return this.handleRequest(req, res, next, async (req, res) => {
      const { title, company, description, salary, location, jobType, skills } =
        req.body;
      const result = await jobServices.validateJobData(req.body);
      if (!result.success) {
        return this.errorMessage([result.message, result.error], 400, next);
      }
      const userId = req.user.id;
      const jobData = {
        title,
        company,
        description,
        salary,
        location,
        jobType,
        skills,
        postedBy: userId,
      };
      const job = await jobServices.create(jobData);

      if (!job) {
        return this.errorMessage("job not posted", 400, next);
      }
      //invalidate the jobs
      console.log("keys:", CacheService.keys());
      CacheService.delByPrefix("jobs::");
      console.log("keys:", CacheService.keys());

      //update the user model  to add the job id to the posted jobs array
      const user = await userServices.update(userId, {
        $push: { postedJobs: job._id },
      });

      if (!user) {
        return this.errorMessage(
          "please, register first to post a job",
          400,
          next
        );
      }
      return this.successResponse(res, {
        message: "job posted successfully",
        status: 200,
        data: job,
      });
    });
  }
  //fetch jobs, filter by location, job type, salary range, skills,  company, and title, and title

  async fetchJobs(req, res, next) {
    return this.handleRequest(req, res, next, async (req, res) => {
      console.log("query", req.filter);
      console.log("pagination", req.pagination);

      const filter = { ...req.filter, ...req.pagination };
      const cacheKey = cacheKeys.jobs(filter);

      const { jobs, analytics } = await CacheService.getOrSet(
        cacheKey,
        async () => {
          const response = await jobServices.getJob(req.filter, req.pagination);
          return response;
        },
        5 * 60
      );
      console.log("keys:", CacheService.keys());
      // const { jobs, analytics } = await jobServices.getJob(
      //   req.filter,
      //   req.pagination
      // );

      if (jobs.length === 0) return this.successResponse(res, "No Jobs Found");
      if (!jobs) return this.errorMessage("No jobs found", 400, next);

      // console.log("analytics", analytics);
      return this.successResponse(res, {
        message: "jobs fetched successfully",
        status: 200,
        data: jobs,
        analytics: {
          totalJobs: analytics.totalJobs,
          totalPages: analytics.totalPages,
          currentPage: analytics.currentPage,
          hasNextPage: analytics.hasNextPage,
          hasPreviousPage: analytics.hasPreviousPage,
        },
      });
    });
  }

  async getJobById(req, res, next) {
    return this.handleRequest(req, res, next, async (req, res) => {
      const { id } = req.params;
      const cachekey = cacheKeys.jobById(id);

      const job = await CacheService.getOrSet(cachekey, async () => {
        const job = await jobServices.findById(id);
        return job;
      });
      console.log("keys:", CacheService.keys());
      // const job = await jobServices.findById(id);

      if (!job) return this.errorMessage("job not found", 400, next);

      return this.successResponse(res, {
        message: "job fetched successfully",
        status: 200,
        data: job,
      });
    });
  }
  /*
  LOGIC:
  -check if the user is the employer who posted the job
  -if yes, update the job
    */
  async updateJobById(req, res, next) {
    return this.handleRequest(req, res, next, async (req, res) => {
      const { id } = req.params;
      const newJobData = req.body;
      // console.log(req.user.id)
      const job = await Job.findById(id).where({ postedBy: req.user.id });
      if (!job) {
        return this.errorMessage(
          "job not found or you are not authorized",
          400,
          next
        );
      }
      const updatedJob = await jobServices.update(id, newJobData);
      if (!updatedJob) {
        return this.errorMessage("job not updated", 400, next);
      }
      //invalidate the cache
      console.log("keys:", CacheService.keys());
      CacheService.del(`job::${id}`);
      console.log("keysA:", CacheService.keys());

      return this.successResponse(res, {
        message: "job updated successfully",
        status: 200,
        data: updatedJob,
      });
    });
  }

  async deleteJobById(req, res, next) {
    return this.handleRequest(req, res, next, async (req, res) => {
      const { id } = req.params;
      const job = await Job.findById(id).where({ postedBy: req.user.id });
      if (!job)
        return this.errorMessage(
          "job not found or you are not authorized",
          400,
          next
        );
      const deletedJob = await jobServices.delete(id);
      if (!deletedJob) return this.errorMessage("job not deleted", 400, next);

      //invalidate the cache
      console.log("keys:", CacheService.keys());
      CacheService.del(`job::${id}`);
      console.log("keysA:", CacheService.keys());

      //remove the job id from the user model postedJobs array

      const user = await userServices.update(req.user.id, {
        $pull: { postedJobs: id },
      });
      if (!user) return this.errorMessage("user not found", 400, next);
      return this.successResponse(res, {
        message: "job deleted successfully",
        status: 200,
        data: deletedJob,
      });
    });
  }
  async getRecommendedJobs(req, res, next) {
    return this.handleRequest(req, res, next, async (req, res) => {
      const userId = req.user.id;
      console.log("req.pagination:", req.pagination);
      const { limit, page, skip } = req.pagination;
      const userCacheKey = cacheKeys.userById(userId);
      // const user = await userServices.findById(userId);
      const user = await CacheService.getOrSet(
        userCacheKey,
        async () => {
          const user = await userServices.findById(userId);
          return user;
        },
        0
      );

      if (!user) return this.errorMessage("user not found", 400, next);

      const params = {
        skills: user.skills,
        experianceLevel: user.experianceLevel,
        location: user.location,
        preferredLocation: user.preferredLocation,
        prefferedJobType: user.jobType,
        skip: skip,
        limit: limit,
        page: page,
      };
      const rec_key = cacheKeys.jobs(params);
      const response = await CacheService.getOrSet(
        rec_key,
        async () => {
          const response = await jobServices.getRecommendedJobs(params);
          return response;
        },
        5 * 60
      );
      if (!response.recommendedJobs && !response.recommendedJobs.length === 0)
        return this.errorMessage("No jobs found", 400, next);
      return this.successResponse(res, {
        message: "recommended jobs fetched successfully",
        status: 200,
        data: response.recommendedJobs,
        analytics: response.analysis,
      });
    });
  }
}

module.exports = new JobController();
