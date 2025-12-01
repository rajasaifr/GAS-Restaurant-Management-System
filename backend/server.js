require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { poolPromise, sql } = require('./db.js');

const app = express();

const authenticate = (req, res, next) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        throw new Error('Authentication required');
      }
  
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ 
        success: false, 
        message: 'Authentication failed',
        error: err.message 
      });
    }
  };

// Middleware
app.use(bodyParser.json());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const PORT = process.env.PORT || 5000;

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Restaurant Management API is running',
    timestamp: new Date()
  });
});



// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});


// GET /orders/customer/:id
// POST /orders
// POST /orders

app.post('/api/payments/:id/complete', async (req, res) => {
    try {
        const paymentId = parseInt(req.params.id);
        
        if (isNaN(paymentId)) {
            return res.status(400).json({ success: false, error: 'Invalid payment ID' });
        }

        const pool = await poolPromise;
        
        // First verify the payment exists and is pending
        const checkResult = await pool.request()
            .input('PaymentID', sql.Int, paymentId)
            .query('SELECT Status FROM Payments WHERE PaymentID = @PaymentID');
        
        if (checkResult.recordset.length === 0) {
            return res.status(404).json({ success: false, error: 'Payment not found' });
        }

        if (checkResult.recordset[0].Status !== 'Pending') {
            return res.status(400).json({ 
                success: false, 
                error: `Payment status is already ${checkResult.recordset[0].Status}`
            });
        }

        // Update the payment status
        const updateResult = await pool.request()
            .input('PaymentID', sql.Int, paymentId)
            .query(`
                UPDATE Payments 
                SET Status = 'Completed', 
                    PaymentDate = GETDATE()
                WHERE PaymentID = @PaymentID
                
                SELECT * FROM Payments WHERE PaymentID = @PaymentID
            `);

        res.json({ 
            success: true, 
            message: 'Payment successfully completed',
            data: updateResult.recordset[0]
        });

    } catch (err) {
        console.error('Payment completion error:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
});
  
app.post('/PayPayments', async (req, res) => {
  try {
      const { OrderID, UserID, Amount } = req.body;

      // Validate required fields
      if (!OrderID || !UserID || !Amount) {
          return res.status(400).json({
              success: false,
              error: 'OrderID, UserID, and Amount are required'
          });
      }

      // Validate amount is a positive number
      if (isNaN(Amount) || Amount <= 0) {
          return res.status(400).json({
              success: false,
              error: 'Amount must be a positive number'
          });
      }

      const pool = await poolPromise;

      // Verify the order exists
      const orderCheck = await pool.request()
          .input('OrderID', sql.Int, OrderID)
          .query('SELECT OrderID FROM Orders WHERE OrderID = @OrderID');

      if (orderCheck.recordset.length === 0) {
          return res.status(404).json({
              success: false,
              error: 'Order not found'
          });
      }

      // Verify the user exists
      const userCheck = await pool.request()
          .input('UserID', sql.Int, UserID)
          .query('SELECT UserID FROM Users WHERE UserID = @UserID');

      if (userCheck.recordset.length === 0) {
          return res.status(404).json({
              success: false,
              error: 'User not found'
          });
      }

      // Create the payment record
      const result = await pool.request()
          .input('OrderID', sql.Int, OrderID)
          .input('UserID', sql.Int, UserID)
          .input('Amount', sql.Decimal(10, 2), Amount)
          .query(`
              INSERT INTO Payments (
                  OrderID, 
                  UserID, 
                  Amount, 
                  PaymentMethod, 
                  Status, 
                  PaymentDate
              )
              VALUES (
                  @OrderID,
                  @UserID,
                  @Amount,
                  'Credit Card', -- Default payment method
                  'Pending',
                  GETDATE()
              )
              
              SELECT * FROM Payments WHERE PaymentID = SCOPE_IDENTITY()
          `);

      const paymentRecord = result.recordset[0];

      res.status(201).json({
          success: true,
          message: 'Payment created successfully',
          payment: paymentRecord
      });

  } catch (err) {
      console.error('Payment creation error:', err);
      res.status(500).json({
          success: false,
          error: 'Failed to create payment',
          details: err.message
      });
  }
});

app.post('/orderByID', async (req, res) => {
    try {
        const { userID } = req.body;

        if (!userID || isNaN(parseInt(userID))) {
            return res.status(400).json({ 
                success: false, 
                error: 'Valid userID is required' 
            });
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('UserID', sql.Int, userID)
            .query(`
                INSERT INTO Orders (UserID, Status)
                OUTPUT INSERTED.OrderID
                VALUES (@UserID, 'Pending')
            `); // Removed OrderDate from query

        res.status(201).json({
            success: true,
            orderId: result.recordset[0].OrderID,
            message: 'Order created successfully'
        });

    } catch (err) {
        console.error('Error creating order:', err);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to create order',
            details: err.message 
        });
    }
});

app.post('/order-details', authenticate, async (req, res, next) => {
  try {
      const { OrderID, ItemID, Quantity } = req.body;
      
      // Validate input
      if (!OrderID || !ItemID || !Quantity) {
          return res.status(400).json({
              success: false,
              message: 'OrderID, ItemID, and Quantity are required',
          });
      }

      const pool = await poolPromise;
      
      // Get the user's membership status from the order
      const userCheck = await pool.request()
          .input('OrderID', sql.Int, OrderID)
          .query(`
              SELECT u.isMember, u.UserID
              FROM Orders o
              JOIN Users u ON o.UserID = u.UserID
              WHERE o.OrderID = @OrderID
          `);

      if (userCheck.recordset.length === 0) {
          return res.status(400).json({
              success: false,
              message: 'Order not found or invalid',
          });
      }

      const isMember = userCheck.recordset[0].isMember;
      const UserID = userCheck.recordset[0].UserID;

      // Get the item price from Menu
      const itemResult = await pool.request()
          .input('ItemID', sql.Int, ItemID)
          .query('SELECT Price FROM Menu WHERE ItemID = @ItemID');

      if (itemResult.recordset.length === 0) {
          return res.status(400).json({
              success: false,
              message: 'Item not found',
          });
      }

      const basePrice = itemResult.recordset[0].Price;
      let finalPrice = basePrice;
      let discountApplied = 0;

      // Apply 20% discount if user is a member
      if (isMember) {
          discountApplied = basePrice * 0.2;
          finalPrice = basePrice - discountApplied;
      }

      // Insert into OrderDetails table
      const result = await pool.request()
          .input('OrderID', sql.Int, OrderID)
          .input('ItemID', sql.Int, ItemID)
          .input('Quantity', sql.Int, Quantity)
          .input('Price', sql.Decimal(10, 2), finalPrice)
          .query(`
              INSERT INTO OrderDetails (OrderID, ItemID, Quantity, Price)
              OUTPUT INSERTED.*
              VALUES (@OrderID, @ItemID, @Quantity, @Price)
          `);

      res.status(201).json({
          success: true,
          message: 'Order detail created successfully',
          data: {
              ...result.recordset[0],
              basePrice: basePrice,
              discountApplied: discountApplied,
              isMember: isMember,
              finalPrice: finalPrice
          }
      });
  } catch (err) {
      next(err);
  }
});

  app.delete('/reservation/:id', async (req, res, next) => {
    try {
      const { id } = req.params;
      const pool = await poolPromise;
  
      const result = await pool.request()
        .input('ReservationID', sql.Int, id)
        .query('DELETE FROM Reservations WHERE ReservationID = @ReservationID');
  
      res.json({
        success: true,
        message: `Reservation with ID ${id} has been deleted.`,
      });
    } catch (err) {
      next(err);
    }
  });
  app.put('/reservation/:id/status', async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body; // assuming status comes in request body
      const pool = await poolPromise;
  
      const result = await pool.request()
        .input('ReservationID', sql.Int, id)
        .input('Status', sql.VarChar(50), status)
        .query('UPDATE Reservations SET Status = @Status WHERE ReservationID = @ReservationID');
  
      res.json({
        success: true,
        message: `Status for reservation ID ${id} updated to "${status}".`,
      });
    } catch (err) {
      next(err);
    }
  });
    

