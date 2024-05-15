const mongoose = require('mongoose');
const Organization = require("../Models/OrganizationModel");
const Project = require("../Models/ProjectModel");
const State = require("../Models/StateModel");
async function deleteOrg(id) {
 console.log(id);
}

async function deleteProject(id) {
  console.log(id);
}

async function deleteState(id) {
  console.log(id);
}

module.exports = { deleteOrg };