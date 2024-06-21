
const express = require('express')
const userController = require('../Controllers/userController')

const router = new express.Router()


router.post('/register',userController.register)
router.post('/login', userController.login)
router.post('/logouti', userController.logouti)
router.post('/adminlogin', userController.adminlogin)
// router.post('/getTotalDaysWorked',userController.getTotalDaysWorked)


module.exports = router