// GET all menu items
app.get('/api/menu', async (req, res) => {
    try {
      const pool = await poolPromise;
      const result = await pool.request().query('SELECT * FROM Menu');
      res.json({ success: true, data: result.recordset });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  
  // POST add new item
  app.post('/api/menu', async (req, res) => {
    const { ItemName, Category, Price } = req.body;
    try {
      const pool = await poolPromise;
      await pool.request()
        .input('ItemName', sql.VarChar(100), ItemName)
        .input('Category', sql.VarChar(50), Category)
        .input('Price', sql.Decimal(10, 2), Price)
        .query('INSERT INTO Menu (ItemName, Category, Price) VALUES (@ItemName, @Category, @Price)');
      res.json({ success: true, message: 'Item added successfully' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  
  // PUT update item price
  app.put('/api/menu/:id', async (req, res) => {
    const { id } = req.params;
    const { Price } = req.body;
    try {
      const pool = await poolPromise;
      await pool.request()
        .input('Price', sql.Decimal(10, 2), Price)
        .input('ItemID', sql.Int, id)
        .query('UPDATE Menu SET Price = @Price WHERE ItemID = @ItemID');
      res.json({ success: true, message: 'Price updated successfully' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  

// Add this to your API file (where you have the POST /api/menu endpoint)
app.delete('/api/menu/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('ItemID', sql.Int, id)
            .query('DELETE FROM Menu WHERE ItemID = @ItemID');
        res.json({ success: true, message: 'Item deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});


// Add this to your server.js
app.get('/api/users', authenticate, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .query('SELECT UserID, Name, Email, isAdmin, isMember FROM Users');

    res.json({
      success: true,
      count: result.recordset.length,
      data: result.recordset
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch users',
      details: err.message 
    });
  }
});


// Revenue by Day Report
app.get('/api/reports/revenue-by-day', async (req, res) => {
    try {
      const pool = await poolPromise;
      const result = await pool.request().query(`
        SELECT 
          COALESCE(r.Date, '2023-01-01') AS Date, -- Default date for walk-ins
          SUM(od.Quantity * od.Price) AS Revenue,
          COUNT(DISTINCT o.OrderID) AS Orders,
          CASE WHEN r.Date IS NULL THEN 'Walk-in' ELSE 'Reservation' END AS OrderType
        FROM OrderDetails od
        INNER JOIN Orders o ON od.OrderID = o.OrderID
        LEFT JOIN Reservations r ON o.UserID = r.UserID
        WHERE o.Status = 'Completed'
        GROUP BY COALESCE(r.Date, '2023-01-01'), 
                 CASE WHEN r.Date IS NULL THEN 'Walk-in' ELSE 'Reservation' END
        ORDER BY Date DESC
      `);
      res.json({
        success: true,
        data: result.recordset
      });
    } catch (err) {
      console.error('Revenue report error:', err);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to generate revenue report',
        details: err.message 
      });
    }
  });
  // Most Popular Menu Items Report
  app.get('/api/reports/popular-items', async (req, res) => {
    try {
      const pool = await poolPromise;
      const result = await pool.request().query(`
        SELECT 
          m.ItemName AS Item,
          COUNT(od.OrderDetailID) AS Orders,
          SUM(od.Quantity) AS TotalQuantity
        FROM OrderDetails od
        LEFT JOIN Menu m ON od.ItemID = m.ItemID
        GROUP BY m.ItemName
        ORDER BY Orders DESC
      `);
      res.json({
        success: true,
        data: result.recordset
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  
  // Busiest Times Report
  app.get('/api/reports/busiest-times', async (req, res) => {
    try {
      const pool = await poolPromise;
      const result = await pool.request().query(`
        SELECT 
          CASE 
            WHEN StartTime BETWEEN 8 AND 11 THEN 'Morning (8-11)'
            WHEN StartTime BETWEEN 12 AND 14 THEN 'Lunch (12-14)'
            WHEN StartTime BETWEEN 15 AND 17 THEN 'Afternoon (15-17)'
            WHEN StartTime BETWEEN 18 AND 23 THEN 'Evening (18-23)'
          END AS TimeSlot,
          COUNT(ReservationID) AS Reservations
        FROM Reservations
        GROUP BY CASE 
            WHEN StartTime BETWEEN 8 AND 11 THEN 'Morning (8-11)'
            WHEN StartTime BETWEEN 12 AND 14 THEN 'Lunch (12-14)'
            WHEN StartTime BETWEEN 15 AND 17 THEN 'Afternoon (15-17)'
            WHEN StartTime BETWEEN 18 AND 23 THEN 'Evening (18-23)'
          END
        ORDER BY Reservations DESC
      `);
      res.json({
        success: true,
        data: result.recordset
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

// Add this to your backend API routes
// In your backend route file
app.get('/api/admin-info', async (req, res) => {
    try {
        // 1. Verify authentication
        if (!req.user) {
            return res.status(401).json({ success: false, error: 'Not authenticated' });
        }

        const pool = await poolPromise;
        
        // 2. Debug: Log the user from JWT
        console.log('JWT User:', {
            UserID: req.user.UserID,
            isAdmin: req.user.isAdmin
        });

        // 3. Execute query with error handling
        const result = await pool.request()
            .input('userId', sql.Int, req.user.UserID)
            .query(`
                SELECT 
                    Name as name, 
                    Email as email 
                FROM Users 
                WHERE UserID = @userId AND isAdmin = 1
            `);

        // 4. Handle no results
        if (result.recordset.length === 0) {
            return res.status(403).json({ 
                success: false, 
                error: 'User is not an admin' 
            });
        }

        // 5. Return success
        res.json({
            success: true,
            data: result.recordset[0]
        });

    } catch (err) {
        console.error('Admin info error:', err);
        res.status(500).json({ 
            success: false, 
            error: 'Database error',
            details: err.message 
        });
    }
});

app.get('/api/user/:userId', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('userId', sql.Int, req.params.userId)
            .query(`
                SELECT 
                    UserID,
                    Name,
                    Phone,
                    Email,
                    isAdmin,
                    isMember
                FROM Users 
                WHERE UserID = @userId
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'User not found' 
            });
        }

        // Don't return password in the response
        const userData = result.recordset[0];
        delete userData.Password;

        res.json({
            success: true,
            data: userData
        });

    } catch (err) {
        console.error('User info error:', err);
        res.status(500).json({ 
            success: false, 
            error: 'Database error',
            details: err.message 
        });
    }
});


app.get('/api/members', async (req, res) => {
    try {
        const pool = await poolPromise;
        
        // Query to get all users where isMember = 1 (true)
        const result = await pool.request()
            .query(`
                SELECT 
                    UserID,
                    Name,
                    Phone,
                    Email
                FROM Users 
                WHERE isMember = 1
                ORDER BY Name ASC
            `);

        // Return the member data (excluding passwords)
        res.status(200).json({
            success: true,
            count: result.recordset.length,
            data: result.recordset
        });

    } catch (err) {
        console.error('Error fetching members:', err);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch members',
            details: err.message 
        });
    }
});

// POST /api/members - Add a new member
app.post('/api/members', async (req, res) => {
  try {
      const pool = await poolPromise;
      const { Name, Email } = req.body;

      // Validate input
      if (!Name || !Email) {
          return res.status(400).json({
              success: false,
              error: 'Name and Email are required'
          });
      }

      // Check if user exists with matching Name and Email
      const checkUser = await pool.request()
          .input('Name', sql.VarChar(100), Name)
          .input('Email', sql.VarChar(100), Email)
          .query(`
              SELECT UserID, Name, Email, isMember 
              FROM Users 
              WHERE Name = @Name AND Email = @Email
          `);

      if (checkUser.recordset.length === 0) {
          // No matching user found
          return res.status(404).json({
              success: false,
              error: 'No user found with matching Name and Email'
          });
      }

      const user = checkUser.recordset[0];
      
      // Check if already a member
      if (user.isMember) {
          return res.status(200).json({
              success: true,
              message: 'User is already a member'
          });
      }

      // User exists with matching credentials - update to member status
      await pool.request()
          .input('UserID', sql.Int, user.UserID)
          .query(`
              UPDATE Users 
              SET isMember = 1
              WHERE UserID = @UserID
          `);

      res.status(200).json({
          success: true,
          message: 'Member status updated successfully',
          data: {
              UserID: user.UserID,
              Name: user.Name,
              Email: user.Email
          }
      });

  } catch (err) {
      console.error('Error updating member:', err);
      res.status(500).json({ 
          success: false, 
          error: 'Failed to update member status',
          details: err.message 
      });
  }
});



app.put('/api/users/membership', async (req, res) => {
  try {
      const pool = await poolPromise;
      const { UserID, Email } = req.body;

      // Validate input
      if (!UserID || !Email) {
          return res.status(400).json({
              success: false,
              error: 'UserID and Email are required'
          });
      }

      // Check if user exists with matching UserID and Email
      const userCheck = await pool.request()
          .input('UserID', sql.Int, UserID)
          .input('Email', sql.VarChar(100), Email)
          .query(`
              SELECT UserID, Name, Email, isMember 
              FROM Users 
              WHERE UserID = @UserID AND Email = @Email
          `);

      if (userCheck.recordset.length === 0) {
          return res.status(404).json({
              success: false,
              error: 'No user found with matching UserID and Email'
          });
      }

      const user = userCheck.recordset[0];
      
      // Check if already a member
      if (user.isMember) {
          return res.status(200).json({
              success: true,
              message: 'User is already a member',
              data: {
                  UserID: user.UserID,
                  Name: user.Name,
                  Email: user.Email,
                  isMember: true
              }
          });
      }

      // Update user to member status
      await pool.request()
          .input('UserID', sql.Int, UserID)
          .query(`
              UPDATE Users 
              SET isMember = 1
              WHERE UserID = @UserID
          `);

      // Get updated user data
      const updatedUser = await pool.request()
          .input('UserID', sql.Int, UserID)
          .query(`
              SELECT UserID, Name, Email, isMember 
              FROM Users 
              WHERE UserID = @UserID
          `);

      res.status(200).json({
          success: true,
          message: 'User membership status updated successfully',
          data: updatedUser.recordset[0]
      });

  } catch (err) {
      console.error('Error updating user membership:', err);
      res.status(500).json({ 
          success: false, 
          error: 'Failed to update user membership status',
          details: err.message 
      });
  }
});
// PUT /api/members/:id/remove - Remove membership status
app.put('/api/members/:id/remove', async (req, res) => {
  try {
      const pool = await poolPromise;
      const userId = req.params.id;

      // Validate input
      if (!userId) {
          return res.status(400).json({
              success: false,
              error: 'User ID is required'
          });
      }

      // Check if user exists
      const userCheck = await pool.request()
          .input('UserID', sql.Int, userId)
          .query('SELECT UserID FROM Users WHERE UserID = @UserID');

      if (userCheck.recordset.length === 0) {
          return res.status(404).json({
              success: false,
              error: 'User not found'
          });
      }

      // Update membership status
      await pool.request()
          .input('UserID', sql.Int, userId)
          .query(`
              UPDATE Users 
              SET isMember = 0 
              WHERE UserID = @UserID
          `);

      res.status(200).json({
          success: true,
          message: 'Membership removed successfully'
      });

  } catch (err) {
      console.error('Error removing membership:', err);
      res.status(500).json({ 
          success: false, 
          error: 'Failed to remove membership',
          details: err.message 
      });
  }
});

app.put('/api/update-user/:userid', authenticate, async (req, res, next) => {
  try {
    const { Name, Phone, Email, OldPassword, NewPassword } = req.body;
    const targetUserId = parseInt(req.params.userid);
    const authenticatedUserId = req.user.UserID;

    // Validate required fields
    if (!targetUserId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID is required in URL' 
      });
    }

    // Authorization check - allow if admin or updating own profile
    const isAdmin = req.user.isAdmin; // Assuming you have isAdmin in your user object
    const isSelfUpdate = targetUserId === authenticatedUserId;

    if (!isAdmin && !isSelfUpdate) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update this user' 
      });
    }

    const pool = await poolPromise;
    
    // Get current user data
    const userResult = await pool.request()
      .input('UserID', sql.Int, targetUserId)
      .query('SELECT * FROM Users WHERE UserID = @UserID');

    if (userResult.recordset.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const currentUser = userResult.recordset[0];

    // Password verification if changing email or password (only for self-updates)
    if (isSelfUpdate && ((Email && Email !== currentUser.Email) || NewPassword)) {
      if (!OldPassword) {
        return res.status(400).json({ 
          success: false, 
          message: 'Current password is required for security changes' 
        });
      }
      
      const isMatch = await bcrypt.compare(OldPassword, currentUser.Password);
      if (!isMatch) {
        return res.status(400).json({ 
          success: false, 
          message: 'Current password is incorrect' 
        });
      }
    }

    // Build the update query
    let updateFields = [];
    let inputs = {
      UserID: { type: sql.Int, value: targetUserId }
    };

    if (Name !== undefined) {
      updateFields.push('Name = @Name');
      inputs.Name = { type: sql.NVarChar, value: Name };
    }
    
    if (Phone !== undefined) {
      updateFields.push('Phone = @Phone');
      inputs.Phone = { type: sql.NVarChar, value: Phone };
    }
    
    if (Email !== undefined && (isSelfUpdate || isAdmin)) {
      updateFields.push('Email = @Email');
      inputs.Email = { type: sql.NVarChar, value: Email };
    }
    
    if (NewPassword && (isSelfUpdate || isAdmin)) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(NewPassword, salt);
      updateFields.push('Password = @Password');
      inputs.Password = { type: sql.NVarChar, value: hashedPassword };
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No fields provided for update' 
      });
    }

    // Build and execute the query
    const updateQuery = `UPDATE Users SET ${updateFields.join(', ')} WHERE UserID = @UserID`;
    const request = pool.request();

    // Add all inputs to the request
    Object.keys(inputs).forEach(key => {
      request.input(key, inputs[key].type, inputs[key].value);
    });

    await request.query(updateQuery);

    // Return updated user data
    const updatedUser = {
      UserID: targetUserId,
      Name: Name || currentUser.Name,
      Phone: Phone || currentUser.Phone,
      Email: Email || currentUser.Email
    };

    res.json({ 
      success: true, 
      message: 'Profile updated successfully',
      data: updatedUser
    });

  } catch (error) {
    console.error('Error in update-user:', error);
    next(error);
  }
});
app.get('/api/chefs', async (req, res, next) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query("SELECT * FROM Staff WHERE Role = 'Chef'");

    res.status(200).json({
      success: true,
      count: result.recordset.length,
      data: result.recordset
    });
  } catch (err) {
    next(err);
  }
});



// In your main server file (e.g., app.js or server.js)
app.put('/api/update-user', authenticate, async (req, res, next) => {
  try {
    const { Name, Phone, Email, OldPassword, NewPassword } = req.body;
    const UserId = req.user.UserID; // Get from authenticated user

    // Validate required fields
    if (!UserId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID is required' 
      });
    }

    const pool = await poolPromise;
    
    // Get current user data
    const userResult = await pool.request()
      .input('UserID', sql.Int, UserId)
      .query('SELECT * FROM Users WHERE UserID = @UserID');

    if (userResult.recordset.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const currentUser = userResult.recordset[0];

    // Password verification if changing email or password
    if ((Email && Email !== currentUser.Email) || NewPassword) {
      if (!OldPassword) {
        return res.status(400).json({ 
          success: false, 
          message: 'Current password is required for security changes' 
        });
      }
      
      const isMatch = await bcrypt.compare(OldPassword, currentUser.Password);
      if (!isMatch) {
        return res.status(400).json({ 
          success: false, 
          message: 'Current password is incorrect' 
        });
      }
    }

    // Build the update query
    let updateFields = [];
    let inputs = {
      UserID: { type: sql.Int, value: UserId }
    };

    if (Name !== undefined) {
      updateFields.push('Name = @Name');
      inputs.Name = { type: sql.NVarChar, value: Name };
    }
    
    if (Phone !== undefined) {
      updateFields.push('Phone = @Phone');
      inputs.Phone = { type: sql.NVarChar, value: Phone };
    }
    
    if (Email !== undefined) {
      updateFields.push('Email = @Email');
      inputs.Email = { type: sql.NVarChar, value: Email };
    }
    
    if (NewPassword) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(NewPassword, salt);
      updateFields.push('Password = @Password');
      inputs.Password = { type: sql.NVarChar, value: hashedPassword };
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No fields provided for update' 
      });
    }

    // Build and execute the query
    const updateQuery = `UPDATE Users SET ${updateFields.join(', ')} WHERE UserID = @UserID`;
    const request = pool.request();

    // Add all inputs to the request
    Object.keys(inputs).forEach(key => {
      request.input(key, inputs[key].type, inputs[key].value);
    });

    await request.query(updateQuery);

    // Return updated user data
    const updatedUser = {
      UserID: UserId,
      Name: Name || currentUser.Name,
      Phone: Phone || currentUser.Phone,
      Email: Email || currentUser.Email
    };

    res.json({ 
      success: true, 
      message: 'Profile updated successfully',
      data: updatedUser
    });

  } catch (error) {
    console.error('Error in update-user:', error);
    next(error);
  }
});
app.get('/api/profile/:userId', async (req, res, next) => {
  try {
    const pool = await poolPromise;
    const userId = parseInt(req.params.userId, 10);

    // Validate userId
    if (isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid userId' });
    }

    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query("SELECT Name, Email, Phone FROM Users WHERE UserID = @userId");

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: result.recordset[0]
    });
  } catch (err) {
    next(err);
  }
});






// Users Endpoints
app.get('/api/feedback', authenticate, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Admin access required'
      });
    }

    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        f.FeedbackID,
        f.UserID,
        u.Name AS UserName,
        f.Rating,
        f.Comments,
        CONVERT(varchar, f.FeedbackDate, 23) AS FeedbackDate
      FROM Feedback f
      LEFT JOIN Users u ON f.UserID = u.UserID
      ORDER BY f.FeedbackDate DESC
    `);

    res.status(200).json({
      success: true,
      count: result.recordset.length,
      data: result.recordset
    });

  } catch (err) {
    console.error('Feedback fetch error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback',
      error: err.message
    });
  }
});
// GET available tables API





// GET available tables API using query parameters
// GET available tables API
app.post('/available-tables', async (req, res) => {
    try {
      const { date, startTime, endTime, capacity } = req.body;
  
      // Validate input
      if (!date || startTime == null || endTime == null || !capacity) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields (date, startTime, endTime, capacity)',
        });
      }
  
      const inputDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
  
      if (inputDate < today) {
        return res.status(400).json({
          success: false,
          message: 'Reservation date must be today or in the future',
        });
      }
  
      const pool = await poolPromise;
  
      const result = await pool.request()
        .input('Date', sql.Date, date)
        .input('StartTime', sql.Int, startTime)
        .input('EndTime', sql.Int, endTime)
        .input('Capacity', sql.Int, capacity)
        .query(`
          SELECT t.TableID, t.Location, t.Capacity, tt.Type
          FROM Tables t
          JOIN TableType tt ON t.TableTypeID = tt.TableTypeID
          WHERE t.Capacity >= @Capacity
          AND t.TableID NOT IN (
              SELECT r.TableID
              FROM Reservations r
              WHERE r.Date = @Date
                AND NOT (
                    r.EndTime <= @StartTime OR r.StartTime >= @EndTime
                )
          )
        `);
  
      res.status(200).json({
        success: true,
        data: result.recordset,
      });
    } catch (err) {
      console.error('Error fetching available tables:', err);
      res.status(500).json({
        success: false,
        message: 'Database error',
        error: err.message,
      });
    }
  });
  

// Get payments by customer ID

app.get('/payments/customer/:id', async (req, res) => {
    try {
        const customerId = parseInt(req.params.id);

        if (isNaN(customerId)) {
            return res.status(400).json({ success: false, error: 'Invalid customer ID' });
        }

        const pool = await poolPromise;
        const request = pool.request();
        request.input('CustomerID', sql.Int, customerId);

        const result = await request.query(`
            SELECT 
                p.PaymentID,
                p.OrderID,
                o.Status AS OrderStatus,
                p.Amount,
                p.PaymentMethod,
                p.Status AS PaymentStatus,
                p.UserID AS CustomerID,
                u.Name AS CustomerName,
                u.Email AS CustomerEmail,
                FORMAT(p.PaymentDate, 'yyyy-MM-dd') AS PaymentDate
            FROM Payments p
            INNER JOIN Users u ON p.UserID = u.UserID
            LEFT JOIN Orders o ON p.OrderID = o.OrderID
            WHERE p.UserID = @CustomerID AND p.Status = 'Completed'
            ORDER BY p.PaymentDate DESC;
        `);

        res.status(200).json({
            success: true,
            count: result.recordset.length,
            data: result.recordset
        });

    } catch (err) {
        console.error('Error fetching payment data:', err);
        res.status(500).json({ 
            success: false, 
            error: 'Server error', 
            details: err.message 
        });
    }
});




app.get('/PendingPayments/customer/:id', async (req, res) => {
    try {
        const customerId = parseInt(req.params.id);

        if (isNaN(customerId)) {
            return res.status(400).json({ success: false, error: 'Invalid customer ID' });
        }

        const pool = await poolPromise;
        const request = pool.request();
        request.input('CustomerID', sql.Int, customerId);

        const result = await request.query(`
            SELECT 
                p.PaymentID,
                p.OrderID,
                o.Status AS OrderStatus,
                p.Amount,
                p.PaymentMethod,
                p.Status AS PaymentStatus,
                p.UserID AS CustomerID,
                u.Name AS CustomerName,
                u.Email AS CustomerEmail,
                FORMAT(p.PaymentDate, 'yyyy-MM-dd') AS PaymentDate
            FROM Payments p
            INNER JOIN Users u ON p.UserID = u.UserID
            LEFT JOIN Orders o ON p.OrderID = o.OrderID
            WHERE p.UserID = @CustomerID AND p.Status = 'Pending'
            ORDER BY p.PaymentDate DESC;
        `);

        res.status(200).json({
            success: true,
            count: result.recordset.length,
            data: result.recordset
        });

    } catch (err) {
        console.error('Error fetching payment data:', err);
        res.status(500).json({ 
            success: false, 
            error: 'Server error', 
            details: err.message 
        });
    }
});
app.post('/api/verify-user', async (req, res) => {
  try {
    const pool = await poolPromise;
    const { email, phone } = req.body;

    // Validate input
    if (!email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Email and phone number are required'
      });
    }

    // Check if user exists with matching email and phone
    const userCheck = await pool.request()
      .input('Email', sql.VarChar(100), email)
      .input('Phone', sql.VarChar(20), phone)
      .query(`
        SELECT UserID 
        FROM Users 
        WHERE Email = @Email AND Phone = @Phone
      `);

    if (userCheck.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No account found with matching email and phone number'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Account verified'
    });

  } catch (err) {
    console.error('Error verifying user:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to verify account',
      error: err.message 
    });
  }
});

// Reset password endpoint
app.put('/api/reset-password', async (req, res) => {
  try {
    const pool = await poolPromise;
    const { email, phone, newPassword } = req.body;

    // Validate input
    if (!email || !phone || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, phone number and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Check if user exists with matching email and phone
    const userCheck = await pool.request()
      .input('Email', sql.VarChar(100), email)
      .input('Phone', sql.VarChar(20), phone)
      .query(`
        SELECT UserID 
        FROM Users 
        WHERE Email = @Email AND Phone = @Phone
      `);

    if (userCheck.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No account found with matching email and phone number'
      });
    }

    const userId = userCheck.recordset[0].UserID;

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await pool.request()
      .input('UserID', sql.Int, userId)
      .input('Password', sql.VarChar(255), hashedPassword)
      .query(`
        UPDATE Users 
        SET Password = @Password
        WHERE UserID = @UserID
      `);

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (err) {
    console.error('Error resetting password:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to reset password',
      error: err.message 
    });
  }
});
  
// FEEDBACK APIS
// Submit feedback
app.post('/api/feedback', async (req, res) => {
  try {
    const pool = await poolPromise;
    const { userId, rating, comments } = req.body;

    // Validate input
    if (!userId || !rating) {
      return res.status(400).json({
        success: false,
        error: 'UserID and rating are required'
      });
    }

    if (rating < 1 || rating > 10) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be between 1 and 10'
      });
    }

    // Check if user exists
    const userCheck = await pool.request()
      .input('UserID', sql.Int, userId)
      .query('SELECT UserID FROM Users WHERE UserID = @UserID');

    if (userCheck.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Insert feedback
    const result = await pool.request()
      .input('UserID', sql.Int, userId)
      .input('Rating', sql.TinyInt, rating)
      .input('Comments', sql.NVarChar(500), comments || null)
      .query(`
        INSERT INTO Feedback (UserID, Rating, Comments)
        VALUES (@UserID, @Rating, @Comments)
        
        SELECT * FROM Feedback WHERE FeedbackID = SCOPE_IDENTITY()
      `);

    const feedback = result.recordset[0];

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: feedback
    });

  } catch (err) {
    console.error('Feedback submission error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to submit feedback',
      details: err.message 
    });
  }
});

// Get user's feedback history
app.get('/api/feedback/user/:userId', async (req, res) => {
  try {
    const pool = await poolPromise;
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid UserID'
      });
    }

    const result = await pool.request()
      .input('UserID', sql.Int, userId)
      .query(`
        SELECT f.*, u.Name AS UserName
        FROM Feedback f
        JOIN Users u ON f.UserID = u.UserID
        WHERE f.UserID = @UserID
        ORDER BY f.FeedbackDate DESC
      `);

    res.status(200).json({
      success: true,
      data: result.recordset
    });

  } catch (err) {
    console.error('Feedback fetch error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch feedback',
      details: err.message 
    });
  }
});


app.get('/api/feedback', authenticate, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Admin access required'
      });
    }

    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        f.FeedbackID,
        f.UserID,
        u.Name AS UserName,
        f.Rating,
        f.Comments,
        f.FeedbackDate
      FROM Feedback f
      JOIN Users u ON f.UserID = u.UserID
      ORDER BY f.FeedbackDate DESC
    `);

    res.status(200).json({
      success: true,
      data: result.recordset
    });

  } catch (err) {
    console.error('Feedback fetch error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback',
      error: err.message
    });
  }
});




























  

 

// Menu Endpoints
app.get('/menu', async (req, res, next) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM Menu');
    res.json({
      success: true,
      count: result.recordset.length,
      data: result.recordset
    });
  } catch (err) {
    next(err);
  }
});

app.post('/menu', async (req, res, next) => {
    try {
      const { ItemName, Category, Price } = req.body;
      
      if (!ItemName || !Price) {
        return res.status(400).json({
          success: false,
          message: 'ItemName and Price are required'
        });
      }
  
      const pool = await poolPromise;
      
      // Insert the new menu item
      await pool.request()
        .input('ItemName', sql.VarChar(100), ItemName)
        .input('Category', sql.VarChar(50), Category || 'Other')
        .input('Price', sql.Decimal(10,2), Price)
        .query(`
          INSERT INTO Menu (ItemName, Category, Price)
          VALUES (@ItemName, @Category, @Price)
        `);
      
      // Now retrieve all menu items ordered by Category
      const result = await pool.request()
        .query(`
          SELECT ItemName, Category, Price 
          FROM Menu 
          ORDER BY Category, ItemName
        `);
      
      res.status(201).json({
        success: true,
        message: 'Menu item added successfully',
        menuItems: result.recordset
      });
    } catch (err) {
      next(err);
    }
  });
// Tables Endpoints
app.get('/tables', async (req, res, next) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT t.*, tt.Type AS TableType 
      FROM Tables t
      JOIN TableType tt ON t.TableTypeID = tt.TableTypeID
    `);
    res.json({
      success: true,
      count: result.recordset.length,
      data: result.recordset
    });
  } catch (err) {
    next(err);
  }
});

