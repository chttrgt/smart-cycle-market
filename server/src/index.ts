import "src/db";
import express from "express";
import mainRouter from "./routes";

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Requests
app.use("/api", mainRouter);

// Start the server
app.listen(8000, () => {
  console.log("Server is running on port 8000");
});
