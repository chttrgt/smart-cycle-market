import { UploadApiResponse } from "cloudinary";
import { RequestHandler } from "express";
import { isValidObjectId } from "mongoose";
import cloudUploader, { cloudApi } from "src/cloud";
import ProductModel from "src/models/product";
import { UserDocument } from "src/models/user";
import categories from "src/utils/categories";
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
    const oldImages = product?.images?.length || 0;
    if (oldImages + images.length > 5) {
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

    if (product.images) product.images.push(...newImages);
    else product.images = newImages;
  } else {
    if (images) {
      const { secure_url, public_id } = await uploadImage(images.filepath);
      if (product.images)
        product.images.push({ url: secure_url, id: public_id });
      else product.images = [{ url: secure_url, id: public_id }];
    }
  }

  await product.save();
  res.json({ message: "Product updated" });
};
//#endregion

//#region DELETE PRODUCT
const DeleteProduct: RequestHandler = async (req, res) => {
  const productId = req.params.id;
  if (!isValidObjectId(productId))
    return sendErrorRes(res, "Invalid product id", 422);

  const product = await ProductModel.findOneAndDelete({
    _id: productId,
    owner: req.user.id,
  });

  if (!product) return sendErrorRes(res, "Product not found", 404);

  const images = product.images || [];
  if (images.length > 0) {
    const publicIds = images.map((img) => img.id);
    await cloudApi.delete_resources(publicIds);
  }

  res.json({ message: "Product deleted" });
};
//#endregion

//#region DELETE PRODUCT IMAGE
const DeleteProductImage: RequestHandler = async (req, res) => {
  const { proId, imgId } = req.params;
  if (!isValidObjectId(proId) || !isValidObjectId(imgId))
    return sendErrorRes(res, "Invalid product or image id", 422);

  const product = await ProductModel.findOneAndUpdate(
    {
      _id: proId,
      owner: req.user.id,
    },
    {
      $pull: { images: { id: imgId } },
    },
    {
      new: true,
    }
  );

  if (!product) return sendErrorRes(res, "Product not found", 404);

  if (product.thumbnail?.includes(imgId)) {
    const images = product.images;
    if (images) product.thumbnail = images[0].url;
    await product.save();
  }

  await cloudUploader.destroy(imgId);
  res.json({ message: "Image deleted" });
};
//#endregion

//#region GET PRODUCT DETAILS
const GetProductDetails: RequestHandler = async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) return sendErrorRes(res, "Invalid product id", 422);
  const product = await ProductModel.findById(id).populate<{
    owner: UserDocument;
  }>("owner");
  if (!product) return sendErrorRes(res, "Product not found", 404);
  res.json({
    product: {
      id: product._id,
      name: product.name,
      description: product.description,
      thumbnail: product.thumbnail,
      category: product.category,
      date: product.purchasingDate,
      price: product.price,
      images: product.images?.map((img) => img.url),
      seller: {
        id: product.owner._id,
        name: product.owner.name,
        avatar: product.owner.avatar?.url,
      },
    },
  });
};
//#endregion

//#region GET PRODUCTS By CATEGORY
const GetProductsByCategory: RequestHandler = async (req, res) => {
  const { category } = req.params;
  const { pageNo = "1", limit = "10" } = req.query as {
    pageNo: string;
    limit: string;
  };
  if (!categories.includes(category)) {
    return sendErrorRes(res, "Invalid category", 422);
  }

  const products = await ProductModel.find({ category })
    .sort({ createdAt: -1 })
    .skip((parseInt(pageNo) - 1) * parseInt(limit))
    .limit(parseInt(limit));
  const listings = products.map((p) => {
    return {
      id: p._id,
      name: p.name,
      thumbnail: p.thumbnail,
      category: p.category,
      price: p.price,
    };
  });

  res.json({ products: listings });
};
//#endregion

//#region GET LISTINGS
const GetListings: RequestHandler = async (req, res) => {
  const { pageNo = "1", limit = "10" } = req.query as {
    pageNo: string;
    limit: string;
  };

  const products = await ProductModel.find({ owner: req.user.id })
    .sort({ createdAt: -1 })
    .skip((parseInt(pageNo) - 1) * parseInt(limit))
    .limit(parseInt(limit));

  const listings = products.map((p) => {
    return {
      id: p._id,
      name: p.name,
      thumbnail: p.thumbnail,
      category: p.category,
      price: p.price,
      image: p.images?.map((img) => img.url),
      date: p.purchasingDate,
      description: p.description,
      seller: {
        id: req.user.id,
        name: req.user.name,
        avatar: req.user.avatar,
      },
    };
  });

  res.json({ products: listings });
};
//#endregion

//#region GET LATEST PRODUCTS
const GetLatestProducts: RequestHandler = async (req, res) => {
  const products = await ProductModel.find().sort({ createdAt: -1 }).limit(10);
  const listings = products.map((p) => {
    return {
      id: p._id,
      name: p.name,
      thumbnail: p.thumbnail,
      category: p.category,
      price: p.price,
    };
  });

  res.json({ products: listings });
};
//#endregion

export {
  AddNewProduct,
  UpdateProduct,
  DeleteProduct,
  DeleteProductImage,
  GetProductDetails,
  GetProductsByCategory,
  GetListings,
  GetLatestProducts,
};