// Reservations Endpoints
app.post('/reservations', async (req, res, next) => {
  try {
    const { UserID, TableID, Date, StartTime, EndTime, People } = req.body;
    
    if (!UserID || !TableID || !Date || !StartTime || !EndTime || !People) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    const pool = await poolPromise;
    await pool.request()
      .input('UserID', sql.Int, UserID)
      .input('TableID', sql.Int, TableID)
      .input('Date', sql.Date, Date)
      .input('StartTime', sql.Int, StartTime)
      .input('EndTime', sql.Int, EndTime)
      .input('People', sql.Int, People)
      .query(`
        INSERT INTO Reservations 
        (UserID, TableID, Date, StartTime, EndTime, People)
        VALUES (@UserID, @TableID, @Date, @StartTime, @EndTime, @People)
      `);
    
    res.status(201).json({
      success: true,
      message: 'Reservation created successfully'
    });
  } catch (err) {
    next(err);
  }
});

// Reservations
app.get('/reservations', async (req, res, next) => {
  try {
    const { date, userID, tableID, status } = req.query;
    const pool = await poolPromise;
    
    let query = `
      SELECT 
        r.ReservationID,
        r.UserID,
        r.TableID,
        CONVERT(varchar, r.Date, 23) as Date, -- Format as YYYY-MM-DD
        r.StartTime,
        r.EndTime,
        r.People,
        r.Status,
        r.SatisfactionRating,
        u.Name as UserName
      FROM Reservations r
      LEFT JOIN Users u ON r.UserID = u.UserID
      WHERE 1=1
    `;
    
    const request = pool.request();

    // Add filters
    if (date) {
      query += ' AND r.Date = @Date';
      request.input('Date', sql.Date, date);
    }
    if (userID) {
      query += ' AND r.UserID = @UserID';
      request.input('UserID', sql.Int, userID);
    }
    if (tableID) {
      query += ' AND r.TableID = @TableID';
      request.input('TableID', sql.Int, tableID);
    }
    if (status) {
      query += ' AND r.Status = @Status';
      request.input('Status', sql.VarChar(20), status);
    }

    // Order by date and time
    query += ' ORDER BY r.Date DESC, r.StartTime ASC';

    const result = await request.query(query);
    
    res.status(200).json({
      success: true,
      count: result.recordset.length,
      data: result.recordset
    });
  } catch (err) {
    next(err);
  }
});
/**
 * @route GET /reservations/user/:userId
 * @description Get all reservations for a specific user
 * @returns {Array} List of reservations for the user
 */
