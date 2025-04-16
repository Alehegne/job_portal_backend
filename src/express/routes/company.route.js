const express = require("express");
const middleware = require("../middleware/allMiddleware");
const CompanyController = require("../controllers/company.controller");
const multer = require("multer");

const companiesRouter = express.Router();
const upload = multer();
// console.log("Companies router loaded");
// Create a new company
companiesRouter.post(
  "/new",
  middleware.verifyToken,
  middleware.verifyRole(["admin", "employer"]),
  upload.none(),
  CompanyController.newCompany
);
companiesRouter.get(
  "/fetch",
  middleware.verifyToken,
  middleware.verifyRole(["admin", "employer", "jobSeeker"]),
  middleware.queryFilter([
    "isVerified",
    "name",
    "location",
    "industry",
    "size",
    "foundedYear",
    "email",
    "phone",
  ]),
  CompanyController.fetchCompanies
);

//get companies details by id
companiesRouter.get(
  "/fetch/:id",
  middleware.verifyToken,
  middleware.validateObjectId,
  CompanyController.getCompanyById
);
//update company profile
companiesRouter.put(
  "/update/:id",
  middleware.verifyToken,
  middleware.validateObjectId,
  middleware.verifyRole(["admin", "employer"]),
  upload.none(),
  CompanyController.updateCompany
);
//delete company profile
companiesRouter.delete(
  "/delete/:id",
  middleware.verifyToken,
  middleware.validateObjectId,
  middleware.verifyRole(["admin", "employer"]),
  CompanyController.deleteCompany
);

module.exports = companiesRouter;
