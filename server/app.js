const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

const authRoutes = require("./routes/auth");
const detectorRoutes = require("./controller/detection")

dotenv.config();

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO, {})
  .then(() => console.log("MongoDB connected"))
  .catch((error) => console.log("MongoDB connection error:", error));


app.use(authRoutes);
app.use(detectorRoutes)

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
