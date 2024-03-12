const mongoose = require("mongoose");
var Schema = mongoose.Schema;

var orgsSchema = new Schema({
  _id: { type: String },
  orgName: { type: String },
  createdByID: { type: String },
  ownerID: { type: String },
  orgMembers: { type: Array },
  projectIDs: { type: Array },
  inviteArray: { type: Array },
});

module.exports = mongoose.model("organization", orgsSchema);
