const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const statesSchema = new Schema({
  stateName: { type: String },
  position: { type: Number },
});

module.exports = mongoose.model("states", statesSchema);
