import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Typography, IconButton, Chip, CircularProgress, useTheme } from "@mui/material";
import { tokens } from "../../theme";
import { useState, useEffect, useCallback } from "react";
import { fetchCustomers, createCustomer, updateCustomer, deleteCustomer } from "../../api";
import Header from "../../components/Header";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";

const Customers = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: ""
  });

  const loadData = useCallback(async () => {
    try {
      const data = await fetchCustomers();
      setCustomers(data || []);
    } catch (error) {
      console.error("Error loading customers:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenDialog = (customer = null) => {
    if (customer) {
      setSelectedCustomer(customer);
      setFormData({
        name: customer.name,
        email: customer.email,
        phone: customer.phone || "",
        address: customer.address || "",
        city: customer.city || ""
      });
    } else {
      setSelectedCustomer(null);
      setFormData({
        name: "",
        email: "",
        phone: "",
        address: "",
        city: ""
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedCustomer(null);
  };

  const handleSubmit = async () => {
    try {
      if (selectedCustomer) {
        await updateCustomer(selectedCustomer.id, formData);
      } else {
        await createCustomer(formData);
      }
      handleCloseDialog();
      loadData();
    } catch (error) {
      console.error("Error saving customer:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      try {
        await deleteCustomer(id);
        loadData();
      } catch (error) {
        console.error("Error deleting customer:", error);
      }
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
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header title="CUSTOMERS" subtitle="Manage customer information" />
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ backgroundColor: colors.blueAccent[700] }}
        >
          Add Customer
        </Button>
      </Box>

      {/* CUSTOMERS TABLE */}
      <Box
        mt="20px"
        overflow="auto"
        backgroundColor={colors.primary[400]}
        borderRadius="8px"
      >
        <Box p="20px">
          <Typography variant="h5" fontWeight="600" mb="20px">
            All Customers ({customers.length})
          </Typography>
          {customers.length === 0 ? (
            <Typography color="text.secondary">No customers yet. Add your first customer!</Typography>
          ) : (
            <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap="20px">
              {customers.map((customer) => (
                <Box
                  key={customer.id}
                  backgroundColor={colors.primary[500]}
                  p="20px"
                  borderRadius="8px"
                  display="flex"
                  flexDirection="column"
                  gap="10px"
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" fontWeight="600">
                      {customer.name}
                    </Typography>
                    <Chip 
                      label={`ID: ${customer.id}`} 
                      color="default" 
                      size="small" 
                    />
                  </Box>
                  
                  <Box display="flex" alignItems="center" gap="10px">
                    <EmailIcon sx={{ color: colors.grey[400], fontSize: 20 }} />
                    <Typography variant="body2" color={colors.grey[200]}>
                      {customer.email}
                    </Typography>
                  </Box>
                  
                  {customer.phone && (
                    <Box display="flex" alignItems="center" gap="10px">
                      <PhoneIcon sx={{ color: colors.grey[400], fontSize: 20 }} />
                      <Typography variant="body2" color={colors.grey[200]}>
                        {customer.phone}
                      </Typography>
                    </Box>
                  )}
                  
                  {customer.address && (
                    <Box display="flex" alignItems="center" gap="10px">
                      <LocationOnIcon sx={{ color: colors.grey[400], fontSize: 20 }} />
                      <Typography variant="body2" color={colors.grey[200]}>
                        {customer.address}{customer.city ? `, ${customer.city}` : ""}
                      </Typography>
                    </Box>
                  )}
                  
                  <Typography variant="caption" color={colors.grey[400]}>
                    Since: {new Date(customer.created_at).toLocaleDateString()}
                  </Typography>
                  
                  <Box display="flex" gap="10px" mt="10px">
                    <IconButton size="small" onClick={() => handleOpenDialog(customer)}>
                      <EditIcon sx={{ color: colors.blueAccent[300] }} />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(customer.id)}>
                      <DeleteIcon sx={{ color: colors.redAccent[400] }} />
                    </IconButton>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>

      {/* CREATE/EDIT CUSTOMER DIALOG */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedCustomer ? "Edit Customer" : "Add New Customer"}</DialogTitle>
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
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              fullWidth
            />
            <TextField
              label="Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
            <TextField
              label="City"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {selectedCustomer ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Customers;
