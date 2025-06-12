# TechLaunch Dashboard

A modular Node.js backend for the TechLaunch Android learning app with an admin dashboard for managing users and courses.

## Features

- 🔐 Secure authentication using Firebase Admin SDK
- 📊 Real-time data synchronization with Firestore
- 🛡️ Input validation and sanitization
- 📝 Comprehensive logging system
- 🚀 Rate limiting for API protection
- 💻 Modern web dashboard interface
- 📱 Mobile-responsive design

## Prerequisites

- Node.js >= 18.0.0
- Firebase project with Firestore enabled
- Firebase Admin SDK credentials

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd techlaunch-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Create environment variables:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:
- Set your Firebase project credentials
- Configure server settings
- Set security parameters

5. Place your Firebase Admin SDK credentials in `backend/serviceAccount.json`

## Development

Start the development server with hot reload:
```bash
npm run dev
```

The server will start on http://localhost:3000 (or your configured PORT)

## Project Structure

```
techlaunch-dashboard/
├── backend/                 # Backend source code
│   ├── config/             # Configuration files
│   ├── routes/             # API routes
│   ├── controllers/        # Request handlers
│   ├── services/          # Business logic
│   ├── middleware/        # Express middleware
│   └── utils/             # Utility functions
├── public/                # Frontend assets
│   ├── dashboard.html    # Admin dashboard
│   ├── dashboard.css     # Styles
│   └── src/             # Frontend JavaScript
└── docs/                # Documentation
```

## API Endpoints

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:email` - Get user by email
- `POST /api/users` - Create new user
- `GET /api/users/:email/courses` - Get user's courses
- `GET /api/users/stats` - Get user statistics

### Courses
- `GET /api/courses` - Get all courses
- `GET /api/courses/:name` - Get course by name
- `POST /api/courses` - Create new course
- `POST /api/courses/:courseId/modules` - Add module to course

### Enrollment
- `POST /api/enroll` - Enroll user in course
- `GET /api/enrollments/stats` - Get enrollment statistics

## Security

- CORS protection
- Rate limiting
- Input validation
- Data sanitization
- Secure headers with Helmet
- Environment variable protection

## Error Handling

The application implements a comprehensive error handling system:
- Custom error logging
- Development/Production error responses
- Request validation errors
- Database operation errors

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 