const express = require("express");
const app = express();
const tasks = require("../Models/TaskModel");
const mongoose = require("mongoose");
const { verifyToken } = require("../auth");

app.post("/updateSingleTask", verifyToken, async (req, res) => {
  try {
    const updateData = {
      taskTitle: req.body.taskTitle,
      taskDescription: req.body.taskDescription,
      assignedToID: req.body.assignedToID,
      labelColor: req.body.labelColor,
      hoursExpected: req.body.hoursExpected,
      hoursSpent: req.body.hoursSpent,
    };

    console.log(updateData);

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

app.post("/updateTaskPosition", verifyToken, async (req, res) => {
  try {
    req.body.forEach(async (task) => {
      const response = await tasks.findByIdAndUpdate(
        { _id: task._id },
        { position: task.position }
      );
      if (!response) {
        throw new Error("no response");
      }
    });

    res.status(200).json({
      title: "Task position successfully updated",
    });
  } catch (error) {
    res.status(500).json({
      title: "something went wrong when updating task position",
      message: error.message,
    });
  }
});

app.post("/updateTaskState", verifyToken, async (req, res) => {
  try {
    const response = await tasks.findByIdAndUpdate(
      { _id: req.body.taskID },
      { stateID: req.body.newStateID }
    );
    if (!response) {
      throw new Error("no response");
    }

    res.status(200).json({
      title: "Task state successfully updated",
    });
  } catch (error) {
    res.status(500).json({
      title: "something went wrong when updating task state",
      message: error.message,
    });
  }
});

module.exports = app;
