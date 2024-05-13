const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const projectsSchema = new Schema({
  projectName: { type: String },
  projectStateIDs: { type: Array },
  members: { type: Array },
  orgID: { type: String },
});

module.exports = mongoose.model("projects", projectsSchema);
