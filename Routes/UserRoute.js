const { registerValidation, loginValidation } = require("../validation");
const express = require("express");
const app = express();
const user = require("../Models/userModel");
const org = require("../Models/OrganizationModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { deleteOrg } = require("../services/dbHelper");

const { verifyToken } = require("../auth");

app.post("/register", async (req, res) => {
  const data = req.body;

  const { error } = registerValidation(data);

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const emailExists = await user.findOne({ email: data.email });
  if (emailExists) {
    return res.status(400).json({ error: "Email already exists" });
  }

  const usernameExists = await user.findOne({ username: data.username });
  if (usernameExists) {
    return res.status(400).json({ error: "Username already exists" });
  }

  const salt = await bcrypt.genSalt(10);
  const password = await bcrypt.hash(data.password, salt);

  const userColor = generateRandomHexColor();

  const userObj = new user({
    username: data.username,
    email: data.email,
    fName: data.fName,
    lName: data.lName,
    password,
    color: userColor,
  });

  try {
    const savedUser = await userObj.save();
    res.json({ error: null, userID: savedUser._id });
  } catch (error) {
    res.status(500).json({ error });
  }
});

app.post("/update-user", verifyToken, async (req, res) => {
  const token = req.cookies["auth-token"];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const data = req.body;

  try {
    const decoded = jwt.verify(token, process.env.SECRET);
    const userID = decoded.id;

    const foundUser = await user.findById(userID).select("-password");

    if (!foundUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!data.fName && !data.lName && !data.color && !data.password) {
      return res.status(404).json({
        message:
          "No valid parameters provided, allowed: fName, lName, color, password",
      });
    }

    if (data.fName) {
      foundUser.fName = data.fName;
    }

    if (data.lName) {
      foundUser.lName = data.lName;
    }

    if (data.color) {
      foundUser.color = data.color;
    }

    if (data.password) {
      const salt = await bcrypt.genSalt(10);
      const password = await bcrypt.hash(data.password, salt);
      foundUser.password = password;
    }

    await foundUser.save();

    res.json({ message: "User updated successfully" });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: err });
  }
});

app.delete("/delete", verifyToken, async (req, res) => {
  const token = req.cookies["auth-token"];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET);
    const userID = decoded.id;

    let ownedOrgs = await org.find({ ownerID: userID });

    for (const organization of ownedOrgs) {
      let newOwnerID = organization.ownerID.filter((id) => id !== userID);
      let newCreatedByID = null;

      if (newOwnerID.length > 0) {
        newCreatedByID = newOwnerID[0];
      } else if (organization.orgMembers.length > 0) {
        newCreatedByID = organization.orgMembers[0].userID;
        newOwnerID = [organization.orgMembers[0].userID];
      } else {
        // TODO delete the org
        const ownedOrgsIDs = ownedOrgs.map((o) => o._id.toString());
        for (const orgID of ownedOrgsIDs) {
          await deleteOrg(orgID);
        }
        continue; // Skip to the next organization
      }

      await org.updateOne(
        { _id: organization._id },
        {
          $set: {
            createdByID: newCreatedByID,
            ownerID: newOwnerID,
          },
        }
      );
    }

    await user.findByIdAndDelete(userID);

    return res.status(200).json({
      message: `User deleted, and changed ${ownedOrgs.length} organizations`,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: err.message });
  }
});

// app.get("/findByEmail/:email", async (req, res) => {
//   try {
//     const data = {
//       email: req.params.email,
//     };

//     console.log(data);

//     await user
//       .find({ email: req.params.email })
//       .then((data) => {
//         console.log("user: ", data);
//         res.status(200).send(data);
//       })
//       .catch((err) => {
//         res.status(500).send({ message: err.message });
//       })
//       .finally(() => {
//         console.log("request completed");
//       });
//   } catch (error) {
//     res.status(500).json({
//       Title: "Something went wrong with getting user from email",
//       Message: error.message,
//     });
//   }
// });

app.get("/find-user", verifyToken, async (req, res) => {
  const token = req.cookies["auth-token"];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET);
    const userID = decoded.id;

    const foundUser = await user.findById(userID).select("-password");

    if (!foundUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const userToReturn = {
      id: foundUser._id,
      username: foundUser.username,
      email: foundUser.email,
      fName: foundUser.fName,
      lName: foundUser.lName,
      color: foundUser.color,
    };

    return res.status(200).json(userToReturn);
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: err });
  }
});

app.get("/logout", (req, res) => {
  res.cookie("auth-token", "", {
    httpOnly: true,
    secure: true,
    domain: "localhost",
    path: "/",
    sameSite: "none",
    expires: new Date(0), // Set the expiration to a past date
  });
  res.send("Logged out");
});

app.post("/login", async (req, res) => {
  try {
    const data = req.body;

    const { error } = loginValidation(data);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // do not check for case sensitivity for login username/email field
    const userFound = await user.findOne({
      $or: [
        {
          email: { $regex: new RegExp("^" + data.emailOrUsername + "$", "i") },
        },
        {
          username: {
            $regex: new RegExp("^" + data.emailOrUsername + "$", "i"),
          },
        },
      ],
    });

    const loginDetailsNotMatchingString =
      "Username/email and password does not match";

    if (!userFound) {
      return res.status(400).json({ error: loginDetailsNotMatchingString });
    }

    const validPassword = bcrypt.compare(data.password, userFound.password);
    if (!validPassword) {
      return res.status(400).json({ error: loginDetailsNotMatchingString });
    }

    const token = jwt.sign(
      {
        username: userFound.username,
        email: userFound.email,
        id: userFound._id,
      },
      process.env.SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.cookie("auth-token", token, {
      httpOnly: true,
      secure: true,
      domain: "localhost",
      path: "/",
      sameSite: "none",
    });
    res.cookie("user", userFound._id);

    res.header("auth-token", token).json({
      error: null,
      data: {
        id: userFound._id,
        fName: userFound.fName,
        lName: userFound.lName,
        color: userFound.color,
        email: userFound.email,
        username: userFound.username,
      },
    });
  } catch (error) {
    res.status(500).json({
      Title: "Something went wrong when getting user",
      Message: error.message,
    });
  }
});

const generateRandomHexColor = () => {
  const hexString = Math.floor(Math.random() * 16777215).toString(16);
  const paddedHexString = hexString.padStart(6, "0");
  return "#" + paddedHexString;
};

module.exports = app;
