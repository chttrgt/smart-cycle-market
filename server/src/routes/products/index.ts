import { Router } from "express";
import {
  AddNewProduct,
  DeleteProduct,
  UpdateProduct,
} from "src/controllers/products";
import { isAuth } from "src/middlewares/auth";
import fileParser from "src/middlewares/fileParser";
import validator from "src/middlewares/validator";
import { newProductSchema } from "src/utils/validationSchema";

const productRouter = Router();

productRouter.post(
  "/list",
  isAuth,
  fileParser,
  validator(newProductSchema),
  AddNewProduct
);

productRouter.patch(
  "/:id",
  isAuth,
  fileParser,
  validator(newProductSchema),
  UpdateProduct
);

productRouter.delete("/:id", isAuth, DeleteProduct);

export default productRouter;
