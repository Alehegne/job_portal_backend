const BaseController = require("./Base.Controller");
const ApplicationService = require("../services/main/application.services");
const JobService = require("../services/main/job.services");
const UserServices = require("../services/main/user.services");
const { default: mongoose } = require("mongoose");

class ApplicationController extends BaseController {
  constructor() {
    super(); //call the constructor of the parent class

    Object.getOwnPropertyNames(ApplicationController.prototype).forEach(
      (method) => {
        if (method != "constructor" && typeof this[method] === "function") {
          this[method] = this[method].bind(this);
        }
      }
    );
  }

  async apply(req, res, next) {
    return this.handleRequest(req, res, next, async (req, res) => {
      const { coverLetter, resumeUrl, jobId } = req.body;
      const applicantId = req.user.id;
      if (!jobId) {
        return this.errorMessage("jobId is required", 400, next);
      }
      if (!mongoose.Types.ObjectId.isValid(jobId))
        return this.errorMessage("jobId is not valid", 400, next);
      //check the existence of the job
      const found = await JobService.isDocumentExist(jobId);
      if (!found) return this.errorMessage("job not found", 404, next);
      //check the existence of the user
      const foundUser = await UserServices.isDocumentExist(applicantId);
      if (!foundUser) return this.errorMessage("user not found", 404, next);
      //check if the user has already applied for the job
      const alreadyApplied = await ApplicationService.findOne({
        jobId,
        applicantId,
      });
      if (alreadyApplied)
        return this.errorMessage(
          "you have already applied for this job",
          400,
          next
        );

      //process the application data
      const applicationData = {
        jobId,
        applicantId,
        coverLetter,
        resumeUrl,
        status: "pending",
      };
      const validData = await ApplicationService.validateApplicationData(
        applicationData
      );
      if (!validData.success) {
        return this.errorMessage(
          [validData.message, validData.error],
          400,
          next
        );
      }

      //create the application
      const application = await ApplicationService.create(applicationData);
      if (!application) {
        return this.errorMessage(
          "sorry, unexpected error occured. please try again!",
          400,
          next
        );
      }

      //update the user model to add the job id to the applied jobs array
      const user = await UserServices.update(applicantId, {
        $push: { appliedJobs: jobId },
      });
      if (!user) {
        return this.errorMessage(
          "please, register first to apply for a job",
          400,
          next
        );
      }

      //update the job model to add the application id to the applicants array
      const job = await JobService.update(jobId, {
        $push: { applicants: application._id },
      });
      if (!job) {
        return this.errorMessage(
          "sorry, unexpected error occured. please try again!",
          400,
          next
        );
      }

      return this.successResponse(res, {
        message: "application submitted successfully",
        status: 200,
        data: application,
      });
    });
  }
  //fetch applications, filter by jobId, applicantId, status, and appliedAt
  /*
  -user =>can only fetch his/her applications
  -employer =>can only fetch applications for his/her jobs
  -admin =>can fetch all applications
  -appliedAt query can accept: today, this week, this month, this year
  */

  async fetchApplications(req, res, next) {
    return this.handleRequest(req, res, next, async (req, res) => {
      const { jobId } = req.query;
      const { applicantId } = req.query;
      const userId = req.query?.userId || req.user.id; //for admin to fetch any user application

      //check if the user is jobSeeker,
      if (req.user.role === "jobSeeker") {
        //job seeker can only filter by applicantId
        const jobSeekerId = req.user.id;
        const foundUser = UserServices.findById(jobSeekerId);
        if (!foundUser) return this.errorMessage("user not found", 404, next);
        req.filter.applicantId = jobSeekerId;
      } else if (req.user.role === "employer" || req.user.role === "admin") {
        //check if the user is employer, then filter by jobId
        //if there is a jobId filter, return the applications for that job

        if (jobId) {
          req.filter.jobId = jobId;
        } else {
          const jobByEmployer = await JobService.findAll({ postedBy: userId });
          if (!jobByEmployer || jobByEmployer.length === 0)
            return this.errorMessage(
              `there is no application submitted`,
              404,
              next
            );

          const jobIds = jobByEmployer.map((job) => job._id);
          req.filter.jobId = { $in: jobIds };
        }
        if (applicantId) {
          req.filter.applicantId = applicantId;
        }
      }

      const { applications, analytics } =
        await ApplicationService.getApplications(req.filter, req.pagination);
      if (!applications || applications.length === 0)
        return this.errorMessage("no applications found", 404, next);
      return this.successResponse(res, {
        message: `${
          req.user.role === "admin" ? "ALL " : ""
        }application fetched successfully by ${req.user.role}`,
        status: 200,
        data: applications,
        analytics: {
          ...analytics,
        },
      });
    });
  }
  async updateApplicationStatus(req, res, next) {
    return this.handleRequest(req, res, next, async (req, res) => {
      const { id } = req.params;
      const status = req.body.status.toLowerCase();

      console.log("status:", status);
      if (!status) return this.errorMessage("status is required", 400, next);
      console.log("application id:", id);
      //check right employer,with his own application
      const employerId = req.user.id;
      const jobs = await JobService.findAll({
        postedBy: employerId,
      });
      if (!jobs || jobs.length === 0)
        return this.errorMessage("you have no jobs posted", 404, next);
      //create a list of job ids
      const jobIds = jobs.map((job) => job._id);
      //find the application with with the given _id, and its job id is in the jobIds array
      const application = await ApplicationService.findOne({
        _id: id,
        jobId: { $in: jobIds },
      });
      if (!application)
        return this.errorMessage("application not found", 404, next);
      //update the application status
      const updateApplication = await ApplicationService.update(id, {
        status: status,
      });
      if (!updateApplication)
        return this.errorMessage("application not updated", 400, next);

      //done updating

      return this.successResponse(res, {
        message: `you have ${status} the application successfully`,
        status: 200,
        data: updateApplication,
      });
    });
  }
}

module.exports = new ApplicationController();
