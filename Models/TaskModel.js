const mongoose = require("mongoose");
var Schema = mongoose.Schema;

var taskSchema = new Schema({
  stateID: { type: String },
  taskTitle: { type: String },
  taskDescription: { type: String },
  hoursExpected: { type: Number },
  hoursSpent: { type: Number },
  labelColor: { type: String },
  labelText: { type: String },
  parentTaskID: { type: String },
  assignedToID: { type: Array },
  createdByID: { type: String },
});

module.exports = mongoose.model("tasks", taskSchema);