app.get('/reservationsByUserId/:userId', async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { status, fromDate, toDate } = req.query;
      const pool = await poolPromise;
      
      let query = `
        SELECT 
          r.ReservationID,
          r.UserID,
          u.Name AS UserName,
          r.TableID,
          t.Location AS TableLocation,
          t.Capacity AS TableCapacity,
          r.Date,
          r.StartTime,
          r.EndTime,
          r.People,
          r.Status,
          r.SatisfactionRating
        FROM Reservations r
        LEFT JOIN Users u ON r.UserID = u.UserID
        LEFT JOIN Tables t ON r.TableID = t.TableID
        WHERE r.UserID = @UserID
      `;
      
      const request = pool.request()
        .input('UserID', sql.Int, userId);
  
      // Optional filters
      if (status) {
        query += ' AND r.Status = @Status';
        request.input('Status', sql.VarChar(20), status);
      }
      
      if (fromDate) {
        query += ' AND r.Date >= @FromDate';
        request.input('FromDate', sql.Date, fromDate);
      }
      
      if (toDate) {
        query += ' AND r.Date <= @ToDate';
        request.input('ToDate', sql.Date, toDate);
      }
  
      // Order by most recent first
      query += ' ORDER BY r.Date DESC, r.StartTime DESC';
  
      const result = await request.query(query);
      
      res.status(200).json({
        success: true,
        count: result.recordset.length,
        data: result.recordset
      });
      
    } catch (err) {
      next(err);
    }
  });
