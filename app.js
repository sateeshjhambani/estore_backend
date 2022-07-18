const express = require('express');
const app = express();
const morgan = require('morgan');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv/config');
const authJwt = require('./helpers/jwt');
const errorHandler = require('./helpers/error-handler');
app.use(cors());
app.options('*', cors());

//middleware
app.use(express.json());
app.use(morgan('tiny')); //logging
app.use(authJwt());
app.use(errorHandler);
app.use('/public/uploads', express.static(__dirname + '/public/uploads'));

//routes
const categoriesRoutes = require('./routes/categories');
const productsRoutes = require('./routes/products');
const usersRoutes = require('./routes/users');
const ordersRoutes = require('./routes/orders');

const api = process.env.API_URL;

app.use(`${api}/categories`, categoriesRoutes);
app.use(`${api}/products`, productsRoutes);
app.use(`${api}/users`, usersRoutes);
app.use(`${api}/orders`, ordersRoutes);

mongoose
    .connect(process.env.CONNECTION_STRING)
    .then(() => {
        console.log('DB connection is ready...');
    })
    .catch((err) => {
        console.log(err);
    });

const PORT = process.env.PORT || 3000;

//Server
app.listen(PORT, () => {
    console.log('server is running http://localhost:3000');
});
