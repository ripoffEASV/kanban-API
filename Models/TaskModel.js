const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const taskSchema = new Schema({
  _id: { type: String },
  stateID: { type: String },
  taskTitle: { type: String },
  taskDescription: { type: String },
  hoursExpected: { type: Number },
  hoursSpent: { type: Number },
  labelColor: { type: String },
  labelText: { type: String },
  parentTaskID: { type: Number },
  assignedToID: { type: Array },
  createdByID: { type: Number },
});

modoule.export = mongoose.Model("tasks", taskSchema);
