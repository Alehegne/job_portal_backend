const BaseController = require("./Base.Controller");
const CompanyServices = require("../services/main/company.services");

class CompanyController extends BaseController {
  constructor() {
    super();

    Object.getOwnPropertyNames(CompanyController.prototype).forEach(
      (method) => {
        if (method !== "constructor" && typeof this[method] === "function") {
          this[method] = this[method].bind(this);
        }
      }
    );
  }
  //TODO: add the creator options to the company model
  async newCompany(req, res, next) {
    return this.handleRequest(req, res, next, async (req, res) => {
      console.log("create company controller:");
      const newCData = req.body;
      const employerId = req.user.id;
      newCData.createdBy = [employerId]; // Add the employerId to the createdBy array
      newCData.isVerified = "pending"; // Set default value for isVerified

      //validation
      const valid = await CompanyServices.validateCompanyData(newCData);
      if (!valid.success) return this.errorMessage(valid.error, 400, next);
      //check if the company already exists
      const companyExists = await CompanyServices.findOne({
        $or: [
          {
            name: newCData.name,
          },
          {
            email: newCData.email,
          },
          {
            phone: newCData.phone,
          },
        ],
      });
      if (companyExists)
        return this.errorMessage(
          "company already exists with this data, check your email, company name or phone",
          400,
          next
        );
      //create the company
      const newCompany = await CompanyServices.create(newCData);
      if (!newCompany)
        return this.errorMessage(
          "company not created, due to internal server error. please try again!",
          400,
          next
        );
      //send the response
      return this.successResponse(res, {
        message: "Company created successfully",
        data: newCompany,
        status: 201,
      });
    });
  }
  async fetchCompanies(req, res, next) {
    return this.handleRequest(req, res, next, async (req, res) => {
      const companies = await CompanyServices.getCompany(
        req.query,
        req.pagination
      );
      if (!companies && companies.length === 0)
        return this.errorMessage("no companies found", 404, next);
      console.log(
        "companies phone",
        companies.map((c) => c.phone)
      );
      return this.successResponse(res, {
        message: "Companies fetched successfully",
        data: companies,
        status: 200,
      });
    });
  }
  async getCompanyById(req, res, next) {
    return this.handleRequest(req, res, next, async (req, res) => {
      console.log("get company by id controller:");
      const { id } = req.params;
      const company = await CompanyServices.findById(id);
      if (!company)
        return this.errorMessage("No company found with this id", 404, next);
      return this.successResponse(res, {
        message: "Company fetched successfully",
        data: company,
        status: 200,
      });
    });
  }
  async updateCompany(req, res, next) {
    return this.handleRequest(req, res, next, async (req, res) => {
      console.log("update company controller: hitted");
      const { id } = req.params;
      const updateCompanyData = req.body;
      //first check if the company exists
      const company = await CompanyServices.findById(id);
      if (!company)
        return this.errorMessage("No company found with this id", 404, next);
      //check if the company is created by the user
      console.log("createdBy:", company.createdBy);
      console.log("userId:", req.user.id);
      const isCreatedByUser = company.createdBy.includes(req.user.id);
      console.log("isCreatedByUser", isCreatedByUser);
      if (!isCreatedByUser && req.user.role !== "admin")
        return this.errorMessage(
          "You are not authorized to update this company",
          403,
          next
        );

      //update the company
      const updatedCompany = await CompanyServices.update(
        id,
        updateCompanyData
      );
      if (!updatedCompany)
        return this.errorMessage("Company not updated", 400, next);

      return this.successResponse(res, {
        message: "Company updated successfully",
        data: updatedCompany,
        status: 200,
      });
    });
  }
  async deleteCompany(req, res, next) {
    return this.handleRequest(req, res, next, async (req, res) => {
      console.log("delete company controller: hitted");
      const { id } = req.params;
      //first check if the company exists
      const company = await CompanyServices.findById(id);
      if (!company)
        return this.errorMessage("No company found with this id", 404, next);
      //check if the company is created by the user
      const isCreatedByUser = company.createdBy.includes(req.user.id);
      if (!isCreatedByUser && req.user.role !== "admin")
        return this.errorMessage(
          "You are not authorized to delete this company",
          403,
          next
        );
      //delete the company
      const deletedCompany = await CompanyServices.delete(id);
      if (!deletedCompany)
        return this.errorMessage("Company not deleted", 400, next);
      return this.successResponse(res, {
        message: "Company deleted successfully",
        data: deletedCompany,
        status: 200,
      });
    });
  }
}

module.exports = new CompanyController();
