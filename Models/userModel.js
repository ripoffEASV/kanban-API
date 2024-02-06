const mongoose = require("mongoose");
var Schema = mongoose.Schema;

var userModel = new Schema({
  id: {
    type: mongoose.Types.ObjectId,
    required: true,
    unique: true,
    index: true,
    validation(value) {
      if (value == "") throw new Error("ID Must be provided");
    },
  },
  Email: {
    type: String,
    index: true,
  },
  Password: {
    type: String,
    required: true,
  },

  FName: {
    type: String,
    required: true,
  },
  LName: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("userModel", userModel);
