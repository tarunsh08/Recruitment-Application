import { Router } from 'express'
import UserController from '../controllers/userController.js'
import authMiddleware from '../middlewares/auth.js'
import roleMiddleware from '../middlewares/role.js'

const router = new Router();

// Public routes
router.post('/register', UserController.register);
router.post('/login', UserController.login);

// Protected routes (require authentication)
router.get('/:id', authMiddleware, UserController.getUser);
router.put('/:id', authMiddleware, roleMiddleware(['Admin']), UserController.updateUser);

export default router;