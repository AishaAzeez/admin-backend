
const express = require('express')
const userController = require('../Controllers/userController')

const router = new express.Router()


router.post('/register',userController.register)
router.post('/login', userController.login)
router.post('/logouti', userController.logouti)
router.post('/adminlogin', userController.adminlogin)
router.delete('/deleteUsers', userController.deleteUsers);

module.exports = router