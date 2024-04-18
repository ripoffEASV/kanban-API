const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const taskSchema = new Schema({
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

modoule.export = mongoose.Model("tasks", taskSchema);
