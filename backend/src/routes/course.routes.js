const express = require('express');
const router = express.Router();
const { listCourses, getCourse, getCourseCenters, getCategories } = require('../controllers/course.controller');
const { createCourse, updateCourse, deleteCourse } = require('../controllers/course.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.get('/', listCourses);
router.get('/categories', getCategories);
router.get('/:id/centers', getCourseCenters);
router.get('/:id/centros', getCourseCenters);
router.get('/:id', getCourse);
// Admin routes
router.post('/', authenticate, authorize('admin','employee'), createCourse);
router.put('/:id', authenticate, authorize('admin','employee'), updateCourse);
router.delete('/:id', authenticate, authorize('admin'), deleteCourse);
module.exports = router;
