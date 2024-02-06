const mongoose = require("mongoose");
const DB_USER = process.env.DB_USER;
const DB_PASS = process.env.DB_PASS;

console.log(DB_USER, DB_PASS, "");

const uri =
  "mongodb+srv://" +
  DB_USER +
  ":" +
  DB_PASS +
  "@cluster0.emxb89l.mongodb.net/?retryWrites=true&w=majority";

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

app.use(cors());

const PORT = process.env.PORT || 3000;

//Define routes
const organizationRoute = require("./Routes/OrganizationRoute");
const projectRoute = require("./Routes/ProjectRoute");
const stateRoute = require("./Routes/StateRoute");
const taskRoute = require("./Routes/TaskRoute");
const userRoute = require("./Routes/UserRoute");

mongoose.connect(uri);

// app.use(organizationRoute);
// app.use(projectRoute);
// app.use(stateRoute);
// app.use(taskRoute);
app.use(userRoute);

app.listen(PORT, async () => {
  console.log("Server Listening on PORT:", PORT);
  //await isConnected();
});
