# TechLaunch Dashboard

A full-stack dashboard application for managing courses, users, and enrollments with Firebase integration.

## Features

- User Management
  - Create, read, update, and delete users
  - Track user enrollments
  - Search and filter users

- Course Management
  - Create and manage courses
  - Modern card-based course display
  - Course enrollment tracking

- Dashboard Overview
  - Real-time statistics
  - Recent activity feed
  - User enrollment status

## Tech Stack

- Frontend:
  - HTML5, CSS3, JavaScript
  - Bootstrap 5
  - Font Awesome icons
  
- Backend:
  - Node.js
  - Express.js
  - Firebase Admin SDK
  - Firestore Database

## Project Structure

```
techlaunch-dashboard/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   └── server.js
├── public/
│   ├── src/
│   ├── courses.html
│   ├── users.html
│   └── index.html
└── package.json
```

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure Firebase:
   - Create a Firebase project
   - Download serviceAccountKey.json
   - Place it in the backend/config directory

3. Start the server:
   ```bash
   cd backend
   node server.js
   ```

4. Access the application:
   - Dashboard: http://localhost:3001
   - Users Management: http://localhost:3001/users.html
   - Courses Management: http://localhost:3001/courses.html

## API Endpoints

- `/api/users` - User management
- `/api/courses` - Course management
- `/api/enroll` - Enrollment management
- `/api/dashboard/stats` - Dashboard statistics
- `/api/dashboard/activity` - Recent activity

## Development

1. Clone the repository:
   ```bash
   git clone [repository-url]
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a .env file with required environment variables

4. Start development server:
   ```bash
   npm run dev
   ```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 