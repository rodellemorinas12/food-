import { fetchMerchantDocuments } from "../../api";
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Typography, IconButton, Chip, CircularProgress, useTheme, Grid, Card, CardContent, CardActions } from "@mui/material";
import { tokens } from "../../theme";
import { useState, useEffect, useCallback } from "react";
import Header from "../../components/Header";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import BlockIcon from "@mui/icons-material/Block";
import DescriptionIcon from "@mui/icons-material/Description";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ImageIcon from "@mui/icons-material/Image";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

const MerchantDashboard = ({ restaurantId, restaurantName }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [activeTab, setActiveTab] = useState(0);
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restaurantInfo, setRestaurantInfo] = useState(null);
  const [menuDialogOpen, setMenuDialogOpen] = useState(false);
  const [applicationDialogOpen, setApplicationDialogOpen] = useState(false);
  const [merchantDocuments, setMerchantDocuments] = useState([]);
  const [selectedMenuItem, setSelectedMenuItem] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    is_available: true
  });

  // Get restaurant ID from props or localStorage
  const currentRestaurantId = restaurantId || localStorage.getItem('restaurant_id') || 1;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch orders for this restaurant
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/orders`);
      const allOrders = await response.json();
      const restaurantOrders = allOrders.filter(o => o.restaurant_id === parseInt(currentRestaurantId));
      
      // Filter active orders (not delivered/cancelled)
      const activeOrders = restaurantOrders.filter(
        order => order.status !== 'delivered' && order.status !== 'cancelled'
      );
      setOrders(activeOrders);

      // Fetch menu items
      const menuResponse = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/menu-items/restaurant/${currentRestaurantId}`
      );
      const menu = await menuResponse.json();
      setMenuItems(menu);

      // Fetch restaurant info for application status
      const restaurantResponse = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/restaurants/${currentRestaurantId}`
      );
      const restaurant = await restaurantResponse.json();
      setRestaurantInfo(restaurant);

      // Fetch documents for this merchant
      try {
        const docs = await fetchMerchantDocuments(currentRestaurantId);
        setMerchantDocuments(docs || []);
      } catch (error) {
        console.error("Error loading documents:", error);
        setMerchantDocuments([]);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, [currentRestaurantId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleOpenMenuDialog = (item = null) => {
    if (item) {
      setSelectedMenuItem(item);
      setFormData({
        name: item.name,
        description: item.description || "",
        price: item.price,
        category: item.category || "",
        is_available: item.is_available
      });
    } else {
      setSelectedMenuItem(null);
      setFormData({
        name: "",
        description: "",
        price: "",
        category: "",
        is_available: true
      });
    }
    setMenuDialogOpen(true);
  };

  const handleCloseMenuDialog = () => {
    setMenuDialogOpen(false);
    setSelectedMenuItem(null);
  };

  const handleSaveMenuItem = async () => {
    try {
      const url = selectedMenuItem
        ? `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/menu-items/${selectedMenuItem.id}`
        : `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/menu-items`;
      
      const method = selectedMenuItem ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          restaurant_id: currentRestaurantId,
          price: parseFloat(formData.price)
        })
      });

      if (response.ok) {
        handleCloseMenuDialog();
        loadData();
      }
    } catch (error) {
      console.error("Error saving menu item:", error);
    }
  };

  const handleDeleteMenuItem = async (id) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await fetch(
          `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/menu-items/${id}`,
          { method: 'DELETE' }
        );
        loadData();
      } catch (error) {
        console.error("Error deleting menu item:", error);
      }
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/orders/${orderId}/status`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        }
      );
      loadData();
    } catch (error) {
      console.error("Error updating order status:", error);
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'confirmed': return 'info';
      case 'preparing': return 'secondary';
      case 'ready': return 'primary';
      case 'out_for_delivery': return 'success';
      case 'delivered': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'confirmed': return 'Confirmed';
      case 'preparing': return 'Preparing';
      case 'ready': return 'Ready';
      case 'out_for_delivery': return 'Out for Delivery';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  // Application status helpers
  const getApplicationStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'suspended': return 'error';
      case 'inactive': return 'default';
      case 'declined': return 'error';
      default: return 'default';
    }
  };

  const getApplicationStatusLabel = (status) => {
    switch (status) {
      case 'active': return 'Approved';
      case 'pending': return 'Pending Approval';
      case 'suspended': return 'Suspended';
      case 'inactive': return 'Inactive';
      case 'declined': return 'Declined';
      default: return status || 'Unknown';
    }
  };

  const getApplicationStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircleIcon sx={{ fontSize: 60, color: colors.greenAccent[500] }} />;
      case 'pending': return <HourglassEmptyIcon sx={{ fontSize: 60, color: colors.yellowAccent[500] }} />;
      case 'suspended': return <BlockIcon sx={{ fontSize: 60, color: colors.redAccent[500] }} />;
      case 'declined': return <CancelIcon sx={{ fontSize: 60, color: colors.redAccent[500] }} />;
      default: return <HourglassEmptyIcon sx={{ fontSize: 60, color: colors.grey[500] }} />;
    }
  };

  // Helper function to get document icon based on type
  const getDocumentIcon = (documentType) => {
    const type = documentType?.toLowerCase() || '';
    if (type.includes('pdf')) return <PictureAsPdfIcon />;
    if (type.includes('image') || type.includes('photo') || type.includes('picture')) return <ImageIcon />;
    return <DescriptionIcon />;
  };

  // Helper function to get document type label
  const getDocumentTypeLabel = (documentType) => {
    const labels = {
      'business_permit': 'Business Permit',
      'id': 'Government ID',
      'photo': 'Photo',
      'signature': 'Signature',
      'other': 'Other Document'
    };
    return labels[documentType?.toLowerCase()] || documentType || 'Document';
  };

  const handleReapply = async () => {
    try {
      await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/restaurants/${currentRestaurantId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'pending' })
        }
      );
      setApplicationDialogOpen(false);
      loadData();
    } catch (error) {
      console.error("Error reapplying:", error);
    }
  };

  // Calculate stats
  const todayOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const preparingOrders = orders.filter(o => o.status === 'preparing').length;

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
        <Header 
          title={restaurantName || "MERCHANT DASHBOARD"} 
          subtitle="Manage your restaurant orders and menu" 
        />
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={loadData}
          sx={{ backgroundColor: colors.blueAccent[700] }}
        >
          Refresh
        </Button>
      </Box>

      {/* STATS CARDS */}
      <Grid container spacing={2} mb="20px">
        <Grid item xs={12} sm={4}>
          <Card sx={{ backgroundColor: colors.primary[400] }}>
            <CardContent>
              <Typography variant="h3" color={colors.greenAccent[400]}>
                {todayOrders}
              </Typography>
              <Typography variant="body2">Active Orders</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ backgroundColor: colors.primary[400] }}>
            <CardContent>
              <Typography variant="h3" color={colors.yellowAccent[400]}>
                {pendingOrders}
              </Typography>
              <Typography variant="body2">Pending</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ backgroundColor: colors.primary[400] }}>
            <CardContent>
              <Typography variant="h3" color={colors.blueAccent[400]}>
                {preparingOrders}
              </Typography>
              <Typography variant="body2">Preparing</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* TABS */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Button
          variant={activeTab === 0 ? "contained" : "outlined"}
          onClick={() => setActiveTab(0)}
          sx={{ mr: 1 }}
        >
          Orders ({orders.length})
        </Button>
        <Button
          variant={activeTab === 1 ? "contained" : "outlined"}
          onClick={() => setActiveTab(1)}
          sx={{ mr: 1 }}
        >
          Menu Items ({menuItems.length})
        </Button>
        <Button
          variant={activeTab === 2 ? "contained" : "outlined"}
          onClick={() => setActiveTab(2)}
        >
          Application
        </Button>
      </Box>

      {/* ORDERS TAB */}
      {activeTab === 0 && (
        <Box backgroundColor={colors.primary[400]} borderRadius="8px" p="20px">
          {orders.length === 0 ? (
            <Typography textAlign="center" py="40px" color="text.secondary">
              No active orders
            </Typography>
          ) : (
            orders.map((order) => (
              <Box
                key={order.id}
                backgroundColor={colors.primary[500]}
                borderRadius="8px"
                p="15px"
                mb="10px"
              >
                <Box display="flex" justifyContent="space-between" alignItems="center" mb="10px">
                  <Box>
                    <Typography variant="h6" fontWeight="600">
                      #{order.id?.substring(0, 8)}
                    </Typography>
                    <Chip 
                      label={getStatusLabel(order.status)} 
                      color={getStatusColor(order.status)} 
                      size="small" 
                    />
                  </Box>
                  <Typography variant="h5" fontWeight="bold" color={colors.greenAccent[400]}>
                    ₱{Number(order.total).toFixed(2)}
                  </Typography>
                </Box>
                
                <Typography variant="body2" color={colors.grey[200]} mb="5px">
                  <strong>Customer:</strong> {order.user_name || 'Guest'}
                </Typography>
                <Typography variant="body2" color={colors.grey[200]} mb="5px">
                  <strong>Items:</strong> {formatFoodItems(order.food_items)}
                </Typography>
                <Typography variant="body2" color={colors.grey[200]} mb="10px">
                  <strong>Address:</strong> {order.delivery_address}
                </Typography>

                {/* ACTION BUTTONS */}
                <Box display="flex" gap="10px" flexWrap="wrap">
                  {order.status === 'pending' && (
                    <>
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}
                      >
                        Accept Order
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                      >
                        Decline
                      </Button>
                    </>
                  )}
                  {order.status === 'preparing' && (
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => handleUpdateOrderStatus(order.id, 'ready')}
                    >
                      Mark Ready for Pickup
                    </Button>
                  )}
                  {order.status === 'ready' && (
                    <Typography variant="body2" color={colors.blueAccent[300]}>
                      Waiting for rider to pick up...
                    </Typography>
                  )}
                </Box>
              </Box>
            ))
          )}
        </Box>
      )}

      {/* MENU ITEMS TAB */}
      {activeTab === 1 && (
        <Box>
          <Box display="flex" justifyContent="flex-end" mb="10px">
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenMenuDialog()}
              sx={{ backgroundColor: colors.blueAccent[700] }}
            >
              Add Menu Item
            </Button>
          </Box>
          
          <Grid container spacing={2}>
            {menuItems.map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="start">
                      <Typography variant="h6" fontWeight="600">
                        {item.name}
                      </Typography>
                      <Chip 
                        label={item.is_available ? 'Available' : 'Unavailable'} 
                        color={item.is_available ? 'success' : 'default'} 
                        size="small" 
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" mb="10px">
                      {item.description || 'No description'}
                    </Typography>
                    <Typography variant="h5" fontWeight="bold" color={colors.greenAccent[400]}>
                      ₱{Number(item.price).toFixed(2)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Category: {item.category || 'General'}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <IconButton size="small" onClick={() => handleOpenMenuDialog(item)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDeleteMenuItem(item.id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          {menuItems.length === 0 && (
            <Typography textAlign="center" py="40px" color="text.secondary">
              No menu items. Add your first menu item!
            </Typography>
          )}
        </Box>
      )}

      {/* APPLICATION TAB */}
      {activeTab === 2 && (
        <Box backgroundColor={colors.primary[400]} borderRadius="8px" p="20px">
          <Box display="flex" flexDirection="column" alignItems="center" py="40px">
            {getApplicationStatusIcon(restaurantInfo?.status)}
            
            <Typography variant="h4" fontWeight="600" mt="20px" mb="10px">
              Application Status
            </Typography>
            
            <Chip 
              label={getApplicationStatusLabel(restaurantInfo?.status)} 
              color={getApplicationStatusColor(restaurantInfo?.status)} 
              size="large" 
              sx={{ mb: 20, px: 20, py: 15, fontSize: '1rem' }}
            />

            {/* Restaurant Details */}
            <Card sx={{ width: '100%', maxWidth: 600, mb: 20, backgroundColor: colors.primary[500] }}>
              <CardContent>
                <Typography variant="h5" fontWeight="600" mb="15px" color={colors.greenAccent[300]}>
                  {restaurantInfo?.name}
                </Typography>
                <Box display="grid" gap="10px">
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color={colors.grey[300]}>Cuisine Type:</Typography>
                    <Typography variant="body2" fontWeight="500">{restaurantInfo?.cuisine_type || 'N/A'}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color={colors.grey[300]}>Address:</Typography>
                    <Typography variant="body2" fontWeight="500">{restaurantInfo?.address || 'N/A'}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color={colors.grey[300]}>Phone:</Typography>
                    <Typography variant="body2" fontWeight="500">{restaurantInfo?.phone || 'N/A'}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color={colors.grey[300]}>Email:</Typography>
                    <Typography variant="body2" fontWeight="500">{restaurantInfo?.email || 'N/A'}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color={colors.grey[300]}>City:</Typography>
                    <Typography variant="body2" fontWeight="500">{restaurantInfo?.city || 'N/A'}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color={colors.grey[300]}>Operating Status:</Typography>
                    <Chip 
                      label={restaurantInfo?.is_open ? 'Open' : 'Closed'} 
                      color={restaurantInfo?.is_open ? 'success' : 'error'} 
                      size="small" 
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Documents Section */}
            <Typography variant="h5" fontWeight="600" mt="30px" mb="15px" color={colors.greenAccent[300]}>
              Submitted Documents
            </Typography>
            {merchantDocuments.length === 0 ? (
              <Box 
                textAlign="center" 
                py="30px" 
                backgroundColor={colors.primary[500]} 
                borderRadius="8px"
                mb="20px"
              >
                <DescriptionIcon sx={{ fontSize: 48, color: colors.grey[500], mb: 2 }} />
                <Typography color="text.secondary">
                  No documents submitted yet.
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2} mb="20px">
                {merchantDocuments.map((doc) => (
                  <Grid item xs={12} sm={6} key={doc.id}>
                    <Card sx={{ backgroundColor: colors.primary[500] }}>
                      <CardContent>
                        <Box display="flex" alignItems="center" gap="10px" mb="8px">
                          <Box color={colors.blueAccent[300]}>
                            {getDocumentIcon(doc.document_type)}
                          </Box>
                          <Typography variant="h6" fontWeight="600">
                            {getDocumentTypeLabel(doc.document_type)}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color={colors.grey[300]} mb="10px">
                          {doc.document_name}
                        </Typography>
                        {doc.document_url && (
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<OpenInNewIcon />}
                            href={doc.document_url}
                            target="_blank"
                            sx={{ borderColor: colors.grey[500], color: colors.grey[300] }}
                          >
                            View Document
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}

            {/* Status-specific messages */}
            {restaurantInfo?.status === 'pending' && (
              <Box textAlign="center" mb={20}>
                <Typography variant="body1" color={colors.yellowAccent[300]}>
                  Your application is currently under review. Please wait for approval.
                </Typography>
              </Box>
            )}

            {restaurantInfo?.status === 'active' && (
              <Box textAlign="center" mb={20}>
                <Typography variant="body1" color={colors.greenAccent[300]}>
                  Congratulations! Your application has been approved. You can now manage your orders and menu.
                </Typography>
              </Box>
            )}

            {(restaurantInfo?.status === 'suspended' || restaurantInfo?.status === 'declined' || restaurantInfo?.status === 'inactive') && (
              <Box textAlign="center" mb={20}>
                <Typography variant="body1" color={colors.redAccent[300]} mb={15}>
                  Your application has been {restaurantInfo?.status}. Please contact support for more information.
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<RefreshIcon />}
                  onClick={handleReapply}
                  sx={{ backgroundColor: colors.blueAccent[700] }}
                >
                  Re-apply
                </Button>
              </Box>
            )}

            {/* Re-apply button for declined/suspended/inactive */}
            {(restaurantInfo?.status === 'suspended' || restaurantInfo?.status === 'declined' || restaurantInfo?.status === 'inactive') && (
              <Box display="flex" justifyContent="center" gap="10px">
                <Button
                  variant="outlined"
                  onClick={() => setApplicationDialogOpen(true)}
                  sx={{ borderColor: colors.grey[500] }}
                >
                  View Details
                </Button>
              </Box>
            )}
          </Box>

          {/* Application Details Dialog */}
          <Dialog open={applicationDialogOpen} onClose={() => setApplicationDialogOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Application Information</DialogTitle>
            <DialogContent>
              <Box display="flex" flexDirection="column" gap="15px" mt="10px">
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color={colors.grey[300]}>Application ID:</Typography>
                  <Typography variant="body2" fontWeight="500">#{restaurantInfo?.id}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color={colors.grey[300]}>Current Status:</Typography>
                  <Chip 
                    label={getApplicationStatusLabel(restaurantInfo?.status)} 
                    color={getApplicationStatusColor(restaurantInfo?.status)} 
                    size="small" 
                  />
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color={colors.grey[300]}>Restaurant Name:</Typography>
                  <Typography variant="body2" fontWeight="500">{restaurantInfo?.name}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color={colors.grey[300]}>Cuisine Type:</Typography>
                  <Typography variant="body2" fontWeight="500">{restaurantInfo?.cuisine_type || 'N/A'}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color={colors.grey[300]}>Address:</Typography>
                  <Typography variant="body2" fontWeight="500">{restaurantInfo?.address || 'N/A'}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color={colors.grey[300]}>City:</Typography>
                  <Typography variant="body2" fontWeight="500">{restaurantInfo?.city || 'N/A'}</Typography>
                </Box>
                {restaurantInfo?.status === 'declined' && (
                  <Box mt="10px" p="15px" backgroundColor={colors.redAccent[900]} borderRadius="8px">
                    <Typography variant="body2" color={colors.redAccent[200]}>
                      Your application was declined. Please re-apply with updated information or contact support.
                    </Typography>
                  </Box>
                )}
                {restaurantInfo?.status === 'suspended' && (
                  <Box mt="10px" p="15px" backgroundColor={colors.redAccent[900]} borderRadius="8px">
                    <Typography variant="body2" color={colors.redAccent[200]}>
                      Your account has been suspended. Please contact support for more information.
                    </Typography>
                  </Box>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setApplicationDialogOpen(false)}>Close</Button>
              {(restaurantInfo?.status === 'suspended' || restaurantInfo?.status === 'declined' || restaurantInfo?.status === 'inactive') && (
                <Button variant="contained" onClick={handleReapply} sx={{ backgroundColor: colors.blueAccent[700] }}>
                  Re-apply
                </Button>
              )}
            </DialogActions>
          </Dialog>
        </Box>
      )}

      {/* MENU ITEM DIALOG */}
      <Dialog open={menuDialogOpen} onClose={handleCloseMenuDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedMenuItem ? 'Edit Menu Item' : 'Add Menu Item'}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap="15px" mt="10px">
            <TextField
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
            <TextField
              label="Price"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              fullWidth
              required
              InputProps={{ inputProps: { min: 0, step: 0.01 } }}
            />
            <TextField
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMenuDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveMenuItem}>
            {selectedMenuItem ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MerchantDashboard;
