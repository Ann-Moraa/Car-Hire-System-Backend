const mongoose = require("mongoose");

module.exports = function () {
  mongoose
    .connect(process.env.db)
    .then(() => console.log(`Connection to database is successful!`))
    .catch((error) =>
      console.error(`Error connecting to the databse ${error}`)
    );
};
