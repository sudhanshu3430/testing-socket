const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// MongoDB connection
mongoose.connect('mongodb+srv://infiniteloop558:pass123@bcdb.xiii5ot.mongodb.net/testing_socket', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.log('MongoDB connection error:', err));

// Set up middleware
app.use(express.json());

// Vendor and Order schemas
const vendorSchema = new mongoose.Schema({
  name: String,
    isAvailable: Boolean,
    services: [String],
    socketId: String,

  
    // to store the socket ID for real-time notifications
});



const orderSchema = new mongoose.Schema({
  customerName: String,
  serviceDescription: String,
//   vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  status: { type: String, default: 'Pending' }, // "Pending", "Accepted", "Rejected"
});

const Vendor = mongoose.model('Vendor', vendorSchema);
const Order = mongoose.model('Order', orderSchema);



// Socket.io connection for real-time notifications
io.on('connection', (socket) => {
    console.log('A vendor connected: ', socket.id);
    

  // Update vendor's socket ID
    socket.on('register', async (vendorId) => {
        console.log(vendorId)
        

        const socketId = socket.id.toString();
        console.log(socketId);

        

     

    await Vendor.findOneAndUpdate({name: "Vendor One"}, { socketId: `${socketId.toString()}` })
      .then(() => console.log('Vendor registered with socket ID:', socket.id))
      .catch((err) => console.log('Error registering vendor:', err));
  });

  // Handle order notifications
  socket.on('acceptOrder', async (orderId) => {
    const order = await Order.findById(orderId);
    if (order) {
      order.status = 'Accepted';
      order.vendorId = socket.vendorId;
      await order.save();
      // Notify all vendors that the order has been accepted
      io.emit('orderStatusUpdated', order);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('A vendor disconnected');
  });
});

// Route to request a service from vendors
app.post('/request-order', async (req, res) => {
    const { customerName, serviceDescription } = req.body;
  
    // Create a new order
    const newOrder = new Order({
      customerName,
      serviceDescription,
    });
  
    try {
      // Save the new order
      await newOrder.save();
      console.log('Order created:', newOrder);
      
  
      // Find vendors that provide the requested service and are available
      const availableVendors = await Vendor.find({
        isAvailable: true,
        services: { $in: [serviceDescription] },  // Check if the vendor provides this service
        socketId: { $ne: null }, // Ensure the vendor has a socket ID
      });
  
      if (availableVendors.length > 0) {
        console.log(`Notifying ${availableVendors.length} vendors about the new order`);
        availableVendors.forEach(vendor => {
          io.to(vendor.socketId).emit('newOrder', newOrder);  // Notify the vendor
          console.log(`Notified vendor ${vendor.name} with order ID: ${newOrder._id}`);
        });
      } else {
        console.log('No available vendors to notify');
      }
  
      res.status(201).json(newOrder );
    } catch (error) {
      console.log('Error creating order:', error);
      res.status(500).send('Error creating order');
    }
  });
  

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
