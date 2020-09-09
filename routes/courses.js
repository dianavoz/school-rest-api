'use strict';

const express = require('express');
const {Course, User} = require('../models');
const authenticateUser = require("./authenticate");
const { check, validationResult } = require("express-validator");

const router = express.Router();


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


// GET /api/courses 200
// Returns a list of courses (including the user that owns each course)
router.get('/', asyncHandler( async (req, res) => {
	const courses = await Course.findAll({
		attributes: ["id", "title", "description", "userId"],
		include: [
			{
				model: User,
				attributes: ["id", "firstName", "lastName", "emailAddress",]
			}
		]
	});
	res.json({ courses });
}));


// Returns a course (including the user that owns the course) for the provided course ID
router.get('/:id', asyncHandler( async (req, res) => {
	const course = await Course.findByPk(req.params.id, {
		attributes: ["id", "title", "description", "userId"],
		include: [
			{
				model: User,
				attributes: ["id", "firstName", "lastName", "emailAddress"]
			}
		]
	});
	
	if (course) {
		res.json({ course });
	} else {
		res.status(404).json({ message: 'Course id not found.' });
	}
}));


// Creates a course, sets the Location header to the URI for the course, and returns no content
router.post('/', [
	check('title')
		.exists({ checkNull: true, checkFalsy: true })
		.withMessage('Please provide a value for "title"'),
	check('description')
		.exists({ checkNull: true, checkFalsy: true })
		.withMessage('Please provide a value for "description"'),
],
authenticateUser, asyncHandler( async (req, res) => {
	// Attempt to get the validation result from the Request object.
	const errors = validationResult(req);

	// If there are validation errors...
	if (!errors.isEmpty()) {
		// Use the Array `map()` method to get a list of error messages.
		const errorMessages = errors.array().map(error => error.msg);
		// Return the validation errors to the client.
		return res.status(400).json({ errors: errorMessages });
	} else {

		// get the user from the request body.
		const course = req.body;

		// Create user
		const addedCourse = await Course.create({
      title: course.title,
      description: course.description,
      userId: req.currentUser.id
    });

		// get new course id for Location header
		const id = addedCourse.id;

		// Set the status to 201 Created, set Location header, and end the response.
		res.location(`/api/courses/${id}`).status(201).end();
	}
}));


// PUT /api/courses/:id 204
// Updates a course and returns no content
router.put('/:id', [
	check('title')
		.exists({ checkNull: true, checkFalsy: true })
		.withMessage('Please provide a value for "title"'),
	check('description')
		.exists({ checkNull: true, checkFalsy: true })
		.withMessage('Please provide a value for "description"'),
	],
	authenticateUser,  asyncHandler( async (req, res) => {
		// Attempt to get the validation result from the Request object.
		const errors = validationResult(req);

		// If there are validation errors...
		if (!errors.isEmpty()) {
			// Use the Array `map()` method to get a list of error messages.
			const errorMessages = errors.array().map(error => error.msg);
			// Return the validation errors to the client.
			return res.status(400).json({ errors: errorMessages });
		} else {

			// find existing course
			const course = await Course.findByPk(req.params.id, {
				attributes: ["id", "title", "description", "userId"],
				include: [
					{
						model: User,
						attributes: ["id", "firstName", "lastName", "emailAddress"]
					}
				]
			});

			// if course exists
			if (course) {
				// if course owner matches current user
				if (course.userId == req.currentUser.id) {
					// update course details in Courses table
					const updatedCourse = await Course.update({
						title: req.body.title,
						description: req.body.description
					}, {
						where: {
							id: course.id
						}
					});

					if (updatedCourse) {
						res.status(204).end();
					}

				} else {
					// Return a response with a 403 Client forbidden HTTP status code.
        	res.status(403).json({ message: "Access not permitted" });
				}
			} else {
				res.status(404).json({ message: "Course not found." });
			}
		}
	}
));


// DELETE /api/courses/:id 204
// Deletes a course and returns no content
router.delete('/:id', authenticateUser, asyncHandler(async (req, res) => {

      // find existing course
      const course = await Course.findByPk(req.params.id, {
        attributes: ["id", "title", "description", "userId"],
        include: [
          {
            model: User,
            attributes: ["id", "firstName", "lastName", "emailAddress"]
          }
        ]
      });

			// if course exists
      if (course) {
				// if course owner matches current user
				if (course.userId == req.currentUser.id) {
					// delete course from Courses table
					const deletedCourse = await Course.destroy(
						{
							where: {
								id: course.id
							}
						}
					);

					if (deletedCourse) {
						res.status(204).end();
					}
				
				} else {
					// Return a response with a 403 Client forbidden HTTP status code.
        	res.status(403).json({ message: "Access not permitted" });
				}
      } else {
        res.status(404).json({ message: "Course not found." });
      }
  })
);


module.exports = router;
