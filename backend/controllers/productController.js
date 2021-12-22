const Product = require("../models/productModel");
const ErrorHandler = require("../utils/errorHandler")
const catchAsyncErrors = require('../middleware/catchAsyncErrors')
const ApiFeatures = require("../utils/apifeatures");

// create product -- admin
exports.createProduct = catchAsyncErrors(async (req, res, next) => {

    req.body.user = req.user.id
    const product = await Product.create(req.body)
    res.status(200).send({ status: true, product })
})


//getting all product
exports.getAllProducts = catchAsyncErrors(async (req, res) => {

    const resultPerPage = 8;
    const productCount = await Product.countDocuments();
    const apiFeature = new ApiFeatures(Product.find(), req.query)
        .search()
        .filter()
        .pagination(resultPerPage);
    // const products = await Product.find()
    const products = await apiFeature.query;
    res.status(200).json({ status: true, products, productCount });

    // let products = await apiFeature.query;

    // let filteredProductsCount = products.length;

    // apiFeature.pagination(resultPerPage);

    // products = await apiFeature.query;

    // res.status(200).json({ status: true, products, productCount,resultPerPage, filteredProductsCount});
})

//update product -- admin

exports.updateProduct = catchAsyncErrors(async (req, res, next) => {
    let product = Product.findById(req.params.id);
    if (!product) {
        return res.status(500).send({ success: false, message: "Product not found" })
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true, useFindAndModify: false })

    res.status(200).send({ success: true, product })
})

//delete Product
exports.deleteProduct = catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.params.id)
    // if (!product) {
    //     return res.status(404).send({ success: false, message: "product not found" })
    // }
    if (!product) {
        return next(new ErrorHandler("Product not found", 404))
    }
    await product.remove();
    res.status(200).json({
        success: true,
        message: "product deleted successfully"
    })
})

// Get all products admin
exports.getAdminProducts = catchAsyncErrors(async (req, res, next) => {
    const products = await Product.find();
  
    res.status(200).json({
      success: true,
      products,
    });
  });

//Get Product Details
exports.getProductDetails = catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.params.id)
    if (!product) {
        // return res.status(404).send({success:false,message:"product not found"})
        return next(new ErrorHandler("Product not found", 404))
    }

    res.status(200).json({
        success: true,
        product
    })
})

// create new review or update the review
exports.createProductReview = catchAsyncErrors(async (req, res, next) => {

    const { rating, comment, productId } = req.body
    const review = {
        user: req.user._id,
        name: req.user.name,
        rating: Number(rating),
        comment
    }

    const product = await Product.findById(productId)

    const isReviewed = product.reviews.find((rev) => rev.user.toString() === req.user._id.toString())

    if (isReviewed) {
        product.reviews.forEach((rev) => {
            if (rev.user.toString() === req.user._id.toString()) {
                rev.rating = rating
                rev.comment = comment
            }
        })
    } else {
        product.reviews.push(review)
        product.numOfReviews = product.reviews.length
    }

    let avg = 0;

    product.reviews.forEach((rev) => {
        avg += rev.rating;
    });

    product.ratings = avg / product.reviews.length;

    await product.save({ validateBeforeSave: false });
    res.status(200).json({
        success: true
    })
})

// Get all reviews of a product
exports.getProductReviews = catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.query.id)

    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    res.status(200).json({
        success: true,
        reviews: product.reviews
    })
})


exports.deleteReview = catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.query.productId)

    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    const reviews = product.reviews.filter((rev) => rev._id.toString() !== req.query.id.toString())

    let avg = 0;
    reviews.forEach((rev) => {
        avg += rev.rating
    })

    let ratings = 0

    if (reviews.length === 0) {
        ratings = 0;
    } else {
        ratings = avg / reviews.length;
    }

    const numOfReviews = reviews.length;

    await Product.findByIdAndUpdate(req.query.productId, {
        reviews,
        ratings,
        numOfReviews
    }, { new: true, runValidators: true, useFindAndModify: false })

    res.status(200).json({
        success: true,
    })


})