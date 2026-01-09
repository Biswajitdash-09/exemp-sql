
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

const EmployeeSchema = new mongoose.Schema({
    employeeId: String,
    entityName: String,
}, { strict: false, collection: 'employees' });

async function checkEntities() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const entities = await mongoose.model('Employee', EmployeeSchema).distinct('entityName');
        console.log('Distinct Entities:', entities);

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
}

checkEntities();
