const express = require('express');
const router = express.Router();

const {Course, User} = require('../models');
const authenticateUser = require("./authenticateUser");

const { check, validationResult } = require("express-validator");

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

// GET all courses
router.get('/', asyncHandler(async (req, res) => {
      // Finds a lists all courses on database
      const courses = await Course.findAll({
          include: [{
              model: User,
              attributes: {
                  exclude: ['password', 'createdAt', 'updatedAt']
              }
          }],
          attributes: {
              exclude: ['userId', 'createdAt', 'updatedAt']
          }
      })

      res.status(200).json({ courses });
}));


//GET the course by ID
router.get('/:id', asyncHandler(async(req, res) => {
    const course = await Course.findByPk(req.params.id, {
        attributes: ["id","title", "description","userId"],
        include:[{
            model: User,
            attributes: ["id","firstName","lastName","emailAddress"]
        }]
    });

    if(course){
        res.status(200).json({course});
    }else{
        res.status(400).json({message: 'course not found!'});
    }
}));



// Creates a course, sets the Location header to the URI for the course, and returns no content
router.post('/',authenticateUser, async (req, res) => {
    try {
        const user = req.currentUser;
        const newCourse = req.body;
        let duplicateCheck = null;
        
        if (newCourse.title) { 
            // Checks if there is a course w/ this title
            duplicateCheck = await Course.findOne({
                where: {
                    title: newCourse.title
                }
            });
        }

        if (!duplicateCheck) {
            // If not Null: make new course
            await Course.create({
                title: newCourse.title,
                description: newCourse.description,
                estimatedTime: newCourse.estimatedTime,
                materialsNeeded: newCourse.materialsNeeded,
                userId: user.id
            });

            const courseUri = await Course.findOne({
                where: {
                    title: newCourse.title
                },
                attributes: {
                    include: ['id']
                }
            });
            
            res.status(201).location(`/courses/${courseUri.dataValues.id}`).end();
        } else {
            // If null: gives message
            res.status(400).json({
                errors: {
                    errors: {
                        message: 'There is a course with that title already.'
                    }
                }
            });
        }
        
    } catch (err) {
        res.status(400).json({ errors: err });
    }
});


// Updates a course and returns no content
router.put('/:id', authenticateUser, asyncHandler((req, res, next) => {
    if (req.course) {
        let { course, body, currentUser } = req;
    
        if (course.user.id == currentUser.id) {
          course.updateOne(body, (err) => {
            if(err) return next(err);
            res.status(204).end();
          });
        } else {
          res.status(403).json({ message: 'Access denied' });
        }
      } else {
        res.status(404).json({ message: 'Course not found' });
      }
  
}));

// Deletes a course and returns no content
router.delete('/:id', authenticateUser, asyncHandler((req, res) => {
    if (req.course) {
        const { course, currentUser } = req;
    
        if (course.user.id == currentUser.id) {
          course.remove((err) => {
            if(err) return next(err);
            res.status(204).end();
          });
        } else {
          res.status(403).json({ message: 'Access denied' });
        }
      } else {
        res.status(404).json({ message: 'Course not found' });
      }
}));

module.exports = router;