const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const statesSchema = new Schema({
  stateName: { type: String },
});

module.exports = mongoose.model("states", statesSchema);
