const { router } = require('../app')
const { getAll, create, getOne, destroy, update, verifyUser, login, logged } = require('../controllers/user.controllers')
const express = require('express')
const verifyJWT = require('../utils/verifyJWT')

const routerUser = express.Router()

routerUser.route('/')
    .get(verifyJWT, getAll)
    .post(create)

routerUser.route('/login')
    .post(login)

routerUser.route('/me')
    .get(verifyJWT, logged)   
    
    
routerUser.route("/verify/:code")
    .get(verifyUser)

routerUser.route('/:id')
    .get(verifyJWT, getOne)
    .delete(verifyJWT, destroy)
    .put(verifyJWT, update)

module.exports = routerUser