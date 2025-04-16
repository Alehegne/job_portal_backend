const cacheService = require("./cacheService/cacheService");

function invalidateJobCache() {
  return cacheService.delByPrefix("jobs::");
}

function invalidateUsersCache() {
  return cacheService.delByPrefix("users::");
}
function invalidateApplicationsCache() {
  return cacheService.delByPrefix("applications::");
}
function invalidateCompaniesCache() {
  return cacheService.delByPrefix("companies::");
}
function invalidateMessagesCache() {
  return cacheService.delByPrefix("messages::");
}

module.exports = {
  invalidateJobCache,
  invalidateApplicationsCache,
  invalidateCompaniesCache,
  invalidateMessagesCache,
  invalidateUsersCache,
};
