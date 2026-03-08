import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Typography, IconButton, Chip, CircularProgress, useTheme, Tabs, Tab } from "@mui/material";
import { tokens } from "../../theme";
import { useState, useEffect, useCallback } from "react";
import { fetchOrders, fetchCustomers, fetchAvailableRiders, fetchTransactions, updateOrder, assignRiderToOrder } from "../../api";
import Header from "../../components/Header";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RefreshIcon from "@mui/icons-material/Refresh";
import ReceiptIcon from "@mui/icons-material/Receipt";

const STATUS_COLORS = {
  pending: "warning",
  confirmed: "info",
  preparing: "secondary",
  out_for_delivery: "primary",
  delivered: "success",
  cancelled: "error"
};

const STATUS_LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled"
};

const Orders = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [activeTab, setActiveTab] = useState(0);
  const [orders, setOrders] = useState([]);
  const [deliveredOrders, setDeliveredOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [availableRiders, setAvailableRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersData, customersData, ridersData, transactionsData] = await Promise.all([
        fetchOrders(),
        fetchCustomers(),
        fetchAvailableRiders(),
        fetchTransactions()
      ]);
      
      // Filter orders for active tab (not delivered/cancelled)
      const activeOrders = (ordersData || []).filter(
        order => order.status !== 'delivered' && order.status !== 'cancelled'
      );
      
      setOrders(activeOrders);
      setDeliveredOrders(transactionsData || []);
      setCustomers(customersData || []);
      setAvailableRiders(ridersData || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleOpenAssignment = (order) => {
    setSelectedOrder(order);
    setAssignmentDialogOpen(true);
  };

  const handleCloseAssignment = () => {
    setAssignmentDialogOpen(false);
    setSelectedOrder(null);
  };

  const handleAssignRider = async (riderId) => {
    try {
      await assignRiderToOrder(selectedOrder.id, riderId);
      handleCloseAssignment();
      loadData();
    } catch (error) {
      console.error("Error assigning rider:", error);
    }
  };

  const handleMarkDelivered = async (order) => {
    if (window.confirm(`Mark order #${order.order_number} as delivered? This will move it to sales report.`)) {
      try {
        await updateOrder(order.id, { status: 'delivered' });
        loadData();
      } catch (error) {
        console.error("Error marking delivered:", error);
      }
    }
  };

  const formatFoodItems = (items) => {
    try {
      const parsedItems = typeof items === "string" ? JSON.parse(items) : items;
      return parsedItems.map(item => `${item.name} x${item.quantity}`).join(", ");
    } catch {
      return "Unknown items";
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress color="secondary" size={60} />
      </Box>
    );
  }

  return (
    <Box m="20px">
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb="20px">
        <Header title="FOOD ORDERS" subtitle="Manage and track active delivery orders" />
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={loadData}
          sx={{ backgroundColor: colors.blueAccent[700] }}
        >
          Refresh
        </Button>
      </Box>

      {/* TABS */}
      <Tabs 
        value={activeTab} 
        onChange={(e, newValue) => setActiveTab(newValue)}
        sx={{ mb: "20px", borderBottom: 1, borderColor: "divider" }}
      >
        <Tab 
          icon={<ReceiptIcon />} 
          iconPosition="start" 
          label={`Active Orders (${orders.length})`} 
        />
        <Tab 
          icon={<CheckCircleIcon />} 
          iconPosition="start" 
          label={`Sales Report (${deliveredOrders.length})`} 
        />
      </Tabs>

      {/* ACTIVE ORDERS TAB */}
      {activeTab === 0 && (
        <Box
          backgroundColor={colors.primary[400]}
          borderRadius="8px"
          p="20px"
        >
          {orders.length === 0 ? (
            <Box textAlign="center" py="40px">
              <Typography variant="h5" color="text.secondary" gutterBottom>
                No Active Orders
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Orders from the mobile app will appear here automatically.
              </Typography>
            </Box>
          ) : (
            orders.map((order) => (
              <Box
                key={order.id}
                backgroundColor={colors.primary[500]}
                borderRadius="8px"
                p="20px"
                mb="15px"
              >
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb="10px">
                  <Box>
                    <Typography variant="h6" fontWeight="600" color={colors.grey[100]}>
                      #{order.order_number}
                    </Typography>
                    <Chip 
                      label={STATUS_LABELS[order.status]} 
                      color={STATUS_COLORS[order.status]} 
                      size="small" 
                    />
                  </Box>
                  <Box textAlign="right">
                    <Typography variant="h5" fontWeight="bold" color={colors.greenAccent[400]}>
                      ₱{Number(order.total_cost).toFixed(2)}
                    </Typography>
                    {order.rider_name && (
                      <Typography variant="body2" color={colors.blueAccent[300]}>
                        Rider: {order.rider_name}
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Typography variant="body2" color={colors.grey[200]} mb="5px">
                  <strong>Customer:</strong> {order.customer_name || `ID: ${order.customer_id}`}
                </Typography>
                <Typography variant="body2" color={colors.grey[200]} mb="5px">
                  <strong>Items:</strong> {formatFoodItems(order.food_items)}
                </Typography>
                <Typography variant="body2" color={colors.grey[200]} mb="10px">
                  <strong>Address:</strong> {order.delivery_address}
                </Typography>

                <Box display="flex" gap="10px" mt="10px">
                  {order.status !== 'delivered' && order.status !== 'cancelled' && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<PersonAddIcon />}
                      onClick={() => handleOpenAssignment(order)}
                      sx={{ color: colors.greenAccent[400], borderColor: colors.greenAccent[400] }}
                    >
                      {order.rider_id ? 'Reassign Rider' : 'Assign Rider'}
                    </Button>
                  )}
                  
                  {order.status === 'out_for_delivery' && (
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      startIcon={<CheckCircleIcon />}
                      onClick={() => handleMarkDelivered(order)}
                    >
                      Mark Delivered
                    </Button>
                  )}
                </Box>
              </Box>
            ))
          )}
        </Box>
      )}

      {/* SALES REPORT TAB */}
      {activeTab === 1 && (
        <Box
          backgroundColor={colors.primary[400]}
          borderRadius="8px"
          p="20px"
        >
          <Typography variant="h5" fontWeight="600" mb="20px">
            Delivered Orders Report
          </Typography>
          
          {deliveredOrders.length === 0 ? (
            <Typography color="text.secondary">No delivered orders yet.</Typography>
          ) : (
            <Box>
              {/* Summary */}
              <Box 
                backgroundColor={colors.primary[500]} 
                p="15px" 
                borderRadius="8px" 
                mb="20px"
                display="flex"
                justifyContent="space-around"
              >
                <Box textAlign="center">
                  <Typography variant="h4" fontWeight="bold" color={colors.greenAccent[400]}>
                    {deliveredOrders.length}
                  </Typography>
                  <Typography variant="body2">Total Orders</Typography>
                </Box>
                <Box textAlign="center">
                  <Typography variant="h4" fontWeight="bold" color={colors.blueAccent[400]}>
                    ₱{deliveredOrders.reduce((sum, t) => sum + Number(t.cost || 0), 0).toFixed(2)}
                  </Typography>
                  <Typography variant="body2">Total Sales</Typography>
                </Box>
              </Box>

              {/* Order List */}
              {deliveredOrders.map((transaction) => (
                <Box
                  key={transaction.id}
                  backgroundColor={colors.primary[500]}
                  borderRadius="8px"
                  p="15px"
                  mb="10px"
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box>
                    <Typography variant="body1" fontWeight="600">
                      Order #{transaction.txId || transaction.order_number}
                    </Typography>
                    <Typography variant="body2" color={colors.grey[200]}>
                      {new Date(transaction.date || transaction.created_at).toLocaleString()}
                    </Typography>
                  </Box>
                  <Typography variant="h6" fontWeight="bold" color={colors.greenAccent[400]}>
                    ₱{Number(transaction.cost || transaction.total_cost || 0).toFixed(2)}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* ASSIGN RIDER DIALOG */}
      <Dialog open={assignmentDialogOpen} onClose={handleCloseAssignment} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedOrder?.rider_id ? 'Reassign Rider' : 'Assign Rider'} to Order</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb="15px">
            {selectedOrder?.rider_id 
              ? `Current rider: ${selectedOrder.rider_name || 'Unknown'}. Select a new rider:`
              : 'Select a rider to assign to this order:'
            }
          </Typography>
          <Box display="flex" flexDirection="column" gap="10px">
            {availableRiders.length === 0 ? (
              <Typography color="text.secondary">No riders available</Typography>
            ) : (
              availableRiders.map((rider) => (
                <Button
                  key={rider.id}
                  variant="outlined"
                  onClick={() => handleAssignRider(rider.id)}
                  sx={{ justifyContent: "flex-start", py: 1.5 }}
                >
                  {rider.name} ({rider.vehicle_type || 'Bike'}) - Rating: {rider.rating || 'N/A'}
                </Button>
              ))
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAssignment}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Orders;