app.get('/reservations/:id', async (req, res, next) => {
    try {
      const { id } = req.params;
      const pool = await poolPromise;
      
      const result = await pool.request()
        .input('ReservationID', sql.Int, id)
        .query(`
          SELECT 
            r.ReservationID,
            r.UserID,
            u.Name AS UserName,
            r.TableID,
            t.Location AS TableLocation,
            t.Capacity AS TableCapacity,
            r.Date,
            r.StartTime,
            r.EndTime,
            r.People,
            r.Status,
            r.SatisfactionRating
            ${/* Removed CreatedAt */''}
          FROM Reservations r
          LEFT JOIN Users u ON r.UserID = u.UserID
          LEFT JOIN Tables t ON r.TableID = t.TableID
          WHERE r.ReservationID = @ReservationID
        `);
  
      if (result.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Reservation not found'
        });
      }
  
      res.status(200).json({
        success: true,
        data: result.recordset[0]
      });
    } catch (err) {
      next(err);
    }
  });
// Start the server
app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  
  // Test database connection on startup
  try {
    const pool = await poolPromise;
    await pool.request().query('SELECT 1');
    console.log('Database connection established successfully');
  } catch (err) {
    console.error('Failed to connect to database:', err);
    process.exit(1);
  }
});

// Staff Endpoints
app.get('/staff', async (req, res, next) => {
    try {
      const pool = await poolPromise;
      const result = await pool.request().query('SELECT * FROM Staff');
      
      res.status(200).json({
        success: true,
        count: result.recordset.length,
        data: result.recordset
      });
    } catch (err) {
      next(err);
    }
  });


  // ... (keep all your existing code above the Staff Endpoints section)

