// server.js
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const session = require("express-session");

const app = express();

// -------------------- MIDDLEWARE --------------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ⭐ SESSION SETUP
app.use(
  session({
    secret: "secretkey123",
    resave: false,
    saveUninitialized: false,
  })
);

// ⭐ SERVE STATIC FILES
app.use(express.static(path.join(__dirname, "public")));

// -------------------- MONGODB CONNECTION --------------------
const MONGO_URI = "mongodb://127.0.0.1:27017/myappdb";

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Ensure connection before proceeding
mongoose.connection.once("open", () => {
  console.log("MongoDB connection ready");
});

// -------------------- SCHEMAS & MODELS --------------------
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});
const User = mongoose.model("User", userSchema);

const courseSchema = new mongoose.Schema({
  studentName: { type: String, required: true },
  studentID: { type: String, required: true },
  courseName: { type: String, required: true },
  courseID: { type: String, required: true },
  email: { type: String, required: true },
});
const Course = mongoose.model("Course", courseSchema);

// -------------------- ROUTES --------------------

// REGISTER
app.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.send(`
        <script>
          alert("User with this email already exists!");
          window.location.href = "/register.html";
        </script>
      `);
    }

    const hashed = await bcrypt.hash(password, 10);

    await User.create({
      username,
      email,
      password: hashed,
    });

    res.send(`
      <script>
        alert("Registration Successful!");
        window.location.href = "/login.html";
      </script>
    `);
  } catch (err) {
    console.error(err);
    res.send(`
      <script>
        alert("Error occurred during registration!");
        window.location.href = "/register.html";
      </script>
    `);
  }
});

// LOGIN
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.send(`
        <script>
          alert("User not found!");
          window.location.href = "/login.html";
        </script>
      `);

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.send(`
        <script>
          alert("Incorrect Password!");
          window.location.href = "/login.html";
        </script>
      `);

    // STORE SESSION
    req.session.userEmail = email;

    res.send(`
      <script>
        alert("Login Successful!");
        window.location.href = "/dashboard.html";
      </script>
    `);
  } catch (err) {
    console.error(err);
    res.send(`
      <script>
        alert("Error occurred during login!");
        window.location.href = "/login.html";
      </script>
    `);
  }
});

// SAVE COURSE
app.post("/save-course", async (req, res) => {
  if (!req.session.userEmail) {
    return res.send(`
      <script>
        alert("You must login first!");
        window.location.href="/login.html";
      </script>
    `);
  }

  try {
    const { studentName, studentID, courseName, courseID } = req.body;

    await Course.create({
      studentName,
      studentID,
      courseName,
      courseID,
      email: req.session.userEmail,
    });

    res.send(`
      <script>
        alert("Course Registered Successfully!");
        window.location.href = "/courses.html";
      </script>
    `);
  } catch (err) {
    console.error(err);
    res.send(`
      <script>
        alert("Error occurred while saving course!");
        window.location.href = "/courses.html";
      </script>
    `);
  }
});

// GET MY COURSES
app.get("/my-courses", async (req, res) => {
  if (!req.session.userEmail) return res.json([]);

  try {
    const courses = await Course.find({ email: req.session.userEmail });
    res.json(courses);
  } catch (err) {
    console.error(err);
    res.json([]);
  }
});

// LOGOUT
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/index.html");
  });
});

// -------------------- START SERVER --------------------
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
