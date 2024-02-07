const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const taskSchema = new Schema({
  TaskID: { type: Number },
  TaskTitle: { type: String },
  TaskDescription: { type: String },
  HoursExpected: { type: Number },
  HoursSpent: { type: Number },
  LabelColor: { type: String },
  LabelText: { type: String },
  ParentTaskID: { type: Number },
  AssignedToID: { type: Array },
  CreatedByID: { type: Number },
});

modoule.export = mongoose.Model("tasks", taskSchema);
