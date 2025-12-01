-- Create the database
CREATE DATABASE GAS_
GO

USE GAS_
GO

-- Create Users table
CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Phone VARCHAR(20),
    Email VARCHAR(100),
    Password VARCHAR(255) NOT NULL,
    isAdmin BIT DEFAULT 0,
    isMember BIT DEFAULT 0
);
GO

-- Create TableType table
CREATE TABLE TableType (
    TableTypeID INT IDENTITY(1,1) PRIMARY KEY,
    Type VARCHAR(50) NOT NULL
);
GO

-- Create Tables table
CREATE TABLE Tables (
    TableID INT IDENTITY(1,1) PRIMARY KEY,
    TableTypeID INT,
    Location VARCHAR(100),
    Capacity INT NOT NULL,
    
    CONSTRAINT FK_Tables_TableTypeID 
        FOREIGN KEY (TableTypeID) REFERENCES TableType(TableTypeID)
);
GO

-- Create Staff table
CREATE TABLE Staff (
    StaffID INT IDENTITY(1,1) PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Role VARCHAR(50) NOT NULL,
    ContactInfo VARCHAR(100)
);
GO

-- Create Menu table
CREATE TABLE Menu (
    ItemID INT IDENTITY(1,1) PRIMARY KEY,
    ItemName VARCHAR(100) NOT NULL,
    Category VARCHAR(50),
    Price DECIMAL(10,2) NOT NULL
);
GO

-- Create Reservations table
CREATE TABLE Reservations (
    ReservationID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT,
    TableID INT,
    Date DATE NOT NULL,
    StartTime INT NOT NULL,
    EndTime INT NOT NULL,
    People INT NOT NULL,
    Status VARCHAR(20) DEFAULT 'Confirmed',
    SatisfactionRating INT,
    
    CONSTRAINT FK_Reservations_UserID 
        FOREIGN KEY (UserID) REFERENCES Users(UserID),
    
    CONSTRAINT FK_Reservations_TableID 
        FOREIGN KEY (TableID) REFERENCES Tables(TableID),
    
    CONSTRAINT CHK_Reservation_Time_Range 
        CHECK (StartTime >= 8 AND StartTime <= 23 AND
               EndTime >= 8 AND EndTime <= 23 AND
               EndTime > StartTime),
    
    CONSTRAINT CHK_Reservation_People 
        CHECK (People > 0)
);
GO

-- Create Orders table
CREATE TABLE Orders (
    OrderID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT,
    Status VARCHAR(20) DEFAULT 'Pending',
    
    CONSTRAINT FK_Orders_UserID 
        FOREIGN KEY (UserID) REFERENCES Users(UserID)
);
GO

-- Create OrderDetails table
CREATE TABLE OrderDetails (
    OrderDetailID INT IDENTITY(1,1) PRIMARY KEY,
    OrderID INT NOT NULL,
    ItemID INT NULL, -- Must be nullable to allow SET NULL on delete
    Quantity INT NOT NULL,
    Price DECIMAL(10,2) NOT NULL,
    
    CONSTRAINT FK_OrderDetails_OrderID 
        FOREIGN KEY (OrderID) REFERENCES Orders(OrderID) ON DELETE CASCADE,
    
    CONSTRAINT FK_OrderDetails_ItemID 
        FOREIGN KEY (ItemID) REFERENCES Menu(ItemID) ON DELETE SET NULL,
    
    CONSTRAINT CHK_OrderDetails_Quantity 
        CHECK (Quantity > 0),
    
    CONSTRAINT CHK_OrderDetails_Price 
        CHECK (Price >= 0)
);
GO

-- Create Payments table
CREATE TABLE Payments (
    PaymentID INT IDENTITY(1,1) PRIMARY KEY,
    OrderID INT,
    Amount DECIMAL(10,2) NOT NULL,
    PaymentMethod VARCHAR(50) NOT NULL,
    Status VARCHAR(20) DEFAULT 'Pending',
    
    CONSTRAINT FK_Payments_OrderID 
        FOREIGN KEY (OrderID) REFERENCES Orders(OrderID),
    
    CONSTRAINT CHK_Payments_Amount 
        CHECK (Amount > 0)
);
GO

