import express from "express";
import auth from "./auth";
import productRouter from "./products";

const router = express.Router();

router.use("/auth", auth);
router.use("/products", productRouter);

export default router;
