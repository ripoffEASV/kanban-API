const mongoose = require("mongoose");
var Schema = mongoose.Schema;

var orgsSchema = new Schema({
  OrgID: { type: Number },
  OrgName: { type: String },
  CreatedByID: { type: Number },
  OwnerID: { type: Number },
  OrgMembers: { type: Array },
  ProjectIDs: { type: Array },
  InviteArray: { type: Array },
});

module.exports = mongoose.model("organization", orgsSchema);
