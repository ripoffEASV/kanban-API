const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const projectsSchema = new Schema({
  projectID: { type: Number },
  projectName: { type: String },
  projectStateIDs: { type: Array },
  invitesArray: { type: Array },
});

module.exports = mongoose.Model("projects", projectsSchema);
