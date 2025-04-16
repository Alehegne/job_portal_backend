class Logger {
  //singleton pattern to ensure only one instance of Logger exists
  static instance;

  constructor() {}

  static getInstance() {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  log(message) {
    const date = new Date().toISOString();
    console.log(`[${date}] ${message}`);
  }
}

module.exports = Logger.getInstance();
