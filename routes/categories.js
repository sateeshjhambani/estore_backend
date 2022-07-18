const { Category } = require('../models/category');
const express = require('express');
const router = express.Router();

// get all categories
router.get(`/`, async (req, res) => {
    const categoryList = await Category.find();

    if (!categoryList) {
        res.status(500).json({ success: false });
    }
    res.status(200).send(categoryList);
});

// get a category
router.get('/:id', async (req, res) => {
    const category = await Category.findById(req.params.id);
    if (!category) {
        return res
            .status(404)
            .json({ message: 'the category with the given id was not found' });
    }
    res.status(200).send(category);
});

// create a category
router.post('/', async (req, res) => {
    let category = new Category({
        name: req.body.name,
        icon: req.body.icon,
        color: req.body.color,
    });

    category = await category.save();

    if (!category)
        return res.status(400).send('the category cannot be created!');

    res.send(category);
});

// delete a category
router.delete('/:id', (req, res) => {
    Category.findByIdAndRemove(req.params.id)
        .then((deletedCategory) => {
            if (deletedCategory) {
                return res.status(200).json({
                    success: true,
                    message: 'the category is deleted',
                });
            } else {
                return res.status(404).json({
                    success: false,
                    message: 'the category was not found',
                });
            }
        })
        .catch((err) => {
            return res.status(400).json({ success: false, message: err });
        });
});

// update a category
router.put('/:id', async (req, res) => {
    const category = await Category.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            icon: req.body.icon,
            color: req.body.color,
        },
        {
            new: true,
        }
    );

    if (!category)
        return res.status(400).send('the category cannot be updated!');

    res.send(category);
});

module.exports = router;
