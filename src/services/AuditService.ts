import fs from 'fs';
import path from 'path';
import { DateTime } from 'luxon';

class AuditService {
    private logFilePath: string;

    constructor() {
        this.logFilePath = path.join(__dirname, 'audit.log');
    }

    private log(message: string): void {
        const logEntry = `${DateTime.now().toUTC().toFormat('yyyy-MM-dd HH:mm:ss')} - ${message}\n`;
        fs.appendFileSync(this.logFilePath, logEntry, 'utf8');
    }

    public logUserAction(username: string, action: string): void {
        this.log(`User Action: ${username} performed action: ${action}`);
    }

    public logLoginAttempt(username: string, success: boolean): void {
        const result = success ? 'successful' : 'failed';
        this.log(`Login Attempt: ${username} login was ${result}`);
    }

    public logApiCall(username: string, endpoint: string, method: string): void {
        this.log(`API Call: ${username} made a ${method.toUpperCase()} request to ${endpoint}`);
    }

    public logSecurityEvent(message: string): void {
        this.log(`Security Event: ${message}`);
    }

}

export default new AuditService();
