const express = require("express");
const app = express();
const tasks = require("../Models/TaskModel");
const mongoose = require("mongoose");
const verifyToken = require("../auth");

app.post("/updateSingleTask", verifyToken, async (req, res) => {
  try {
    console.log("plz: ", req.body);

    const updateData = {
      taskTitle: req.body.taskTitle,
      taskDescription: req.body.taskDescription,
      assignedToID: req.body.assignedToID,
    };

    const response = await tasks.findOneAndUpdate(
      { _id: req.body.taskID },
      updateData
    );

    if (!response) {
      throw new Error("no response");
    }

    res.status(200).json({
      title: "Task updated Successfully",
    });
  } catch (error) {
    res.status(500).json({
      title: "something went wrong with updating task information",
      message: error.message,
    });
  }
});

app.delete("/deleteSingleTask", verifyToken, async (req, res) => {
  try {
    console.log(req.body);

    const response = await tasks.findOneAndDelete({ _id: req.body.taskID });

    if (!response) {
      throw new Error("no response");
    }

    res.status(200).json({
      title: "Task deleted Successfully",
    });
  } catch (error) {
    res.status(500).json({
      title: "something went wrong when deleting task",
      message: error.message,
    });
  }
});

module.exports = app;
