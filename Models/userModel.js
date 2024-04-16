const mongoose = require("mongoose");
var Schema = mongoose.Schema;

var usersSchema = new Schema({
  username: { type: String },
  email: { type: String },
  fName: { type: String },
  lName: { type: String },
  password: { type: String },
  color: { type: String },
});

module.exports = mongoose.model("users", usersSchema);
