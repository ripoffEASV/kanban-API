const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const statesSchema = new Schema({
  stateID: { type: Number },
  stateName: { type: String },
});

module.exports = mongoose.Model("states", statesSchema);
