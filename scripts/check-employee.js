
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

const EmployeeSchema = new mongoose.Schema({
    employeeId: String,
    name: String,
    entityName: String,
}, { strict: false, collection: 'employees' });

async function checkEmployee() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const employee = await mongoose.model('Employee', EmployeeSchema).findOne({ employeeId: '6002056' });
        console.log('Employee Data:', employee);

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
}

checkEmployee();
