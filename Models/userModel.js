const mongoose = require("mongoose");
var Schema = mongoose.Schema;

var usersSchema = new Schema({
  Email: { type: String },
  Password: { type: String },
  FName: { type: String },
  LName: { type: String },
});

module.exports = mongoose.model("users", usersSchema);