SELECT UserID, Name, Email, Password, isAdmin, isMember 
FROM Users 
WHERE Email = 'sarah.j@restaurant.com';
GO

-- Insert Users (3 admins, 3 non-admins with 1 member)
INSERT INTO Users (Name, Phone, Email, Password, isAdmin, isMember) VALUES
-- Admins
('John Smith', '555-0101', 'john.smith@restaurant.com', 'admin123', 1, 0),
('Sarah Johnson', '555-0102', 'sarah.j@restaurant.com', 'sarah123', 1, 0),
('Michael Brown', '555-0103', 'michael.b@restaurant.com', 'michael123', 1, 0),

-- Non-admins (1 member, 2 non-members)
('Emily Davis', '555-0201', 'emily.d@gmail.com', 'emily123', 0, 1),  -- Member
('David Wilson', '555-0202', 'david.w@outlook.com', 'david123', 0, 0),  -- Non-member
('Jessica Lee', '555-0203', 'jessica.l@yahoo.com', 'jessica123', 0, 0);  -- Non-member

-- Insert Staff
INSERT INTO Staff (Name, Role, ContactInfo) VALUES
('Robert Taylor', 'Manager', 'robert.t@restaurant.com, ext. 101'),
('Jennifer Martinez', 'Chef', 'jennifer.m@restaurant.com, ext. 102'),
('Thomas Anderson', 'Waiter', 'thomas.a@restaurant.com, ext. 103'),
('Lisa White', 'Hostess', 'lisa.w@restaurant.com, ext. 104');

-- Insert Table Types
INSERT INTO TableType (Type) VALUES
('Booth'),
('Round'),
('Bar'),
('Outdoor');

-- Insert Tables
INSERT INTO Tables (TableTypeID, Location, Capacity) VALUES
(1, 'Window side, left', 4),
(1, 'Window side, right', 4),
(2, 'Center area 1', 6),
(2, 'Center area 2', 8),
(3, 'Bar counter 1', 2),
(3, 'Bar counter 2', 2),
(4, 'Patio 1', 4),
(4, 'Patio 2', 4);

-- Insert Menu Items
INSERT INTO Menu (ItemName, Category, Price) VALUES
-- Starters
('Bruschetta', 'Appetizer', 8.99),
('Calamari', 'Appetizer', 12.99),
('Caesar Salad', 'Salad', 10.99),

-- Main Courses
('Spaghetti Carbonara', 'Pasta', 16.99),
('Grilled Salmon', 'Seafood', 22.99),
('Ribeye Steak', 'Meat', 28.99),
('Vegetable Risotto', 'Vegetarian', 15.99),

-- Desserts
('Tiramisu', 'Dessert', 7.99),
('Chocolate Lava Cake', 'Dessert', 8.99),

-- Drinks
('Mineral Water', 'Beverage', 3.50),
('House Wine', 'Beverage', 9.99),
('Craft Beer', 'Beverage', 6.99);

-- Insert Reservations (for non-admin users)
INSERT INTO Reservations (UserID, TableID, Date, StartTime, EndTime, People, Status, SatisfactionRating) VALUES
(4, 1, '2023-06-15', 12, 14, 3, 'Completed',4),  -- Emily (member)
(5, 3, '2023-06-15', 19, 21, 5, 'Completed',3),  -- David
(6, 7, '2023-06-16', 18, 20, 4, 'Completed',4),  -- Jessica
(4, 2, '2023-06-17', 13, 15, 2, 'Completed',5);  -- Emily
INSERT INTO Reservations (UserID, TableID, Date, StartTime, EndTime, People, Status,SatisfactionRating)
VALUES (1, 1, '2025-04-25', 12, 14, 4, 'Pending',NULL),
(3, 3, '2025-04-27', 10, 12, 3, 'Pending',NULL);

