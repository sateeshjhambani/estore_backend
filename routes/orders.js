const { Order } = require('../models/order');
const { OrderItem } = require('../models/order-item');
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// get all orders
router.get(`/`, async (req, res) => {
    const orderList = await Order.find()
        .populate('user', 'name phone')
        .populate({
            path: 'orderItems',
            populate: {
                path: 'product',
                populate: 'category',
            },
        })
        .sort({ dateOrdered: -1 }); // sort by date desc

    if (!orderList) {
        res.status(500).json({ success: false });
    }
    res.send(orderList);
});

// get an order
router.get('/:id', async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).send('invalid order id');
    }

    const order = await Order.findById(req.params.id)
        .populate('user', 'name phone')
        .populate({
            path: 'orderItems',
            populate: {
                path: 'product',
                populate: 'category',
            },
        });

    if (!order) {
        return res
            .status(404)
            .json({ message: 'the order with the given id was not found' });
    }
    res.status(200).send(order);
});

// create an order
router.post('/', async (req, res) => {
    const orderItemIds = Promise.all(
        req.body.orderItems.map(async (orderItem) => {
            let newOrderItem = new OrderItem({
                quantity: orderItem.quantity,
                product: orderItem.product,
            });

            newOrderItem = await newOrderItem.save();
            return newOrderItem._id;
        })
    );

    const orderItemIdsResolved = await orderItemIds;

    const totalPrices = await Promise.all(
        orderItemIdsResolved.map(async (orderItemId) => {
            const orderItem = await OrderItem.findById(orderItemId).populate(
                'product',
                'price'
            );
            const totalPrice = orderItem.product.price * orderItem.quantity;

            return totalPrice;
        })
    );

    const totalPrice = totalPrices.reduce((a, b) => a + b, 0);

    let order = new Order({
        orderItems: orderItemIdsResolved,
        shippingAddress1: req.body.shippingAddress1,
        shippingAddress2: req.body.shippingAddress2,
        city: req.body.city,
        zip: req.body.zip,
        country: req.body.country,
        phone: req.body.phone,
        status: req.body.status,
        totalPrice: totalPrice,
        user: req.body.user,
    });

    order = await order.save();

    if (!order) return res.status(400).send('the order cannot be created!');

    res.send(order);
});

// update an order (only status)
router.put('/:id', async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).send('invalid order id');
    }

    const order = await Order.findByIdAndUpdate(
        req.params.id,
        {
            status: req.body.status,
        },
        {
            new: true,
        }
    );

    if (!order) return res.status(400).send('the order cannot be updated!');

    res.send(order);
});

// delete an order
router.delete('/:id', (req, res) => {
    Order.findByIdAndRemove(req.params.id)
        .then(async (deletedOrder) => {
            if (deletedOrder) {
                await deletedOrder.orderItems.map(async (orderItem) => {
                    await OrderItem.findByIdAndRemove(orderItem);
                });

                return res.status(200).json({
                    success: true,
                    message: 'the order is deleted',
                });
            } else {
                return res.status(404).json({
                    success: false,
                    message: 'the order was not found',
                });
            }
        })
        .catch((err) => {
            return res.status(500).json({ success: false, message: err });
        });
});

// get total sales
router.get('/get/totalsales', async (req, res) => {
    const totalSales = await Order.aggregate([
        {
            $group: { _id: null, totalsales: { $sum: '$totalPrice' } },
        },
    ]);

    if (!totalSales) {
        return res.status(400).send('the order sales cannot be generated');
    }

    res.send({ totalSales: totalSales.pop().totalsales });
});

// get total order count
router.get(`/get/count`, async (req, res) => {
    const orderCount = await Order.countDocuments();

    if (!orderCount) {
        return res.status(500).json({ success: false });
    }

    res.send({ orderCount: orderCount });
});

// get orders by userId
router.get(`/get/userorders/:userid`, async (req, res) => {
    const userOrderList = await Order.find({ user: req.params.userid })
        .populate({
            path: 'orderItems',
            populate: {
                path: 'product',
                populate: 'category',
            },
        })
        .sort({ dateOrdered: -1 }); // sort by date desc

    if (!userOrderList) {
        res.status(500).json({ success: false });
    }
    res.send(userOrderList);
});

module.exports = router;
