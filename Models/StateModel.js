const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const statesSchema = new Schema({
  StateID: { type: Number },
  StateName: { type: String },
});

module.exports = mongoose.Model("states", statesSchema);
