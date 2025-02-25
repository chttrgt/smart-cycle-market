import { UploadApiResponse } from "cloudinary";
import { RequestHandler } from "express";
import { isValidObjectId } from "mongoose";
import cloudUploader, { cloudApi } from "src/cloud";
import ProductModel from "src/models/product";
import { sendErrorRes } from "src/utils/helper";

const uploadImage = (filepath: string): Promise<UploadApiResponse> => {
  return cloudUploader.upload(filepath, {
    width: 1280,
    height: 720,
    crop: "fill",
  });
};

//#region ADD NEW PRODUCT
const AddNewProduct: RequestHandler = async (req, res) => {
  const { name, price, category, description, purchasingDate } = req.body;
  const newProduct = new ProductModel({
    owner: req.user.id,
    name,
    price,
    category,
    description,
    purchasingDate,
  });
  const { images } = req.files;
  const isMultipleImages = Array.isArray(images);

  if (isMultipleImages && images.length > 5) {
    return sendErrorRes(res, "You can upload a maximum of 5 images", 422);
  }

  let invalidFileType = false;
  if (isMultipleImages) {
    for (let img of images) {
      if (!img.mimetype?.startsWith("image")) {
        invalidFileType = true;
        break;
      }
    }
  } else {
    if (!images.mimetype?.startsWith("image")) {
      invalidFileType = true;
    }
  }

  if (invalidFileType) return sendErrorRes(res, "Invalid file type", 422);

  if (isMultipleImages) {
    const uploadPromise = images.map((file) => uploadImage(file.filepath));
    const uploadResults = await Promise.all(uploadPromise);
    newProduct.images = uploadResults.map(({ secure_url, public_id }) => {
      return { url: secure_url, id: public_id };
    });

    newProduct.thumbnail = newProduct.images[0].url;
  } else {
    if (images) {
      const { secure_url, public_id } = await uploadImage(images.filepath);
      newProduct.images = [{ url: secure_url, id: public_id }];
      newProduct.thumbnail = secure_url;
    }
  }

  await newProduct.save();
  res.status(201).json({ message: "Added new Product" });
};
//#endregion

//#region UPDATE PRODUCT
const UpdateProduct: RequestHandler = async (req, res) => {
  const { name, price, category, description, purchasingDate, thumbnail } =
    req.body;
  const productId = req.params.id;
  console.log(productId);
  if (!isValidObjectId(productId))
    return sendErrorRes(res, "Invalid product id", 422);

  const product = await ProductModel.findOneAndUpdate(
    {
      _id: productId,
      owner: req.user.id,
    },
    {
      name,
      price,
      category,
      description,
      purchasingDate,
    },
    {
      new: true,
    }
  );

  if (!product) return sendErrorRes(res, "Product not found", 404);

  if (typeof thumbnail === "string") product.thumbnail = thumbnail;

  const { images } = req.files;
  const isMultipleImages = Array.isArray(images);
  if (isMultipleImages) {
    if (product.images.length + images.length > 5) {
      return sendErrorRes(res, "You can upload a maximum of 5 images", 422);
    }
  }

  let invalidFileType = false;
  if (isMultipleImages) {
    for (let img of images) {
      if (!img.mimetype?.startsWith("image")) {
        invalidFileType = true;
        break;
      }
    }
  } else {
    if (!images.mimetype?.startsWith("image")) {
      invalidFileType = true;
    }
  }

  if (invalidFileType) return sendErrorRes(res, "Invalid file type", 422);

  if (isMultipleImages) {
    const uploadPromise = images.map((file) => uploadImage(file.filepath));
    const uploadResults = await Promise.all(uploadPromise);
    const newImages = uploadResults.map(({ secure_url, public_id }) => {
      return { url: secure_url, id: public_id };
    });

    product.images.push(...newImages);
  } else {
    if (images) {
      const { secure_url, public_id } = await uploadImage(images.filepath);
      product.images.push({ url: secure_url, id: public_id });
    }
  }

  await product.save();
  res.json({ message: "Product updated" });
};
//#endregion

//# region DELETE PRODUCT
const DeleteProduct: RequestHandler = async (req, res) => {
  const productId = req.params.id;
  if (!isValidObjectId(productId))
    return sendErrorRes(res, "Invalid product id", 422);

  const product = await ProductModel.findOneAndDelete({
    _id: productId,
    owner: req.user.id,
  });

  if (!product) return sendErrorRes(res, "Product not found", 404);

  const images = product.images;
  if (images.length > 0) {
    const publicIds = images.map((img) => img.id);
    await cloudApi.delete_resources(publicIds);
  }

  res.json({ message: "Product deleted" });
};
//#endregion

export { AddNewProduct, UpdateProduct, DeleteProduct };