// ==================== STAFF ENDPOINTS ====================

// GET all staff
app.get('/staff', async (req, res, next) => {
    try {
      const pool = await poolPromise;
      const result = await pool.request().query('SELECT * FROM Staff');
      
      res.status(200).json({
        success: true,
        count: result.recordset.length,
        data: result.recordset
      });
    } catch (err) {
      next(err);
    }
  });
  
  // POST create staff
  app.post('/staff', async (req, res, next) => {
    try {
      const { Name, Role, ContactInfo } = req.body;
      
      if (!Name || !Role) {
        return res.status(400).json({
          success: false,
          message: 'Name and Role are required'
        });
      }
  
      const pool = await poolPromise;
      const result = await pool.request()
        .input('Name', sql.VarChar(100), Name)
        .input('Role', sql.VarChar(50), Role)
        .input('ContactInfo', sql.VarChar(100), ContactInfo || null)
        .query(`
          INSERT INTO Staff (Name, Role, ContactInfo)
          OUTPUT INSERTED.*
          VALUES (@Name, @Role, @ContactInfo)
        `);
      
      res.status(201).json({
        success: true,
        message: 'Staff created successfully',
        data: result.recordset[0]
      });
    } catch (err) {
      next(err);
    }
  });
  
  // DELETE staff
  app.delete('/staff/:id', async (req, res, next) => {
    try {
      const { id } = req.params;
      const pool = await poolPromise;
      const result = await pool.request()
        .input('StaffID', sql.Int, id)
        .query('DELETE FROM Staff WHERE StaffID = @StaffID');
  
      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ success: false, message: 'Staff not found' });
      }
  
      res.json({ success: true, message: 'Staff deleted successfully' });
    } catch (err) {
      next(err);
    }
  });
  
  // ==================== TABLE TYPE ENDPOINTS ====================
  
  // GET all table types
  app.get('/table-types', async (req, res, next) => {
    try {
      const pool = await poolPromise;
      const result = await pool.request().query('SELECT * FROM TableType');
      
      res.status(200).json({
        success: true,
        count: result.recordset.length,
        data: result.recordset
      });
    } catch (err) {
      next(err);
    }
  });
  
  // POST create table type
  app.post('/table-types', async (req, res, next) => {
    try {
      const { Type } = req.body;
      
      if (!Type) {
        return res.status(400).json({
          success: false,
          message: 'Type is required'
        });
      }
  
      const pool = await poolPromise;
      const result = await pool.request()
        .input('Type', sql.VarChar(50), Type)
        .query(`
          INSERT INTO TableType (Type)
          OUTPUT INSERTED.*
          VALUES (@Type)
        `);
      
      res.status(201).json({
        success: true,
        message: 'Table type created successfully',
        data: result.recordset[0]
      });
    } catch (err) {
      next(err);
    }
  });
  
  // DELETE table type
  app.delete('/table-types/:id', async (req, res, next) => {
    try {
      const { id } = req.params;
      const pool = await poolPromise;
      const result = await pool.request()
        .input('TableTypeID', sql.Int, id)
        .query('DELETE FROM TableType WHERE TableTypeID = @TableTypeID');
  
      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ success: false, message: 'Table type not found' });
      }
  
      res.json({ success: true, message: 'Table type deleted successfully' });
    } catch (err) {
      if (err.number === 547) { // Foreign key constraint
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot delete table type that is in use by tables' 
        });
      }
      next(err);
    }
  });
  
  // ==================== TABLES ENDPOINTS ====================
  
  // POST create table (already exists, adding for completeness)
  app.post('/tables', async (req, res, next) => {
    try {
      const { TableTypeID, Location, Capacity } = req.body;
      
      if (!TableTypeID || !Capacity) {
        return res.status(400).json({
          success: false,
          message: 'TableTypeID and Capacity are required'
        });
      }
  
      const pool = await poolPromise;
      const result = await pool.request()
        .input('TableTypeID', sql.Int, TableTypeID)
        .input('Location', sql.VarChar(100), Location || null)
        .input('Capacity', sql.Int, Capacity)
        .query(`
          INSERT INTO Tables (TableTypeID, Location, Capacity)
          OUTPUT INSERTED.*
          VALUES (@TableTypeID, @Location, @Capacity)
        `);
      
      res.status(201).json({
        success: true,
        message: 'Table created successfully',
        data: result.recordset[0]
      });
    } catch (err) {
      next(err);
    }
  });
  
  // DELETE table
  app.delete('/tables/:id', async (req, res, next) => {
    try {
      const { id } = req.params;
      const pool = await poolPromise;
      const result = await pool.request()
        .input('TableID', sql.Int, id)
        .query('DELETE FROM Tables WHERE TableID = @TableID');
  
      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ success: false, message: 'Table not found' });
      }
  
      res.json({ success: true, message: 'Table deleted successfully' });
    } catch (err) {
      if (err.number === 547) { // Foreign key constraint
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot delete table with existing reservations' 
        });
      }
      next(err);
    }
  });
  
  // ==================== ORDERS ENDPOINTS ====================
  
  // GET all orders
  app.get('/orders', async (req, res, next) => {
    try {
      const pool = await poolPromise;
      const result = await pool.request().query(`
        SELECT o.*, u.Name AS UserName, r.ReservationID
        FROM Orders o
        LEFT JOIN Users u ON o.UserID = u.UserID
        LEFT JOIN Reservations r ON o.ReservationID = r.ReservationID
      `);
      
      res.status(200).json({
        success: true,
        count: result.recordset.length,
        data: result.recordset
      });
    } catch (err) {
      next(err);
    }
  });
  
  // POST create order
  app.post('/orders', async (req, res, next) => {
    try {
      const { ReservationID, UserID, Status } = req.body;
      
      if (!UserID) {
        return res.status(400).json({
          success: false,
          message: 'UserID is required'
        });
      }
  
      const pool = await poolPromise;
      const result = await pool.request()
        .input('ReservationID', sql.Int, ReservationID || null)
        .input('UserID', sql.Int, UserID)
        .input('Status', sql.VarChar(20), Status || 'Pending')
        .query(`
          INSERT INTO Orders (ReservationID, UserID, Status)
          OUTPUT INSERTED.*
          VALUES (@ReservationID, @UserID, @Status)
        `);
      
      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: result.recordset[0]
      });
    } catch (err) {
      next(err);
    }
  });
  
  // DELETE order
  app.delete('/orders/:id', async (req, res, next) => {
    try {
      const { id } = req.params;
      const pool = await poolPromise;
      const result = await pool.request()
        .input('OrderID', sql.Int, id)
        .query('DELETE FROM Orders WHERE OrderID = @OrderID');
  
      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
  
      res.json({ success: true, message: 'Order deleted successfully' });
    } catch (err) {
      if (err.number === 547) { // Foreign key constraint
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot delete order with existing order details or payments' 
        });
      }
      next(err);
    }
  });
  
  // ==================== ORDER DETAILS ENDPOINTS ====================
  
  // GET all order details
  app.get('/order-details', async (req, res, next) => {
    try {
      const pool = await poolPromise;
      const result = await pool.request().query(`
        SELECT od.*, m.ItemName
        FROM OrderDetails od
        JOIN Menu m ON od.ItemID = m.ItemID
      `);
      
      res.status(200).json({
        success: true,
        count: result.recordset.length,
        data: result.recordset
      });
    } catch (err) {
      next(err);
    }
  });
  
  
  
  // DELETE order detail
  app.delete('/order-details/:id', async (req, res, next) => {
    try {
      const { id } = req.params;
      const pool = await poolPromise;
      const result = await pool.request()
        .input('OrderDetailID', sql.Int, id)
        .query('DELETE FROM OrderDetails WHERE OrderDetailID = @OrderDetailID');
  
      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ success: false, message: 'Order detail not found' });
      }
  
      res.json({ success: true, message: 'Order detail deleted successfully' });
    } catch (err) {
      next(err);
    }
  });
  
  // ==================== PAYMENTS ENDPOINTS ====================
  
  // GET all payments
  app.get('/payments', async (req, res, next) => {
    try {
      const pool = await poolPromise;
      const result = await pool.request().query(`
        SELECT p.*, o.OrderID, u.Name AS UserName
        FROM Payments p
        JOIN Orders o ON p.OrderID = o.OrderID
        JOIN Users u ON o.UserID = u.UserID
      `);
      
      res.status(200).json({
        success: true,
        count: result.recordset.length,
        data: result.recordset
      });
    } catch (err) {
      next(err);
    }
  });
  
  // POST create payment
  app.post('/payments', async (req, res, next) => {
    try {
      const { OrderID, Amount, PaymentMethod, Status } = req.body;
      
      if (!OrderID || !Amount || !PaymentMethod) {
        return res.status(400).json({
          success: false,
          message: 'OrderID, Amount and PaymentMethod are required'
        });
      }
  
      const pool = await poolPromise;
      const result = await pool.request()
        .input('OrderID', sql.Int, OrderID)
        .input('Amount', sql.Decimal(10,2), Amount)
        .input('PaymentMethod', sql.VarChar(50), PaymentMethod)
        .input('Status', sql.VarChar(20), Status || 'Pending')
        .query(`
          INSERT INTO Payments (OrderID, Amount, PaymentMethod, Status)
          OUTPUT INSERTED.*
          VALUES (@OrderID, @Amount, @PaymentMethod, @Status)
        `);
      
      res.status(201).json({
        success: true,
        message: 'Payment created successfully',
        data: result.recordset[0]
      });
    } catch (err) {
      next(err);
    }
  });
  
  // DELETE payment
  app.delete('/payments/:id', async (req, res, next) => {
    try {
      const { id } = req.params;
      const pool = await poolPromise;
      const result = await pool.request()
        .input('PaymentID', sql.Int, id)
        .query('DELETE FROM Payments WHERE PaymentID = @PaymentID');
  
      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ success: false, message: 'Payment not found' });
      }
  
      res.json({ success: true, message: 'Payment deleted successfully' });
    } catch (err) {
      next(err);
    }
  });
  
  // Start the server (keep this at the end)
  app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // Test database connection on startup
    try {
      const pool = await poolPromise;
      await pool.request().query('SELECT 1');
      console.log('Database connection established successfully');
    } catch (err) {
      console.error('Failed to connect to database:', err);
      process.exit(1);
    }
  });
  
