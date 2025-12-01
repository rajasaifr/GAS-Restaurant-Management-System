# Restaurant Management System (GAS)

A comprehensive full-stack web application for restaurant management, featuring user reservations, order management, payment processing, and administrative controls.

## 🚀 Features

### User Features
- **User Authentication**: Secure login and registration with JWT tokens
- **Table Reservations**: Book tables with real-time availability checking
- **Menu Browsing**: View restaurant menu with categories and pricing
- **Online Ordering**: Place orders with member discounts (20% off)
- **Payment Management**: View payment history and manage pending payments
- **Membership System**: Purchase membership for exclusive discounts
- **Feedback System**: Submit ratings and reviews
- **Profile Management**: Update personal information and password

### Admin Features
- **Dashboard Analytics**: Revenue reports, popular items, busiest times
- **Menu Management**: Add, edit, delete menu items
- **Staff Management**: Manage restaurant staff information
- **Table Management**: Configure tables and seating capacity
- **Reservation Oversight**: View and manage all reservations
- **Member Management**: Manage membership status
- **Feedback Monitoring**: View customer feedback and ratings
- **User Administration**: Manage user accounts and permissions

### System Features
- **Real-time Availability**: Dynamic table availability checking
- **Role-based Access**: Separate interfaces for users and administrators
- **Secure Payments**: Integrated payment processing system
- **Reporting System**: Comprehensive business analytics
- **Responsive Design**: Mobile-friendly interface using Material-UI

## 🛠 Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **SQL Server** - Database management
- **Sequelize** - ORM for database operations
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **CORS** - Cross-origin resource sharing

### Frontend
- **React** - UI library
- **Material-UI** - Component library
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Date-fns** - Date utilities

### Database
- **SQL Server** - Primary database
- **Tables**: Users, Reservations, Orders, OrderDetails, Payments, Menu, Staff, Tables, TableType, Feedback

## 📋 Prerequisites

- Node.js (v14 or higher)
- SQL Server
- npm or yarn package manager

## 🔧 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd restaurant-management-system
```

### 2. Database Setup
1. Create a new SQL Server database named `GAS_`
2. Execute the SQL script in `GAS FINAL DB.sql` to create tables and insert sample data

### 3. Backend Setup
```bash
cd backend
npm install

# Create .env file with the following variables:
DB_SERVER=your-sql-server-instance
DB_DATABASE=GAS_
DB_USER=your-username
DB_PASSWORD=your-password
JWT_SECRET=your-jwt-secret-key
PORT=5000

npm start
```

### 4. Frontend Setup
```bash
cd frontend
npm install
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📖 Usage

### For Users:
1. **Register/Login**: Create an account or login with existing credentials
2. **Make Reservations**: Select date, time, and party size to book tables
3. **Browse Menu**: View available items and place orders
4. **Manage Payments**: Complete pending payments and view history
5. **Join Membership**: Purchase membership for 20% discounts
6. **Provide Feedback**: Rate your experience and leave comments

### For Administrators:
1. **Login**: Use admin credentials to access admin panel
2. **Manage Operations**: Update menu, staff, tables, and reservations
3. **View Reports**: Analyze revenue, popular items, and peak hours
4. **User Management**: Manage user accounts and memberships
5. **Monitor Feedback**: Review customer satisfaction ratings

## 🗄 Database Schema

### Core Tables
- **Users**: User accounts with role-based permissions
- **Reservations**: Table booking information
- **Orders**: Customer order records
- **OrderDetails**: Individual order items
- **Payments**: Payment transaction records
- **Menu**: Restaurant menu items
- **Staff**: Employee information
- **Tables**: Restaurant table configuration
- **Feedback**: Customer reviews and ratings

### Key Relationships
- Users can make multiple reservations and orders
- Orders contain multiple order details linked to menu items
- Payments are associated with orders
- Reservations are linked to specific tables and users
- Staff members are assigned roles

## 🔐 API Endpoints

### Authentication
- `POST /login` - User authentication
- `POST /register` - User registration
- `PUT /api/reset-password` - Password reset

### User Operations
- `GET /api/menu` - Get menu items
- `POST /reservations` - Create reservation
- `GET /reservationsByUserId/:userId` - Get user reservations
- `POST /orderByID` - Create order
- `POST /order-details` - Add items to order
- `GET /payments/customer/:id` - Get payment history

### Admin Operations
- `GET /api/users` - Get all users
- `POST /api/menu` - Add menu item
- `PUT /api/menu/:id` - Update menu item
- `DELETE /api/menu/:id` - Delete menu item
- `GET /api/reports/revenue-by-day` - Revenue analytics
- `GET /api/feedback` - View all feedback

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 👥 Authors

- **Azhar Iqbal Rizvi** - *Full Stack Developer*

## 🙏 Acknowledgments

- Built with modern web technologies
- Designed for restaurant management efficiency
- Implements industry-standard security practices
- Responsive design for all devices

---

**Note**: This is a comprehensive restaurant management solution suitable for small to medium-sized restaurants looking to digitize their operations.
