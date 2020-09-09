'use strict';

const express = require('express');
const router = express.Router();

const User = require('../models').User;
const { check, validationResult } = require('express-validator');
const authenticateUser = require("./authenticateUser");
const bcryptjs = require('bcryptjs');


// Helper function so that we don't need to add try/catch to every route
function asyncHandler(cb) {
    return async (req, res, next) => {
      try {
        await cb(req, res, next);
      } catch (err) {
        next(err);
      }
    };
  }

// Creates a user, sets the Location header to "/", and returns no content
router.post('/', [
	check('firstName')
		.exists({ checkNull: true, checkFalsy: true })
		.withMessage('Please provide a value for "first name"'),
	check('lastName')
		.exists({ checkNull: true, checkFalsy: true })
		.withMessage('Please provide a value for "last name"'),
	check('emailAddress')
		.exists({ checkNull: true, checkFalsy: true })
		.withMessage('Please provide a value for "email"')
		.isEmail()
		.withMessage('Please provide a valid email address for "email"'),
	check('password')
		.exists({ checkNull: true, checkFalsy: true })
		.withMessage('Please provide a value for "password"')
		.isLength({ min: 8, max: 20 })
		.withMessage('Please provide a value for "password" that is between 8 and 20 characters in length')
	],
	asyncHandler( async (req, res) => {
		// Attempt to get the validation result from the Request object.
		const errors = validationResult(req);

		// If there are validation errors...
		if (!errors.isEmpty()) {
			// Use the Array `map()` method to get a list of error messages.
			const errorMessages = errors.array().map(error => error.msg);
			// Return the validation errors to the client.
			return res.status(400).json({ errors: errorMessages });
		}
		// Get the user from the request body.
		const user = req.body;
		
		// check if user already exists in Users table
		const existingUser = await User.findOne({
			where: {
				emailAddress: user.emailAddress
			}
		});

		// create new user if not already in Users table
		if (!existingUser) {

			// Hash the new user's password.
			user.password = bcryptjs.hashSync(user.password);

			// Create user
			User.create({
				firstName: user.firstName,
				lastName: user.lastName,
				emailAddress: user.emailAddress,
				password: user.password
			});

			// Set the status to 201 Created and end the response.
			res.location('/').status(201).end();
		} else {
			res.status(400).json({ message: "Email address already exists" });
		}
	}
));

// Route that returns the current authenticated user.
router.get('/', authenticateUser, (req, res) => {
  const { firstName, lastName, emailAddress } = req.currentUser;
  res.json({ firstName, lastName, emailAddress });
});


module.exports  = router;
