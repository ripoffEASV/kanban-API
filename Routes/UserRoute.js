const { registerValidation, loginValidation } = require("../validation");
const express = require("express");
const app = express();
const user = require("../Models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const verifyToken = require("../auth");

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

app.get("/", (req, res) => {
  user
    .find({})
    .then((data) => {
      console.log("test: ", data);
      res.status(200).send(data);
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    })
    .finally(() => {
      console.log("request completed");
    });
});

app.get("/findByEmail/:email", async (req, res) => {
  try {
    const data = {
      email: req.params.email,
    };

    console.log(data);

    await user
      .find({ email: req.params.email })
      .then((data) => {
        console.log("user: ", data);
        res.status(200).send(data);
      })
      .catch((err) => {
        res.status(500).send({ message: err.message });
      })
      .finally(() => {
        console.log("request completed");
      });
  } catch (error) {
    res.status(500).json({
      Title: "Something went wrong with getting user from email",
      Message: error.message,
    });
  }
});

app.get("/logout/:token", async (req, res) => {
  const token = req.params.token.split(" ")[1];

  //Delete stored user if logging in twice
  req.session.user.forEach((element, index) => {
    console.log(element, index);
    if (element.token == token) {
      console.log("match");
      //req.session.user.splice(index, 1);
    }
  });

  res.status(200).json({ message: "successfully logged out" });
});

app.post("/login", async (req, res) => {
  try {
    const data = req.body;

    const { error } = loginValidation(data);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // const userFound = await user.findOne({
    //   $or: [
    //     {
    //       email: { $regex: new RegExp("^" + data.emailOrUsername + "$", "i") },
    //     },
    //     {
    //       username: {
    //         $regex: new RegExp("^" + data.emailOrUsername + "$", "i"),
    //       },
    //     },
    //   ],
    // });

    // Regex didnt work for me when trying to log in
    const userFound = await user.findOne({
      $or: [
        {
          email: data.emailOrUsername,
        },
        {
          username: data.emailOrUsername,
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
      data: { token },
    });
  } catch (error) {
    res.status(500).json({
      Title: "Something went wrong when getting user",
      Message: error.message,
    });
  }
});

// Function to find and delete an item from the array
const deleteItemById = (array, itemId) => {
  const index = array.findIndex((item) => item.id === itemId);

  if (index !== -1) {
    // If the item is found, remove it from the array
    array.splice(index, 1);
  }
};

const generateRandomHexColor = () => {
  const hexString = Math.floor(Math.random() * 16777215).toString(16);
  const paddedHexString = hexString.padStart(6, "0");
  return "#" + paddedHexString;
};

module.exports = app;