INSERT INTO Reservations (UserID, TableID, Date, StartTime, EndTime, People, Status, SatisfactionRating)
VALUES (2, 2, '2025-04-26', 18, 20, 2, 'Confirmed',NULL);

-- Insert another reservation with Status 'Completed'
INSERT INTO Reservations (UserID, TableID, Date, StartTime, EndTime, People, Status, SatisfactionRating)
VALUES (4, 4, '2025-04-28', 19, 21, 4, 'Confirmed', NULL);

-- Insert Orders (linked to reservations)
INSERT INTO Orders (UserID, Status) VALUES
(4, 'Completed'),  -- Emily's order
(5, 'Completed'),  -- David's order
(6, 'Pending'),    -- Jessica's order
(4, 'Completed'); -- Emily's walk-in order (no reservation)

-- Insert Order Details
INSERT INTO OrderDetails (OrderID, ItemID, Quantity, Price) VALUES
-- Emily's first order (with reservation)
(1, 4, 2, 16.99),  -- 2 Spaghetti Carbonara
(1, 5, 1, 22.99),  -- 1 Grilled Salmon
(1, 11, 3, 3.50),  -- 3 Mineral Water

-- David's order
(2, 6, 2, 28.99),   -- 2 Ribeye Steak
(2, 3, 2, 10.99),   -- 2 Caesar Salad
(2, 12, 1, 9.99),   -- 1 House Wine
(2, 13, 2, 6.99),   -- 2 Craft Beer

-- Jessica's order
(3, 7, 1, 15.99),   -- 1 Vegetable Risotto
(3, 1, 1, 8.99),    -- 1 Bruschetta
(3, 10, 1, 8.99),   -- 1 Chocolate Lava Cake

-- Emily's walk-in order
(4, 2, 1, 12.99),   -- 1 Calamari
(4, 5, 1, 22.99),   -- 1 Grilled Salmon
(4, 12, 1, 9.99);   -- 1 House Wine



Select * from Users

Select * from Reservations

Select * from Orders
Select * from OrderDetails




Select * from Orders

Select * from Menu


INSERT INTO OrderDetails (OrderID, ItemID, Quantity, Price) VALUES
-- Order 1
(1, 1, 2, 16.99),  -- Using ItemID 1 (Bruschetta)
(1, 2, 1, 22.99),  -- Using ItemID 2 (Calamari)
(1, 10, 3, 3.50),  -- Using ItemID 10 (Mineral Water)

-- Order 2
(2, 3, 2, 28.99),  -- Using ItemID 3 (Caesar Salad)
(2, 4, 2, 10.99),  -- Using ItemID 4 (Spaghetti Carbonara)
(2, 11, 1, 9.99),  -- Using ItemID 11 (House Wine)
(2, 12, 2, 6.99),  -- Using ItemID 12 (Craft Beer)

-- Order 3
(3, 5, 1, 15.99),  -- Using ItemID 5 (Grilled Salmon)
(3, 6, 1, 8.99),   -- Using ItemID 6 (Ribeye Steak)
(3, 9, 1, 8.99),   -- Using ItemID 9 (Chocolate Lava Cake)

-- Order 4
(4, 2, 1, 12.99),  -- Using ItemID 2 (Calamari)
(4, 5, 1, 22.99),  -- Using ItemID 5 (Grilled Salmon)
(4, 11, 1, 9.99);  

-- Step 1: Add the column
ALTER TABLE Payments
ADD CustomerID INT;

-- Step 2: Add the foreign key constraint
ALTER TABLE Payments
ADD CONSTRAINT FK_Payments_Customer
FOREIGN KEY (CustomerID) REFERENCES Users(UserID);

truncate table Payments;

select* from Menu

