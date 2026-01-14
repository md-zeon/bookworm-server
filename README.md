# BookWorm Server 🖥️

The backend API for BookWorm - a RESTful Express.js server handling authentication, data management, and business logic for the book recommendation platform.

## 🚀 Features

### Authentication & Security

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for secure password storage
- **Role-Based Access**: Admin and User role management
- **CORS Support**: Cross-origin resource sharing enabled

### API Endpoints

#### Authentication

- User registration and login
- JWT token generation and validation
- Password reset functionality

#### Book Management (Admin)

- CRUD operations for books
- Image upload integration (Cloudinary)
- Genre association
- Search and filtering capabilities

#### User Library Management

- Add books to shelves (Want to Read, Currently Reading, Read)
- Track reading progress
- Library organization and retrieval

#### Review System

- Submit book reviews and ratings
- Admin moderation of reviews
- Public display of approved reviews

#### Recommendation Engine

- Personalized book suggestions
- Based on reading history and preferences
- Genre-based recommendations

#### Admin Dashboard

- User management and role assignment
- Review moderation
- Analytics and statistics
- Tutorial content management

## 🛠️ Tech Stack

- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database with native driver
- **JWT** - JSON Web Token authentication
- **bcryptjs** - Password hashing
- **Cloudinary** - Image hosting and management
- **CORS** - Cross-origin resource sharing
- **Cookie Parser** - HTTP cookie handling

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local installation or cloud service like MongoDB Atlas)
- Cloudinary account (for image uploads)

## 🚀 Installation

1. **Navigate to server directory**

   ```bash
   cd Bookworm-server
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:

   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/bookworm
   JWT_SECRET=your-super-secret-jwt-key-here
   CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
   CLOUDINARY_API_KEY=your-cloudinary-api-key
   CLOUDINARY_API_SECRET=your-cloudinary-api-secret
   ```

## 🏃‍♂️ Running the Server

### Development Mode

```bash
npm run dev
```

Starts the server with nodemon for automatic restarts on file changes.

### Production Mode

```bash
npm start
```

Starts the server in production mode.

Server will run on `http://localhost:5000` (or the port specified in `.env`)

## 📡 API Documentation

### Base URL

```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register User

```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword",
  "photo": "base64-image-string"
}
```

#### Login User

```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword"
}
```

### Book Endpoints

#### Get All Books

```http
GET /books
Query Parameters: ?page=1&limit=10&genre=fiction&search=title
```

#### Add Book (Admin Only)

```http
POST /admin/books
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "title": "Book Title",
  "author": "Author Name",
  "genre": "genre-id",
  "description": "Book description",
  "coverImage": "cloudinary-url",
  "totalPages": 300
}
```

### User Library Endpoints

#### Add to Library

```http
POST /user/library
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "bookId": "book-id",
  "shelf": "want-to-read", // want-to-read, currently-reading, read
  "progress": 50 // optional, for currently-reading
}
```

#### Get User Library

```http
GET /user/library
Authorization: Bearer <jwt-token>
```

### Review Endpoints

#### Submit Review

```http
POST /user/reviews
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "bookId": "book-id",
  "rating": 5,
  "review": "Great book!"
}
```

#### Get Pending Reviews (Admin)

```http
GET /admin/reviews/pending
Authorization: Bearer <admin-jwt-token>
```

#### Approve Review (Admin)

```http
PUT /admin/reviews/:reviewId/approve
Authorization: Bearer <admin-jwt-token>
```

## 📂 Project Structure

```
Bookworm-server/
├── src/
│   ├── app.js              # Express app configuration
│   ├── server.js           # Server entry point
│   ├── config/
│   │   ├── index.js        # Configuration loader
│   │   └── mongodb.js      # Database connection
│   ├── middlewares/
│   │   └── auth.js         # Authentication middleware
│   └── modules/            # Feature modules
│       ├── auth/           # Authentication module
│       │   ├── auth.controller.js
│       │   └── auth.routes.js
│       ├── admin/          # Admin modules
│       │   ├── books/
│       │   ├── genres/
│       │   ├── reviews/
│       │   └── users/
│       └── user/           # User modules
│           ├── books/
│           ├── goals/
│           ├── library/
│           ├── profile/
│           ├── recommendations/
│           └── reviews/
├── package.json
├── vercel.json             # Vercel deployment config
└── README.md
```

## 🔧 Environment Variables

| Variable                | Description                | Required                |
| ----------------------- | -------------------------- | ----------------------- |
| `PORT`                  | Server port                | No (defaults to 5000)   |
| `MONGODB_URI`           | MongoDB connection string  | Yes                     |
| `JWT_SECRET`            | Secret key for JWT signing | Yes                     |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name      | Yes (for image uploads) |
| `CLOUDINARY_API_KEY`    | Cloudinary API key         | Yes                     |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret      | Yes                     |

## 🌐 Deployment

### Vercel Deployment

1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Configure build settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

### Manual Deployment

```bash
npm run build
npm start
```

## 🧪 Testing

### API Testing

Use tools like Postman or Insomnia to test API endpoints:

1. **Authentication Flow**:

   - Register/Login to get JWT token
   - Include token in Authorization header for protected routes

2. **Admin Operations**:
   - Use admin credentials to test admin-only endpoints
   - Test CRUD operations for books, users, and reviews

### Database Testing

- Ensure MongoDB is running locally or use cloud instance
- Check database collections are created properly
- Verify data relationships and constraints

## 🤝 Contributing

1. Follow existing code structure and naming conventions
2. Add proper error handling and validation
3. Document new API endpoints
4. Test thoroughly before committing

## 📄 License

This project is part of the BookWorm application and follows the same license terms.

---

Built with ❤️ by Zeanur Rahaman Zeon
