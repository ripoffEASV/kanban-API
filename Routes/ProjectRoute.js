const express = require("express");
const app = express();
const projects = require("../Models/ProjectModel");
const states = require("../Models/StateModel");
const tasks = require("../Models/TaskModel");
const orgs = require("../Models/OrganizationModel");
const mongoose = require("mongoose");
const { verifyToken } = require("../auth");

app.post("/addNewProject", async (req, res) => {
  try {
    let data = req.body;

    let stateIDArray = [];
    let userIDArray = [];

    if (data.projectMembers.length <= 0) {
      throw new Error("Project must have at least a single member");
    }

    if (data.projectBoards.length <= 0) {
      throw new Error("Project must have at least a single board");
    }

    await Promise.all(
      data.projectMembers.map(async (element) => {
        userIDArray.push(element._id); // Push just the ID, not in an object
      })
    );

    let newProject = await projects.create({
      projectName: data.projectName,
      projectStateIDs: [],
      members: userIDArray,
      orgID: data.orgID,
    });

    await Promise.all(
      data.projectBoards.map(async (element) => {
        let stateID = await states.create({
          stateName: element.title,
        });
        const resultID = stateID._id;
        stateIDArray.push(resultID); // Push just the ID, not in an object
      })
    );

    await projects.findOneAndUpdate(
      { _id: newProject._id },
      { projectStateIDs: stateIDArray }
    );

    res.status(200).json({
      message: "Project added successfully",
      projectID: newProject._id,
    });
  } catch (error) {
    res.status(500).json({
      title: "Something went wrong with adding a new project",
      message: error.message,
    });
  }
});

app.get("/getSpecificProject/:projectID", async (req, res) => {
  try {
    const projectID = req.params.projectID;
    projects
      .aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(projectID),
          },
        },
        {
          $lookup: {
            from: "states",
            let: { projectStateIDs: "$projectStateIDs" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: ["$_id", "$$projectStateIDs"],
                  },
                },
              },

              {
                $project: {
                  stateName: 1,
                  stateID: "$_id",
                },
              },
            ],
            as: "stateInfo",
          },
        },
        {
          $lookup: {
            from: "tasks",
            let: { stateIDs: "$stateInfo.stateID" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: [
                      { $toObjectId: "$stateID" }, // Use stateID field to match
                      {
                        $map: {
                          input: "$$stateIDs",
                          as: "stateID",
                          in: { $toObjectId: "$$stateID" },
                        },
                      },
                    ],
                  },
                },
              },
              {
                $project: {
                  stateID: 1,
                  taskTitle: 1, // Include fields you want to retrieve
                  taskDescription: 1,
                  hoursExpected: 1,
                  hoursSpent: 1,
                  labelColor: 1,
                  labelText: 1,
                  assignedToID: 1,
                  createdByID: 1,
                  // Add more fields if needed
                },
              },
            ],
            as: "taskArray",
          },
        },
        {
          $lookup: {
            from: "users",
            let: { members: "$members" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: [
                      { $toObjectId: "$_id" },
                      {
                        $map: {
                          input: "$$members",
                          as: "member",
                          in: { $toObjectId: "$$member" },
                        },
                      },
                    ],
                  },
                },
              },
              {
                $project: {
                  email: 1,
                  fName: 1,
                  lName: 1,
                  color: 1,
                },
              },
              {
                $unset: "password",
              },
            ],
            as: "membersInfo",
          },
        },
        {
          $project: {
            projectName: 1,
            projectStateIDs: 1,
            orgID: 1,
            membersInfo: 1,
            stateInfo: 1,
            taskArray: 1, // Rename tasks to taskInfo
          },
        },
      ])
      .then((result) => {
        res.status(200).json({ project: result });
      })
      .catch((error) => {
        console.log(error);
        res.status(500).json({
          Title: "Something went wrong with getting specific project",
          Message: error.message,
        });
      });
  } catch (error) {
    res.status(500).json({
      Title: "Something went wrong with getting specific project",
      Message: error.message,
    });
  }
});

app.get("/getProjects/:orgID", async (req, res) => {
  try {
    const orgID = req.params.orgID;

    projects
      .aggregate([
        {
          $match: {
            orgID: orgID,
          },
        },
        {
          $lookup: {
            from: "users",
            let: { members: "$members" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: [
                      { $toObjectId: "$_id" },
                      {
                        $map: {
                          input: "$$members",
                          as: "member",
                          in: { $toObjectId: "$$member" },
                        },
                      },
                    ],
                  },
                },
              },
              {
                $project: {
                  email: 1,
                  fName: 1,
                  lName: 1,
                  color: 1,
                },
              },
              {
                $unset: "password",
              },
            ],
            as: "membersInfo",
          },
        },
        {
          $project: {
            projectName: 1,
            projectStateIDs: 1,
            orgID: 1,
            membersInfo: 1,
          },
        },
      ])
      .then((results) => {
        res.status(200).json({ project: results });
      })
      .catch((err) => {
        res.send(err);
      });
  } catch (error) {
    res.status(500).json({
      Title: "Something went wrong with getting organization projects",
      Message: error.message,
    });
  }
});

app.post("/updateSingleProjectBoard", verifyToken, async (req, res) => {
  try {
    const data = req.body;

    let newTaskArray = [];

    // Create tasks in parallel and collect their IDs
    await Promise.all(
      data.taskArray.map(async (element) => {
        let task = await tasks.create({
          createdByID: req.user.id,
          stateID: data.stateID,
          taskTitle: element.taskTitle,
        });
        newTaskArray.push(task._id); // Push just the ID
      })
    );

    // Find and update the state document
    const updatedState = await states.findOneAndUpdate(
      { _id: data.stateID },
      { stateName: data.stateName, taskArray: newTaskArray },
      { new: true }
    );

    // Check if the state was not found
    if (!updatedState) {
      return res.status(404).send("State not found");
    }

    // Log and send the updated state
    res.status(200).json(updatedState);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
});

module.exports = app;
