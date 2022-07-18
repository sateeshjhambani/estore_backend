const { User } = require('../models/user');
const express = require('express');
const router = express.Router();
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');

// get users
router.get(`/`, async (req, res) => {
    const userList = await User.find().select('-passwordHash'); // exclude passwordHash

    if (!userList) {
        res.status(500).json({ success: false });
    }
    res.send(userList);
});

// get a user
router.get('/:id', async (req, res) => {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) {
        return res
            .status(404)
            .json({ message: 'the user with the given id was not found' });
    }
    res.status(200).send(user);
});

// create a user
router.post('/', async (req, res) => {
    let user = new User({
        name: req.body.name,
        email: req.body.email,
        passwordHash: bcryptjs.hashSync(req.body.password, 10),
        phone: req.body.phone,
        isAdmin: req.body.isAdmin,
        street: req.body.street,
        apartment: req.body.apartment,
        zip: req.body.zip,
        city: req.body.city,
        country: req.body.country,
    });

    user = await user.save();

    if (!user) return res.status(400).send('the user cannot be created!');

    res.send(user);
});

// user login by email
router.post('/login', async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    const secretKey = process.env.SECRET_KEY;
    if (!user) {
        return res.status(400).send('the user was not found');
    }

    if (user && bcryptjs.compareSync(req.body.password, user.passwordHash)) {
        const token = jwt.sign(
            {
                userId: user.id,
                isAdmin: user.isAdmin,
            },
            secretKey,
            {
                expiresIn: '1d',
            }
        );
        return res.status(200).send({ user: user.email, token: token });
    } else {
        return res.status(400).send('password is incorrect!');
    }
});

// register a user
router.post('/register', async (req, res) => {
    let user = new User({
        name: req.body.name,
        email: req.body.email,
        passwordHash: bcryptjs.hashSync(req.body.password, 10),
        phone: req.body.phone,
        isAdmin: req.body.isAdmin,
        street: req.body.street,
        apartment: req.body.apartment,
        zip: req.body.zip,
        city: req.body.city,
        country: req.body.country,
    });

    user = await user.save();

    if (!user) return res.status(400).send('the user cannot be created!');

    res.send(user);
});

// get total user count
router.get(`/get/count`, async (req, res) => {
    const userCount = await User.countDocuments();

    if (!userCount) {
        return res.status(500).json({ success: false });
    }

    res.send({ userCount: userCount });
});

// delete a user
router.delete('/:id', (req, res) => {
    User.findByIdAndRemove(req.params.id)
        .then((deletedUser) => {
            if (deletedUser) {
                return res.status(200).json({
                    success: true,
                    message: 'the user is deleted',
                });
            } else {
                return res.status(404).json({
                    success: false,
                    message: 'the user was not found',
                });
            }
        })
        .catch((err) => {
            return res.status(400).json({ success: false, message: err });
        });
});

module.exports = router;
