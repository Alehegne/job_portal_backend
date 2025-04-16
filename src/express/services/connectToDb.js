const mongoose = require("mongoose");
const Logger = require("../utils/Logger");

// const connectToDb = async () => {
//   try {
//     await mongoose.connect(process.env.mongourl);
//   } catch (error) {
//     console.error("Error connecting to the database: ", error);
//     throw new Error("Database connection failed");
//   }
// };

// module.exports = connectToDb;
class DataBaseConnection {
  static instance;
  constructor() {}
  static getInstance() {
    if (!DataBaseConnection.instance) {
      DataBaseConnection.instance = new DataBaseConnection();
    }
    return DataBaseConnection.instance;
  }

  async connectToDb() {
    try {
      await mongoose.connect(process.env.mongourl);
      Logger.log("Connected to MongoDB");
    } catch (error) {
      Logger.log("Error connecting to the database: ", error);
      throw new Error("Database connection failed");
    }
  }
}

module.exports = DataBaseConnection.getInstance();
