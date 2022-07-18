const { expressjwt: expressJwt } = require('express-jwt');

function authJwt() {
    const secretKey = process.env.SECRET_KEY;
    const api = process.env.API_URL;

    return expressJwt({
        secret: secretKey,
        algorithms: ['HS256'],
        // isRevoked: isRevoked, // causing issues, not sure how to fix
    }).unless({
        path: [
            {
                url: /\/public\/uploads(.*)/,
                methods: ['GET', 'OPTIONS'],
            },
            {
                url: /\/api\/v1\/products(.*)/,
                methods: ['GET', 'OPTIONS'],
            },
            {
                url: /\/api\/v1\/categories(.*)/,
                methods: ['GET', 'OPTIONS'],
            },
            `${api}/users/login`,
            `${api}/users/register`,
        ],
    });
}

async function isRevoked(req, payload, done) {
    if (!payload.isAdmin) {
        done(null, true);
    }

    done();
}

module.exports = authJwt;
