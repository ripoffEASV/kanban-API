const express = require("express");
const app = express();
const orgs = require("../Models/OrganizationModel");
const user = require("../Models/userModel");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

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

    if (foundOrg.ownerID !== data.ownerID) {
        const newOwner = await user.findOne({ 
          email: { $regex: new RegExp("^" + data.ownerID + "$", "i") }
        });

        if (!newOwner) {
          return res.status(404).send("New owner not found.");
        }

        data.ownerID = newOwner._id;
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
          let: { ownerId: "$ownerID" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", { $toObjectId: "$$ownerId" }] },
              },
            },
            {
              $project: { _id: 0, password: 0 }, // Exclude the password field
            },
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
              $project: { _id: 0, password: 0 }, // Exclude the password field
            },
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
              $project: { password: 0 }, // Exclude the password field
            },
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



module.exports = app;
