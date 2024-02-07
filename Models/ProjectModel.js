const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const projectsSchema = new Schema({
  ProjectID: { type: Number },
  ProjectName: { type: String },
  ProjectStateIDs: { type: Array },
  InvitesArray: { type: Array },
});

module.exports = mongoose.Model("projects", projectsSchema);
