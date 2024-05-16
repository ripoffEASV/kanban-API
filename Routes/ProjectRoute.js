const express = require("express");
const app = express();
const projects = require("../Models/ProjectModel");
const states = require("../Models/StateModel");
const tasks = require("../Models/TaskModel");
const orgs = require("../Models/OrganizationModel");
const mongoose = require("mongoose");
const { verifyToken } = require("../auth");
const { ObjectId } = require("mongodb");
const { deleteProject } = require("../services/dbHelper");

app.post("/addNewProject", async (req, res) => {
  try {
    let data = req.body;

    let stateIDArray = [];
    let userIDArray = [];

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
          position: element.position,
        });
        const resultID = stateID._id;
        stateIDArray.push(resultID); // Push just the ID, not in an object
      })
    );

    await projects.findOneAndUpdate(
      { _id: newProject._id.toString() },
      { projectStateIDs: stateIDArray }
    );

    const updatedOrg = await orgs.findByIdAndUpdate(data.orgID, {
      $push: { projectIDs: newProject._id.toString() },
    });

    if (!updatedOrg) {
      return res.status(404).json({ message: "Organization not found." });
    }

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
                  position: 1,
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
                  taskTitle: 1,
                  taskDescription: 1,
                  hoursExpected: 1,
                  hoursSpent: 1,
                  labelColor: 1,
                  labelText: 1,
                  assignedToID: 1,
                  createdByID: 1,
                  position: 1,
                },
              },

              {
                $sort: {
                  position: 1,
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

app.post("/getSingleProject", verifyToken, async (req, res) => {
  try {
    const projectID = req.body.projectID;

    projects
      .aggregate([
        {
          $match: {
            _id: new ObjectId(projectID),
          },
        },
        {
          $lookup: {
            from: "states",
            let: { states: "$projectStateIDs" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: [
                      { $toObjectId: "$_id" },
                      {
                        $map: {
                          input: "$$states",
                          as: "state",
                          in: { $toObjectId: "$$state" },
                        },
                      },
                    ],
                  },
                },
              },
            ],
            as: "projectStates",
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
            projectStates: 1,
            membersInfo: 1,
          },
        },
      ])
      .then((results) => {
        res.status(200).json({
          Title: "Data retrieved",
          data: results,
        });
      });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
});

app.post("/updateProjectData", async (req, res) => {
  try {
    // if the project should have a new name, then it gets updated here
    if (req.body.newProjectName.length > 0) {
      await projects.findByIdAndUpdate(
        { _id: req.body.projectID },
        {
          projectName: req.body.newProjectName,
        }
      );
    }

    //iterate over each board,
    // if the board doesnt have an ID, create it and then add it to the project
    req.body.newBoards.forEach(async (board) => {
      if (board.id.length === 0) {
        const addNewProjectBoard = await states.create({
          stateName: board.stateName,
          position: board.position,
        });
        await projects.findByIdAndUpdate(
          { _id: req.body.projectID },
          { $push: { projectStateIDs: addNewProjectBoard._id } }
        );
      }

      if (board.delete) {
        await tasks.deleteMany({ stateID: board.id }).then(async () => {
          await states.findOneAndDelete({ _id: board.id });
        });
      }
    });

    //deletes every user id
    await projects.findOneAndUpdate(
      {
        _id: req.body.projectID,
      },
      { $set: { members: [] } }
    );

    //adds every user from the "newMembersArray"
    req.body.newMembers.forEach(async (member) => {
      await projects.findByIdAndUpdate(
        { _id: req.body.projectID },
        { $addToSet: { members: member.id } }
      );
    });

    res.status(200).json({ title: "Board successfully updated" });
  } catch (error) {
    console.log(error.message);
  }
});

app.delete("/deleteProject", verifyToken, async (req, res) => {
  const id = req.body.projectID;
  try {
    await deleteProject(id);
    return res.status(200).json({ message: "Deleted project!" });
  } catch (error) {
    console.log(error.message);
    return res
      .status(500)
      .json({ error: "Internal server error", message: error.message });
  }
});

app.post("/updateStatesPos", verifyToken, async (req, res) => {
  try {
    const statesToUpdate = req.body;
    for (const currentState of statesToUpdate) {
      await states.findOneAndUpdate(
        { _id: currentState.ID },
        { position: currentState.position }
      );
    }

    return res.status(200).json({ message: "States updated successfully" });
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Internal server error:", message: err.message });
  }
});

module.exports = app;
