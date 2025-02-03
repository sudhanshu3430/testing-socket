const io = require('socket.io-client');
const socket = io('http://localhost:3000');  // Connect to the server running on port 3000

// On connection to the server
socket.on('connect', () => {
  console.log('Vendor connected with socket ID:', socket.id);

  // Register the vendor (replace with a valid vendor ID from MongoDB)
  const vendorId = '67a0e239f5b6cf7fb265e585';  // You need to replace this with an actual vendor ID from your MongoDB collection
  socket.emit('register', vendorId);
});

// Listen for new orders
socket.on('newOrder', (order) => {
  console.log('Received new order:', order);
});

// Listen for order status updates
socket.on('orderStatusUpdated', (order) => {
  console.log('Order status updated:', order);
});