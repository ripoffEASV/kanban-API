const mongoose = require("mongoose");

mongoose.connect(process.env.DB_URI);
const express = require("express");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

const authenticateUser = (req, res, next) => {
  try {
    if (
      req.session &&
      req.session.id &&
      req.session.email &&
      req.session.token
    ) {
      // If authenticated, extract user information from session
      const userId = req.session.id;
      const userEmail = req.session.email;
      const userToken = req.session.token;

      console.log("new request");

      // Attach user information to the request object
      req.session.user.push({ id: userId, email: userEmail, token: userToken });
    }

    next();
  } catch (error) {
    console.log(error);
  }
};

// Use the middleware in your routes
//app.use(authenticateUser);

const store = new MongoDBStore({
  uri: process.env.DB_URI,
  collection: "sessions",
});
app.use(
  session({
    secret: "secret string",
    resave: false,
    saveUninitialized: false,
    store: store /* store session data in mongodb */,
    cookie: {
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 2, // Set your desired session expiration time
      /* can add cookie related info here */
    },
  })
);

app.use((req, res, next) => {
  console.log("request recieved: ", req.session);
  if (!Array.isArray(req.session.user)) {
    req.session.user = [];
  }
  next();
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;

//Define routes
const organizationRoute = require("./Routes/OrganizationRoute");
const projectRoute = require("./Routes/ProjectRoute");
const stateRoute = require("./Routes/StateRoute");
const taskRoute = require("./Routes/TaskRoute");
const userRoute = require("./Routes/UserRoute");

app.use("/api/organizations", organizationRoute);
// app.use(projectRoute);
// app.use(stateRoute);
// app.use(taskRoute);
app.use("/api/users", userRoute);

app.listen(PORT, async (req, res) => {
  console.log("Server Listening on PORT:", PORT);
  //await isConnected();
});