-- Insert Payments
INSERT INTO Payments (OrderID, Amount, PaymentMethod, Status,UserID) VALUES
(1, 72.46, 'Credit Card', 'Completed',4),  -- Emily's first order (subtotal + tax)
(2, 132.92, 'Cash', 'Completed',5),        -- David's order
(4, 45.97, 'Credit Card', 'Completed',4);   -- Emily's walk-in order

Select* from Payments

INSERT INTO Reservations (UserID, TableID, Date, StartTime, EndTime, People, Status, SatisfactionRating)
VALUES (1, 1, '2025-04-25', 12, 14, 4, 'Pending', NULL),
(3, 3, '2025-04-27', 10, 12, 3, 'Pending', NULL);

INSERT INTO Reservations (UserID, TableID, Date, StartTime, EndTime, People, Status, SatisfactionRating)
VALUES (2, 2, '2025-04-26', 18, 20, 2, 'Completed', 5);

-- Insert another reservation with Status 'Completed'
INSERT INTO Reservations (UserID, TableID, Date, StartTime, EndTime, People, Status, SatisfactionRating)
VALUES (4, 4, '2025-04-28', 19, 21, 4, 'Completed', 4);


use master;
go 
drop database GASS;
go


ALTER TABLE OrderDetails
DROP CONSTRAINT FK_OrderDetails_ItemID;

ALTER TABLE OrderDetails
ADD CONSTRAINT FK_OrderDetails_ItemID 
    FOREIGN KEY (ItemID) REFERENCES Menu(ItemID) ON DELETE SET NULL;

	select*from Customers
	Select * from Reservations
Select * from Payments
Select * from Users
Select * from Staff
Select * from Tables
Select * from TableType
select * from Orders
select * from OrderDetails

select* from Reservations;
select * from Menu

ALTER TABLE Payments
DROP CONSTRAINT FK_Payments_Customer;

-- Step 2: Rename the column from CustomerID to UserID
EXEC sp_rename 'Payments.CustomerID', 'UserID', 'COLUMN';

-- Step 3: Recreate the foreign key constraint with the new column name
ALTER TABLE Payments
ADD CONSTRAINT FK_Payments_UserID 
    FOREIGN KEY (UserID) REFERENCES Users(UserID);

	 
ALTER TABLE Payments
ADD PaymentDate DATE 
CONSTRAINT DF_Payments_PaymentDate DEFAULT GETDATE();  

CREATE TABLE Feedback (
    FeedbackID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    Rating TINYINT NOT NULL,
    Comments NVARCHAR(500) NULL,
    FeedbackDate DATE DEFAULT GETDATE(),

    CONSTRAINT FK_Feedback_UserID 
        FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,

    CONSTRAINT CHK_Feedback_Rating 
        CHECK (Rating BETWEEN 1 AND 10),

    CONSTRAINT UQ_User_Date UNIQUE (UserID, FeedbackDate)
);

-- Insert feedback from UserID 1
INSERT INTO Feedback (UserID, Rating, Comments)
VALUES (1, 9, 'Excellent service, very satisfied!');

-- Insert feedback from UserID 2
INSERT INTO Feedback (UserID, Rating, Comments)
VALUES (2, 7, 'Good overall, but there is room for improvement.');

-- Insert feedback from UserID 3
INSERT INTO Feedback (UserID, Rating, Comments)
VALUES (3, 10, 'Perfect experience! Highly recommend.');

-- Insert feedback from UserID 1 again with a different rating
INSERT INTO Feedback (UserID, Rating, Comments)
VALUES (1, 6, 'Support was okay but slow response time.');

-- Insert feedback without a comment (NULL value for Comments)
INSERT INTO Feedback (UserID, Rating, Comments)
VALUES (2, 8, NULL);




Select * from Reservations
Select * from Payments
Select * from Users
Select * from Staff
Select * from Tables
Select * from TableType
select * from Orders
select * from OrderDetails
select * from Feedback
select* from Reservations;
select * from Menu


