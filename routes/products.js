const { Product } = require('../models/product');
const { Category } = require('../models/category');
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');

const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg',
};

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const isValidFileType = FILE_TYPE_MAP[file.mimetype];
        let uploadError = new Error('invalid file type');

        if (isValidFileType) {
            uploadError = null;
        }

        cb(uploadError, 'public/uploads');
    },
    filename: function (req, file, cb) {
        const fileName = file.originalname.replace(' ', '-');
        const extension = FILE_TYPE_MAP[file.mimetype];
        cb(null, `${fileName}-${Date.now()}.${extension}`);
    },
});

const uploadOptions = multer({ storage: storage });

// get all products (optional: filter by categories using query params)
router.get(`/`, async (req, res) => {
    let filter = {};
    if (req.query.categories) {
        filter = { category: req.query.categories.split(',') };
    }

    // return select fields for the list request response
    // const productList = await Product.find().select('name image -_id'); // include name and image, exclude id

    const productList = await Product.find(filter).populate('category');

    if (!productList) {
        res.status(500).json({ success: false });
    }
    res.send(productList);
});

// get a product
router.get(`/:id`, async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).send('invalid product id');
    }
    const product = await Product.findById(req.params.id).populate('category');

    if (!product) {
        return res.status(500).json({ success: false });
    }

    res.send(product);
});

// create a product
router.post(`/`, uploadOptions.single('image'), async (req, res) => {
    const category = await Category.findById(req.body.category);
    if (!category) {
        return res.status(400).send('invalid category');
    }

    const file = req.file;
    if (!file) {
        return res.status(400).send('no image in the request');
    }

    const fileName = req.file.filename;
    const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;

    let product = new Product({
        name: req.body.name,
        description: req.body.description,
        richDescription: req.body.richDescription,
        image: `${basePath}${fileName}`,
        brand: req.body.brand,
        price: req.body.price,
        category: req.body.category,
        countInStock: req.body.countInStock,
        rating: req.body.rating,
        numReviews: req.body.numReviews,
        isFeatured: req.body.isFeatured,
    });

    product = await product.save();
    if (!product) {
        return res.status(500).send('the product cannot be created');
    }

    res.send(product);
});

// update a product
router.put('/:id', uploadOptions.single('image'), async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).send('invalid product id');
    }
    const category = await Category.findById(req.body.category);
    if (!category) {
        return res.status(400).send('invalid category');
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
        return res.status(400).send('invalid product');
    }

    const file = req.file;
    let imagePath;

    if (file) {
        const fileName = req.file.filename;
        const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
        imagePath = `${basePath}${fileName}`;
    } else {
        imagePath = product.image;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            description: req.body.description,
            richDescription: req.body.richDescription,
            image: imagePath,
            brand: req.body.brand,
            price: req.body.price,
            category: req.body.category,
            countInStock: req.body.countInStock,
            rating: req.body.rating,
            numReviews: req.body.numReviews,
            isFeatured: req.body.isFeatured,
        },
        {
            new: true,
        }
    );

    if (!updatedProduct)
        return res.status(400).send('the product cannot be updated!');

    res.send(updatedProduct);
});

// delete a product
router.delete('/:id', (req, res) => {
    Product.findByIdAndRemove(req.params.id)
        .then((deletedProduct) => {
            if (deletedProduct) {
                return res.status(200).json({
                    success: true,
                    message: 'the product is deleted',
                });
            } else {
                return res.status(404).json({
                    success: false,
                    message: 'the product was not found',
                });
            }
        })
        .catch((err) => {
            return res.status(400).json({ success: false, message: err });
        });
});

// get total product count
router.get(`/get/count`, async (req, res) => {
    const productCount = await Product.countDocuments();

    if (!productCount) {
        return res.status(500).json({ success: false });
    }

    res.send({ productCount: productCount });
});

// get featured products (limit by count)
router.get(`/get/featured/:count`, async (req, res) => {
    const count = req.params.count ? req.params.count : 0;
    const featuredProducts = await Product.find({ isFeatured: true }).limit(
        +count // parse string to number
    );

    if (!featuredProducts) {
        return res.status(500).json({ success: false });
    }

    res.send(featuredProducts);
});

// upload product gallery
router.put(
    '/gallery-images/:id',
    uploadOptions.array('images', 10),
    async (req, res) => {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).send('invalid product id');
        }

        const files = req.files;
        let imagePaths = [];
        const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
        if (files) {
            files.map((file) => {
                imagePaths.push(`${basePath}${file.filename}`);
            });
        }

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            {
                images: imagePaths,
            },
            {
                new: true,
            }
        );

        if (!product)
            return res.status(400).send('the product cannot be updated!');

        res.send(product);
    }
);

module.exports = router;
