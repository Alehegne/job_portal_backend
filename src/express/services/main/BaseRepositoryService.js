const { default: mongoose } = require("mongoose");

class BaseRepository {
  constructor(model) {
    this.model = model;
  }
  async create(data) {
    const document = await new this.model(data);
    await document.save();
    return document;
  }
  async findAll(queries = {}) {
    console.log("queries in findall base repo", queries);
    console.log("find all method called in base repository", this.model);
    const documents = await this.model.find(queries);
    return documents;
  }

  async findById(id) {
    const document = await this.model.findById(id);
    return document;
  }
  async update(id, data) {
    const document = await this.model.findByIdAndUpdate(id, data, {
      new: true,
    });
    return document;
  }
  async isDocumentExist(id) {
    const document = await this.model.findById(id);
    if (!document) {
      return false;
    }
    return true;
  }
  async delete(id) {
    const document = await this.model.findByIdAndDelete(id);
    return document;
  }
  async findOne(query) {
    const document = await this.model.findOne(query);
    return document;
  }
  async findWithQuery(query) {
    const documents = await this.model.find(query);
    return documents;
  }
  async countDocuments(query = {}) {
    const count = await this.model.countDocuments(query);
    return count;
  }
  // async paginate(query, options){
  async aggregate(pipeline) {
    const documents = await this.model.aggregate(pipeline);
    return documents;
  }
  async distinct(field, query) {
    const documents = await this.model.distinct(field, query);
    return documents;
  }
}
// This is a base repository class that can be extended by other repositories
//  to provide common CRUD operations for different models in the application
// . It uses Mongoose to interact with MongoDB and provides methods for creating,
//  reading, updating, and deleting documents in the database.
// The class also includes methods for finding documents with specific queries,
// counting documents, aggregating data, and finding distinct values.
module.exports = BaseRepository;
