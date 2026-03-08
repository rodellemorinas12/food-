import { Box, Typography, useTheme, Paper, Button, Chip, Grid, TextField, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Alert, FormControl, InputLabel, Select, Card, CardContent } from "@mui/material";
import { tokens } from "../theme";
import { useState, useEffect } from "react";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import TimerIcon from "@mui/icons-material/Timer";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";

const Orders = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all");
  
  // Dialog states
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [prepTimeDialogOpen, setPrepTimeDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [estimatedPrepTime, setEstimatedPrepTime] = useState(30);

  // Check merchant approval status (case-insensitive)
  const merchantStatus = (localStorage.getItem("merchantStatus") || "").toLowerCase();
  const isApproved = merchantStatus === "active" || merchantStatus === "approved";
  const isRejected = merchantStatus === "suspended" || merchantStatus === "declined";

  useEffect(() => {
    // No sample data - only load real orders when approved
    setOrders([]);
  }, []);

  const updateOrderStatus = (id, newStatus, extraData = {}) => {
    setOrders(orders.map(order => order.id === id ? { ...order, status: newStatus, ...extraData } : order));
  };

  const handleAcceptOrder = (order) => {
    setSelectedOrder(order);
    setPrepTimeDialogOpen(true);
  };

  const handleConfirmAccept = () => {
    if (selectedOrder) {
      updateOrderStatus(selectedOrder.id, 'preparing', { 
        estimated_prep_time: estimatedPrepTime,
        accepted_at: new Date().toISOString()
      });
    }
    setPrepTimeDialogOpen(false);
    setSelectedOrder(null);
    setEstimatedPrepTime(30);
  };

  const handleRejectClick = (order) => {
    setSelectedOrder(order);
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = () => {
    if (selectedOrder && rejectReason) {
      updateOrderStatus(selectedOrder.id, 'cancelled', { 
        reject_reason: rejectReason,
        rejected_at: new Date().toISOString()
      });
    }
    setRejectDialogOpen(false);
    setSelectedOrder(null);
    setRejectReason("");
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "warning";
      case "preparing": return "info";
      case "ready": return "primary";
      case "delivered": return "success";
      case "cancelled": return "error";
      default: return "default";
    }
  };

  const filteredOrders = filter === "all" ? orders : orders.filter(o => o.status === filter);

  // Show "Under Approval" screen if not approved
  if (!isApproved) {
    // Show rejection message if rejected
    if (isRejected) {
      return (
        <Box p={3} display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="70vh">
          <CancelIcon sx={{ fontSize: 80, color: colors.redAccent[500], mb: 3 }} />
          <Typography variant="h2" fontWeight="bold" color={colors.grey[100]} textAlign="center" mb={2}>
            Application Rejected
          </Typography>
          <Typography variant="h5" color={colors.grey[300]} textAlign="center" mb={3}>
            Your document is got rejected. Please try again in another day.
          </Typography>
          <Paper sx={{ p: 3, backgroundColor: colors.primary[400], borderRadius: "10px", maxWidth: 500, width: "100%" }}>
            <Alert severity="error">
              Your merchant application has been rejected. Please contact support or submit a new application after some time.
            </Alert>
          </Paper>
        </Box>
      );
    }
    
    return (
      <Box p={3} display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="70vh">
        <HourglassEmptyIcon sx={{ fontSize: 80, color: colors.yellowAccent[500], mb: 3 }} />
        <Typography variant="h2" fontWeight="bold" color={colors.grey[100]} textAlign="center" mb={2}>
          Under Approval
        </Typography>
        <Typography variant="h5" color={colors.grey[300]} textAlign="center" mb={3}>
          Orders Management is not available yet
        </Typography>
        <Paper sx={{ p: 3, backgroundColor: colors.primary[400], borderRadius: "10px", maxWidth: 500, width: "100%" }}>
          <Alert severity="warning">
            Your merchant account is pending admin approval. Once approved, you will be able to view and manage customer orders.
          </Alert>
        </Paper>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* HEADER */}
      <Box mb={3}>
        <Typography variant="h2" fontWeight="bold" color={colors.grey[100]}>Orders Management</Typography>
        <Typography variant="h5" color={colors.greenAccent[400]}>Manage and track customer orders</Typography>
      </Box>

      {/* FILTER */}
      <Paper sx={{ p: 2, mb: 3, backgroundColor: colors.primary[400], borderRadius: "10px" }}>
        <Box display="flex" gap={2} alignItems="center">
          <TextField select label="Filter by Status" value={filter} onChange={(e) => setFilter(e.target.value)} sx={{ minWidth: 200, '& .MuiOutlinedInput-root': { color: colors.grey[100] }, '& .MuiInputLabel-root': { color: colors.grey[300] } }} SelectProps={{ MenuProps: { PaperProps: { sx: { backgroundColor: colors.primary[400] } } } }}>
            <MenuItem value="all">All Orders</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="preparing">Preparing</MenuItem>
            <MenuItem value="ready">Ready</MenuItem>
            <MenuItem value="delivered">Delivered</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </TextField>
          <Typography variant="body1" color={colors.grey[200]}>Showing {filteredOrders.length} orders</Typography>
        </Box>
      </Paper>

      {/* ORDERS TABLE */}
      <Paper sx={{ backgroundColor: colors.primary[400], borderRadius: "10px", overflow: "hidden" }}>
        <Box sx={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: colors.primary[500] }}>
                <th style={{ padding: "15px", textAlign: "left", color: colors.grey[100] }}>Order #</th>
                <th style={{ padding: "15px", textAlign: "left", color: colors.grey[100] }}>Customer</th>
                <th style={{ padding: "15px", textAlign: "left", color: colors.grey[100] }}>Items</th>
                <th style={{ padding: "15px", textAlign: "left", color: colors.grey[100] }}>Total</th>
                <th style={{ padding: "15px", textAlign: "left", color: colors.grey[100] }}>Status</th>
                <th style={{ padding: "15px", textAlign: "left", color: colors.grey[100] }}>Payment</th>
                <th style={{ padding: "15px", textAlign: "left", color: colors.grey[100] }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} style={{ borderBottom: `1px solid ${colors.primary[500]}` }}>
                  <td style={{ padding: "15px", color: colors.greenAccent[400], fontWeight: "bold" }}>#{order.id}</td>
                  <td style={{ padding: "15px", color: colors.grey[100] }}>
                    <Typography variant="body1" fontWeight="bold">{order.customer}</Typography>
                    <Typography variant="caption" color={colors.grey[400]}>{order.phone}</Typography>
                  </td>
                  <td style={{ padding: "15px", color: colors.grey[200] }}>
                    {order.items.map((item, i) => (
                      <div key={i}>{item.name} x{item.qty}</div>
                    ))}
                  </td>
                  <td style={{ padding: "15px", color: colors.grey[100], fontWeight: "bold", fontSize: "18px" }}>₱{order.total}</td>
                  <td style={{ padding: "15px" }}>
                    <Chip label={order.status.charAt(0).toUpperCase() + order.status.slice(1)} color={getStatusColor(order.status)} size="small" />
                  </td>
                  <td style={{ padding: "15px" }}>
                    <Chip label={order.payment} color={order.payment === "Paid" ? "success" : "error"} size="small" variant="outlined" />
                  </td>
                  <td style={{ padding: "15px" }}>
                    {order.status === "pending" && (
                      <Box display="flex" gap={1}>
                        <Button variant="contained" color="success" size="small" startIcon={<CheckCircleIcon />} onClick={() => handleAcceptOrder(order)}>Accept</Button>
                        <Button variant="contained" color="error" size="small" startIcon={<CancelIcon />} onClick={() => handleRejectClick(order)}>Decline</Button>
                      </Box>
                    )}
                    {order.status === "preparing" && (
                      <Button variant="contained" color="primary" size="small" onClick={() => updateOrderStatus(order.id, "ready")}>Mark Ready</Button>
                    )}
                    {order.status === "ready" && (
                      <Button variant="contained" color="success" size="small" onClick={() => updateOrderStatus(order.id, "delivered")}>Mark Delivered</Button>
                    )}
                    {(order.status === "delivered" || order.status === "cancelled") && (
                      <Typography variant="body2" color={colors.grey[400]}>Completed</Typography>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      </Paper>

      {/* REJECT REASON DIALOG */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { backgroundColor: colors.primary[400] } }}>
        <DialogTitle sx={{ color: colors.grey[100] }}>Decline Order #{selectedOrder?.id}</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Please provide a reason for declining this order. This will be shown to the customer.
          </Alert>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel sx={{ color: colors.grey[300] }}>Reason</InputLabel>
            <Select
              value={rejectReason}
              label="Reason"
              onChange={(e) => setRejectReason(e.target.value)}
              sx={{ color: colors.grey[100], '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.grey[500] } }}
            >
              <MenuItem value="Item unavailable">Item unavailable</MenuItem>
              <MenuItem value="Restaurant closed">Restaurant closed</MenuItem>
              <MenuItem value="Too many orders">Too many orders</MenuItem>
              <MenuItem value="Cannot fulfill in time">Cannot fulfill in time</MenuItem>
              <MenuItem value="Customer address too far">Customer address too far</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)} sx={{ color: colors.grey[300] }}>Cancel</Button>
          <Button onClick={handleConfirmReject} variant="contained" color="error" disabled={!rejectReason}>
            Confirm Decline
          </Button>
        </DialogActions>
      </Dialog>

      {/* ESTIMATED PREP TIME DIALOG */}
      <Dialog open={prepTimeDialogOpen} onClose={() => setPrepTimeDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { backgroundColor: colors.primary[400] } }}>
        <DialogTitle sx={{ color: colors.grey[100] }}>Set Preparation Time</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Set the estimated time to prepare this order. The customer will be notified.
          </Alert>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" color={colors.grey[200]} gutterBottom>
              Estimated Preparation Time:
            </Typography>
            <Grid container spacing={2}>
              {[15, 20, 30, 45, 60].map((time) => (
                <Grid item xs={4} key={time}>
                  <Card 
                    sx={{ 
                      cursor: "pointer",
                      backgroundColor: estimatedPrepTime === time ? colors.greenAccent[600] : colors.primary[500],
                      border: estimatedPrepTime === time ? `2px solid ${colors.greenAccent[400]}` : "1px solid",
                    }}
                    onClick={() => setEstimatedPrepTime(time)}
                  >
                    <CardContent sx={{ textAlign: "center", py: 2 }}>
                      <AccessTimeIcon sx={{ fontSize: 24, color: colors.grey[100], mb: 1 }} />
                      <Typography variant="h6" color={colors.grey[100]}>
                        {time} min
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPrepTimeDialogOpen(false)} sx={{ color: colors.grey[300] }}>Cancel</Button>
          <Button onClick={handleConfirmAccept} variant="contained" color="success">
            Accept Order
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Orders;
