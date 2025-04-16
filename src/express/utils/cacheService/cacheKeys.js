// utils/cacheKeys.js
const { isPlainObject, flatMap } = require("lodash");

function serializeFilter(filter = {}) {
  return Object.entries(filter)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}=[${value.sort().join(",")}]`; // normalize order
      }
      if (isPlainObject(value)) {
        return `${key}=${flatMap(value)}`;
      }
      return `${key}=${value}`;
    })
    .join("::");
}

const cacheKeys = {
  jobs: (filter = {}) => `jobs::${serializeFilter(filter)}`,
  jobById: (id) => `job::${id}`,

  users: (pagination = {}) => `users::${serializeFilter(pagination)}`,
  userById: (id) => `user::${id}`,
  userByEmail: (email) => `user::email::${email}`,

  applications: (filter = {}) => `applications::${serializeFilter(filter)}`,

  companies: (filter = {}) => `companies::${serializeFilter(filter)}`,
  companiesById: (id) => `company::${id}`,

  reviewsCompany: (companyId) => `reviews::company::${companyId}`,
  reviewsUser: (userId) => `reviews::user::${userId}`,

  messages: (filter = {}) => `messages::${serializeFilter(filter)}`,
};

module.exports = cacheKeys;
