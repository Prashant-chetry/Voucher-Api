const { Router } = require('express');
const AuthenticationController = require('../controllers/auth/index').default;
const authenticationRouter = Router();
authenticationRouter.post('/register', new AuthenticationController().register);
authenticationRouter.post('/login', new AuthenticationController().logIn);
module.exports.default = authenticationRouter;
