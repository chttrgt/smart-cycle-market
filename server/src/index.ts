import "express-async-errors";
import "src/db";
import "dotenv/config";
import express, { ErrorRequestHandler } from "express";
import mainRouter from "./routes";

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("src/public"));

// API Requests
app.use("/api", mainRouter);

// Error Handler Middleware
app.use(function (err, req, res, next) {
  res.status(500).json({ message: err.message });
} as ErrorRequestHandler);

// Start the server
app.listen(8000, () => {
  console.log("Server is running on port 8000");
});
