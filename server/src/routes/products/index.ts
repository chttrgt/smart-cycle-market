import { Router } from "express";
import {
  AddNewProduct,
  DeleteProduct,
  UpdateProduct,
  DeleteProductImage,
  GetProductDetails,
  GetProductsByCategory,
  GetListings,
  GetLatestProducts,
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
productRouter.delete("/image/:proId/:imgId", isAuth, DeleteProductImage);
productRouter.get("/detail/:id", GetProductDetails);
productRouter.get("/by-category/:category", GetProductsByCategory);
productRouter.get("/latest", GetLatestProducts);
productRouter.get("/listings", isAuth, GetListings);

export default productRouter;
