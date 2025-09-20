import Joi from 'joi';
import MongoUserRepository from '../repositories/implementations/MongoUserRepository.js';
import RedisCacheRepository from '../repositories/implementations/RedisCacheRepository.js';
import AppError from '../utils/error.js';
import jwt from 'jsonwebtoken';
import config from '../config/environment.js'

class UserService {
    constructor() {
        this.userRepository = new MongoUserRepository();
        this.cacheRepository = new RedisCacheRepository();
    }

    createUserSchema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(8).required(),
        role: Joi.string().valid('Admin', 'Candidate', 'Client').required(),
        name: Joi.string().min(2).required(),
    })

    updateUserSchema = Joi.object({
        email: Joi.string().email(),
        name: Joi.string().min(2),
        role: Joi.string().valid('Admin', 'Candidate', 'Client'),
    })

    async register(userData) {
        const {error} = this.createUserSchema.validate(userData);
        if (error) {
            throw new AppError(error.message, 400);
        }
        const cacheKey = `user:email:${userData.email}`;
        let existingUser = await this.cacheRepository.get(cacheKey);
        if (!existingUser) {
            existingUser = await this.userRepository.findUserByEmail(userData.email);
            if (existingUser) {
                await this.cacheRepository.set(cacheKey, existingUser, 3600);
            }
        }
        if (existingUser) {
            throw new AppError('User already exists', 409);
        }

        const user = await this.userRepository.createUser(userData);

        await this.cacheRepository.set(`user:id:${user._id}`, {
            id: user._id,
            email: user.email,
            role: user.role,
            name: user.name
        }, 3600);
        await this.cacheRepository.set(cacheKey, user, 3600);

        const token = jwt.sign({
            id: user._id,
            role: user.role
        }, config.JWT_SECRET, {expiresIn: '1h'});

        return {user: {
            id: user._id,
            email: user.email,
            role: user.role,
            name: user.name
        }, token}
    }

    async login({ email, password }) {
        const schema = Joi.object({
            email: Joi.string().email().required(),
            password: Joi.string().required(),
        })
        const {error} = schema.validate({email, password});
        if (error) {
            throw new AppError(error.message, 400);
        }
        const cacheKey = `user:email:${email}`;
        let user = await this.cacheRepository.get(cacheKey);
        if (!user) {
            user = await this.userRepository.findUserByEmail(email);
            if (user) {
                await this.cacheRepository.set(cacheKey, user, 3600);
            }
        }
        if(!user) {
            throw new AppError('Invalid credentials', 401);
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            throw new AppError('Invalid credentials', 401);
        }

        await this.cacheRepository.set(`user:id:${user._id}`, {
            id: user._id,
            email: user.email,
            role: user.role,
            name: user.name
        }, 3600);

        const token = jwt.sign({
            id: user._id,
            role: user.role
        }, config.JWT_SECRET, {expiresIn: '1h'});

        return {user: {
            id: user._id,
            email: user.email,
            role: user.role,
            name: user.name
        }, token}
    }

    async getUser(id) {
        const cacheKey = `user:id:${id}`;
        let user = await this.cacheRepository.get(cacheKey);
        if (!user) {
            user = await this.userRepository.findUserById(id);
            if (!user) {
                throw new AppError('User not found', 404);
            }
            await this.cacheRepository.set(cacheKey, {
                id: user._id,
                email: user.email,
                role: user.role,
                name: user.name
            }, 3600);
        }
        return user;
    }

    async updateUser(id, userData) {
        const {error} = this.updateUserSchema.validate(userData);
        if(error) {
            throw new AppError(error.message, 400);
        }
        const user = await this.userRepository.updateUser(id, userData);
        if(!user) {
            throw new AppError('User not found', 404);
        }
        await this.cacheRepository.set(`user:id:${id}`, {
            id: user._id,
            email: user.email,
            role: user.role,
            name: user.name
        }, 3600);

        if(userData.email) {
            await this.cacheRepository.del(`user:email:${user.email}`, user, 3600);
            if(userData.email !== user.email) {
                await this.cacheRepository.del(`user:email:${userData.email}`);
            }
        }
        return {id: user._id, email: user.email, role: user.role, name: user.name}
    }
}

export default UserService;