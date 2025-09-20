import mongoose from 'mongoose'
import config from './environment.js'

async function connectDB() {
    try {
        await mongoose.connect(config.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })
        console.log('MongoDB connected')
    } catch (error) {
        console.log('MongoDB connection error:', error)
        process.exit(1)
    }
}

export default connectDB