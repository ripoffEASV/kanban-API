const express = require("express");
const app = express();
const projects = require("../Models/ProjectModel");
const states = require("../Models/StateModel");
const tasks = require("../Models/TaskModel");
const orgs = require("../Models/OrganizationModel");
const mongoose = require("mongoose");
const verifyToken = require("../auth");

app.post("/addNewProject", async (req, res) => {
  try {
    let data = req.body;
    console.log(data);

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
                    $in: [
                      { $toObjectId: "$_id" },
                      {
                        $map: {
                          input: "$$projectStateIDs",
                          as: "projectStateID",
                          in: { $toObjectId: "$$projectStateID" },
                        },
                      },
                    ],
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
            localField: "stateInfo._id",
            foreignField: "stateID",
            as: "tasks",
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
            tasks: 1,
          },
        },
      ])
      .then((result) => {
        console.log(result);
        res.status(200).json({ project: result });
      })
      .catch((error) => {
        console.log(error);
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
        console.log(results);
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

app.post("/updateSingleProjectBoard", async (req, res) => {
  try {
    const data = req.body;
    console.log(data);

    const updatedState = await states.findOneAndUpdate(
      { _id: data.stateID },
      { stateName: data.stateName },
      { new: true } // Return the updated document
    );

    if (!updatedState) {
      console.log(`State with ID ${data.stateID} not found.`);
      return res.status(404).send("State not found");
    }

    // Array to store information about each task
    const taskInfo = [];

    // Iterate over each task in the taskArray
    for (const task of updatedState.taskArray) {
      // Create a document for each task
      const newTask = new tasks({
        stateID: data.stateID,
        taskTitle: task.taskName,
        // Add other fields as needed
      });

      // Save the new task document to the database
      await newTask.save();

      // Add information about the task to the taskInfo array
      taskInfo.push({
        taskId: newTask._id, // Assuming MongoDB assigns an _id to each task
        taskName: newTask.taskTitle,
        // Add other fields as needed
      });
    }

    // Update the state with information about each task
    updatedState.taskInfo = taskInfo;
    await updatedState.save();

    console.log(
      `State with ID ${data.stateID} updated successfully with task information:`
    );
    console.log(updatedState);

    res.status(200).send(updatedState);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error"); // Send 500 for any server error
  }
});

module.exports = app;
