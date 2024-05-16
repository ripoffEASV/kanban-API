const express = require("express");
const app = express();
const orgs = require("../Models/OrganizationModel");
const user = require("../Models/userModel");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { deleteProject } = require('../services/dbHelper');

const { verifyToken, verifyUserHasUpdatePrivilege } = require("../auth");

app.post("/addNewOrganization", verifyToken, async (req, res) => {
  try {
    let data = req.body;

    data.createdByID = req.user.id;

    if (!data.ownerID) {
      data.ownerID = req.user.id;
    }

    await orgs
      .insertMany(data)
      .then((result) => {
        res.status(200).json({ message: "Organization created", org: result });
      })
      .catch((err) => {
        res.status(500).send({
          message: "There was an error adding a new Organization",
          error: err.message,
        });
      });
  } catch (error) {
    console.log(error.message);
  }
});

app.post("/updateOrganization/:orgID", verifyUserHasUpdatePrivilege, async (req, res) => {
  const { orgID } = req.params;
  const data = req.body;
  try {
    if (!mongoose.Types.ObjectId.isValid(orgID)) {
      return res.status(400).send("Invalid organization ID.");
    }

    const foundOrg = await orgs.findById(orgID);

    if (!foundOrg) {
      return res.status(404).send("Organization not found.");
    }

    const updatedOrg = await orgs.findByIdAndUpdate(
      orgID,
      { $set: data },
      { new: true, runValidators: true } // options to return the updated document and run schema validators
    );

    if (!updatedOrg) {
      return res.status(404).send("Organization not found.");
    }

    res.status(200).json({ message: "Organization updated successfully", organization: updatedOrg });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update the organization", error: error.message });
  }
})

app.get("/getOrganizationsFromID", verifyToken, async (req, res) => {
  try {

    const foundOrgs = await orgs.find({
      $or: [
        { createdByID: req.user.id },
        { ownerID: req.user.id },
        { "orgMembers.userID": req.user.id },
      ],
    });

    res.status(200).json({ organizations: foundOrgs });
  } catch (error) {
    console.error("Error in getOrganizationsFromID route:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/getSpecificOrg/:orgID", async (req, res) => {
  try {
    const organizationDetails = await orgs.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(req.params.orgID),
        },
      },
      {
        $lookup: {
          from: "users",
          let: { ownerId: "$ownerID" },  // 'ownerId' is an array of string representations of ObjectId
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: [ "$_id", { $map: { 
                                    input: "$$ownerId", 
                                    as: "idStr", 
                                    in: { $toObjectId: "$$idStr" } 
                                  } 
                                } ]
                }
              }
            },
            {
              $project: {
                id: "$_id", username: 1, email: 1, fName: 1, lName: 1, color: 1
              }
            },
            {
              $project: {
                password: 0, _id: 0
              }
            }
          ],
          as: "owner",
        },
      },
      {
        $lookup: {
          from: "users",
          let: { createdById: "$createdByID" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", { $toObjectId: "$$createdById" }] },
              },
            },
            {
              $project: { id: "$_id", username: 1, email: 1, fName: 1, lName: 1, color: 1 }
            },
            {
              $project: { password: 0, _id: 0 }
            }
          ],
          as: "createdByUser",
        },
      },
      {
        $lookup: {
          from: "users",
          let: { orgMemberUserIDs: "$orgMembers.userID" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: [
                    "$_id",
                    {
                      $map: {
                        input: "$$orgMemberUserIDs",
                        as: "id",
                        in: { $toObjectId: "$$id" },
                      },
                    },
                  ],
                },
              },
            },
            {
              $project: { id: "$_id", username: 1, email: 1, fName: 1, lName: 1, color: 1 }
            },
            {
              $project: { password: 0, _id: 0 }
            }
          ],
          as: "orgUsers",
        },
      },
    ]);
    
    


    res
      .status(200)
      .json({ message: "available Organization", org: organizationDetails });
  } catch (error) {
    console.error("Error in getSpecificOrg route:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/check-user-invites", verifyToken, async (req, res) => {
  const token = req.cookies['auth-token'];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET);
    const userEmail = decoded.email;

    const invitedOrgs = await orgs.find({
      inviteArray: { $in: [userEmail] }
    });

    const invitations = await Promise.all(invitedOrgs.map(async (inv) => {
      const ownerDetails = await user.findById(inv.ownerID);
      return {
        id: inv._id,
        orgName: inv.orgName,
        owner: ownerDetails ? {
          fName: ownerDetails.fName,
          lName: ownerDetails.lName,
          email: ownerDetails.email,
          color: ownerDetails.color
        } : null
      };
    }));

    return res.status(200).json(invitations);
  } catch (err) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
})

app.get("/accept-org-inv/:orgID", verifyToken, async (req, res) => {
  const token = req.cookies['auth-token'];
  const { orgID } = req.params;
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET);
    const userEmail = decoded.email;
    const org = await orgs.findById(orgID);
    if (!org) {
      return res.status(404).send("Organization not found.");
    }

    if (!org.inviteArray.includes(userEmail)) {
      return res.status(400).send("Invite not found in the organization.");
    }

    const userObj = await user.findOne({ email: userEmail });
    if (!userObj) {
      return res.status(404).send("User not found.");
    }

    org.inviteArray = org.inviteArray.filter(email => email !== userEmail);

    const newMember = { userID: userObj._id.toString() };
    org.orgMembers.push(newMember);

    await org.save();

    return res.status(200).json({ message: "Invitation accepted." });

  } catch (err) {
    return res.status(500).json({ message: "Internal Server Error", error: err });
  }
})

app.get("/decline-org-inv/:orgID", verifyToken, async (req, res) => {
  const token = req.cookies['auth-token'];
  const { orgID } = req.params;
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET);
    const userEmail = decoded.email;
    const org = await orgs.findById(orgID);
    if (!org) {
      return res.status(404).send("Organization not found.");
    }

    if (!org.inviteArray.includes(userEmail)) {
      return res.status(400).send("Invite not found in the organization.");
    }

    org.inviteArray = org.inviteArray.filter(email => email !== userEmail);
    await org.save();

    return res.status(200).json({ message: "Invitation declined." });

  } catch (err) {
    return res.status(500).json({ message: "Internal Server Error", error: err });
  }
})

app.get("/delete-org/:orgID", verifyToken, async (req, res) => {
  const token = req.cookies['auth-token'];
  const { orgID } = req.params;
  if (!token) {
    return res.status(401).json({ message: "Unauthorized"});
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET);
    const userID = decoded.id;
    const org = await orgs.findById(orgID);
    if (!org) {
      return res.status(404).send("Organization not found.");
    }

    if (!org.ownerID.includes(userID) && org.createdByID !== userID) {
      return res.status(403).json({ message: "Forbidden." });
    }

    for (const project of org.projectIDs) {
      await deleteProject(project);
    }

    const result = await orgs.findByIdAndDelete(orgID);
    if (result) {
      return res.status(200).json({ message: "Organization deleted successfully", data: result });
    } else {
      throw new Error("Failed to delete the organization");
    }
    
  } catch (err) {
    return res.status(500).json({ message: "Internal Server Error", error: err});
  }
})


module.exports = app;