async function hashAllPasswords() {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    
    try {
        await transaction.begin();
        
        // Create Config table if it doesn't exist
        await transaction.request()
            .query(`IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Config')
                   CREATE TABLE Config (
                       ConfigKey NVARCHAR(50) PRIMARY KEY,
                       ConfigValue NVARCHAR(255),
                       LastUpdated DATETIME DEFAULT GETDATE()
                   )`);

        // Check if hashing was already done
        const checkResult = await transaction.request()
            .query(`SELECT ConfigValue FROM Config WHERE ConfigKey = 'passwords_hashed'`);
        
        if (checkResult.recordset.length > 0) {
            console.log('Passwords already hashed - skipping');
            await transaction.commit();
            return;
        }

        // Get only unhashed passwords (those not starting with bcrypt pattern)
        const usersResult = await transaction.request()
            .query(`SELECT UserID, Password FROM Users 
                    WHERE Password NOT LIKE '$2a$%' 
                    AND Password IS NOT NULL 
                    AND Password <> ''`);
        
        if (usersResult.recordset.length === 0) {
            console.log('All passwords appear to be hashed already');
            await transaction.request()
                .query(`INSERT INTO Config (ConfigKey, ConfigValue) 
                        VALUES ('passwords_hashed', 'true')`);
            await transaction.commit();
            return;
        }

        console.log(`Found ${usersResult.recordset.length} passwords to hash...`);

        // Hash each password
        for (const user of usersResult.recordset) {
            try {
                const hashedPassword = await bcrypt.hash(user.Password, 10);
                await transaction.request()
                    .input('UserID', sql.Int, user.UserID)
                    .input('Password', sql.NVarChar(255), hashedPassword)
                    .query('UPDATE Users SET Password = @Password WHERE UserID = @UserID');
            } catch (hashError) {
                console.error(`Failed to hash password for UserID ${user.UserID}:`, hashError);
                throw hashError;
            }
        }

        // Mark as complete
        await transaction.request()
            .query(`INSERT INTO Config (ConfigKey, ConfigValue) 
                    VALUES ('passwords_hashed', 'true')`);
        
        await transaction.commit();
        console.log(`Successfully hashed ${usersResult.recordset.length} passwords`);
    } catch (error) {
        await transaction.rollback();
        console.error('Error in hashAllPasswords:', error);
        throw error;
    }
}
hashAllPasswords();
  // Login endpoint
app.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
  
      // Basic validation
      if (!email || !password) {
        return res.status(400).json({ 
          success: false,
          message: 'Email and password are required' 
        });
      }
  
      const pool = await poolPromise;
      const result = await pool.request()
        .input('email', sql.NVarChar(100), email)
        .query('SELECT UserID, Name, Email, Password, isAdmin,isMember FROM Users WHERE Email = @email');
  
      if (result.recordset.length === 0) {
        return res.status(401).json({ 
          success: false,
          message: 'Invalid credentials' 
        });
      }
  
      const user = result.recordset[0];
      const isMatch = await bcrypt.compare(password, user.Password);
  
      if (!isMatch) {
        return res.status(401).json({ 
          success: false,
          message: 'Invalid credentials' 
        });
      }
  
      const token = jwt.sign(
        { 
          UserID: user.UserID, 
          Email: user.Email,
          isAdmin: user.isAdmin 
        }, 
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );
  
      // Return user data without password
      const userData = {
        UserID: user.UserID,
        Name: user.Name,
        Email: user.Email,
        isAdmin: user.isAdmin
      };
  
      res.json({ 
        success: true,
        token,
        user: userData
      });
  
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Server error during login' 
      });
    }
  });


// Add this before app.listen()
