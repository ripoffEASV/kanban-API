const mongoose = require('mongoose');
const Organization = require("../Models/OrganizationModel");
const Project = require("../Models/ProjectModel");
const State = require("../Models/StateModel");
const Task = require("../Models/TaskModel");

async function deleteOrg(id) {
  try {
    const orgToDelete = await Organization.findByIdAndDelete(id)
    for (const projectID of orgToDelete?.projectIDs) {
      await deleteProject(projectID);
    }
  } catch (error) {
    throw new Error(error.message);
  }
}

async function deleteProject(id) {
  try {
    const project = await Project.findById(id);
    if (!project) {
      throw new Error('Project not found');
    }

    for (const boardID of project.projectStateIDs) {
      try {
        await deleteState(boardID);
      } catch (err) {
        console.error(`Error deleting tasks or state for board ${boardID}: ${err.message}`);
      }
    }

    await Project.findByIdAndDelete(id);
  } catch (error) {
    throw new Error(error.message);
  }
}

async function deleteState(id) {
  try {
    await State.deleteMany({ _id: id });
    await Task.deleteMany({ stateID: id });
  } catch (error) {
    throw new Error(error.message);
  }
}

module.exports = { deleteOrg, deleteProject, deleteState };