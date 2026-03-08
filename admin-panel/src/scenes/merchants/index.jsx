import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Typography, IconButton, Chip, CircularProgress, useTheme, Snackbar, Alert, Grid } from "@mui/material";
import { tokens } from "../../theme";
import { useState, useEffect, useCallback } from "react";
import { fetchMerchants, createMerchant, updateMerchant, deleteMerchant, fetchMerchantDocuments } from "../../api";
import Header from "../../components/Header";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import BlockIcon from "@mui/icons-material/Block";
import CancelIcon from "@mui/icons-material/Cancel";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import StarIcon from "@mui/icons-material/Star";
import AssignmentIcon from "@mui/icons-material/Assignment";
import StoreIcon from "@mui/icons-material/Store";
import VisibilityIcon from "@mui/icons-material/Visibility";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ImageIcon from "@mui/icons-material/Image";
import DescriptionIcon from "@mui/icons-material/Description";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

// API base URL for document links
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const getFullDocumentUrl = (relativeUrl) => {
  if (!relativeUrl) return '';
  // If already a full URL, return as is
  if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
    return relativeUrl;
  }
  // Remove /api from the base URL and prepend to the relative path
  const baseUrl = API_BASE_URL.replace('/api', '');
  return `${baseUrl}${relativeUrl}`;
};

const STATUS_COLORS = {
  active: "success",
  pending: "warning",
  suspended: "error",
  inactive: "default",
  declined: "error"
};

const STATUS_LABELS = {
  active: "Active",
  pending: "Pending Approval",
  suspended: "Suspended",
  inactive: "Inactive",
  declined: "Declined"
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

const Merchants = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [merchantDocuments, setMerchantDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    cuisine_type: "",
    address: "",
    city: "",
    phone: "",
    email: "",
    is_open: true,
    status: "pending"
  });

  const loadData = useCallback(async () => {
    try {
      const data = await fetchMerchants();
      setMerchants(data || []);
    } catch (error) {
      console.error("Error loading merchants:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleOpenDialog = (merchant = null) => {
    if (merchant) {
      setSelectedMerchant(merchant);
      setFormData({
        name: merchant.name || "",
        description: merchant.description || "",
        cuisine_type: merchant.cuisine_type || "",
        address: merchant.address || "",
        city: merchant.city || "",
        phone: merchant.phone || "",
        email: merchant.email || "",
        is_open: merchant.is_open ?? true,
        status: merchant.status || "pending"
      });
    } else {
      setSelectedMerchant(null);
      setFormData({
        name: "",
        description: "",
        cuisine_type: "",
        address: "",
        city: "",
        phone: "",
        email: "",
        is_open: true,
        status: "pending"
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedMerchant(null);
  };

  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
    setSelectedMerchant(null);
    setMerchantDocuments([]);
  };

  const handleViewMerchant = async (merchant) => {
    setSelectedMerchant(merchant);
    setViewDialogOpen(true);
    
    // Fetch documents for this merchant
    setDocumentsLoading(true);
    try {
      const docs = await fetchMerchantDocuments(merchant.id);
      setMerchantDocuments(docs || []);
    } catch (error) {
      console.error("Error loading documents:", error);
      setMerchantDocuments([]);
    } finally {
      setDocumentsLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (selectedMerchant) {
        await updateMerchant(selectedMerchant.id, formData);
        showSnackbar("Merchant updated successfully");
      } else {
        await createMerchant(formData);
        showSnackbar("Merchant added successfully");
      }
      handleCloseDialog();
      loadData();
    } catch (error) {
      console.error("Error saving merchant:", error);
      showSnackbar("Error saving merchant", "error");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this merchant?")) {
      try {
        await deleteMerchant(id);
        showSnackbar("Merchant deleted successfully");
        loadData();
      } catch (error) {
        console.error("Error deleting merchant:", error);
        showSnackbar("Error deleting merchant", "error");
      }
    }
  };

  const handleApprove = async (merchant) => {
    try {
      await updateMerchant(merchant.id, { ...merchant, status: "active" });
      showSnackbar(`${merchant.name} has been approved!`, "success");
      handleCloseViewDialog();
      loadData();
    } catch (error) {
      console.error("Error approving merchant:", error);
      showSnackbar("Error approving merchant", "error");
    }
  };

  const handleDecline = async (merchant) => {
    if (window.confirm(`Are you sure you want to decline the application for "${merchant.name}"?`)) {
      try {
        await updateMerchant(merchant.id, { ...merchant, status: "declined" });
        showSnackbar(`${merchant.name}'s application has been declined.`, "warning");
        handleCloseViewDialog();
        loadData();
      } catch (error) {
        console.error("Error declining merchant:", error);
        showSnackbar("Error declining merchant", "error");
      }
    }
  };

  const handleSuspend = async (merchant) => {
    try {
      await updateMerchant(merchant.id, { ...merchant, status: "suspended" });
      showSnackbar(`${merchant.name} has been suspended.`, "warning");
      loadData();
    } catch (error) {
      console.error("Error suspending merchant:", error);
      showSnackbar("Error suspending merchant", "error");
    }
  };

  const pendingApplications = merchants.filter(m => m.status === 'pending');
  const allMerchants = merchants;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress color="secondary" size={60} />
      </Box>
    );
  }

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb="20px">
        <Header 
          title="MERCHANTS" 
          subtitle="Manage restaurant partners and approvals" 
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ backgroundColor: colors.blueAccent[700] }}
        >
          Add Merchant
        </Button>
      </Box>

      {/* Stats Cards */}
      <Box display="flex" gap="20px" mb="20px">
        <Box flex={1} p="20px" backgroundColor={colors.primary[400]} borderRadius="8px">
          <Typography variant="h3" color={colors.greenAccent[400]}>
            {merchants.filter(m => m.status === 'active').length}
          </Typography>
          <Typography variant="body2">Active Merchants</Typography>
        </Box>
        <Box flex={1} p="20px" backgroundColor={colors.primary[400]} borderRadius="8px">
          <Typography variant="h3" color={colors.yellowAccent[400]}>
            {merchants.filter(m => m.status === 'pending').length}
          </Typography>
          <Typography variant="body2">Pending Applications</Typography>
        </Box>
        <Box flex={1} p="20px" backgroundColor={colors.primary[400]} borderRadius="8px">
          <Typography variant="h3" color={colors.redAccent[400]}>
            {merchants.filter(m => m.status === 'suspended' || m.status === 'declined').length}
          </Typography>
          <Typography variant="body2">Suspended / Declined</Typography>
        </Box>
      </Box>

      {/* TABS */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Button
          variant={activeTab === 0 ? "contained" : "outlined"}
          onClick={() => setActiveTab(0)}
          startIcon={<AssignmentIcon />}
          sx={{ mr: 1 }}
        >
          Applications ({pendingApplications.length})
        </Button>
        <Button
          variant={activeTab === 1 ? "contained" : "outlined"}
          onClick={() => setActiveTab(1)}
          startIcon={<StoreIcon />}
        >
          All Merchants ({allMerchants.length})
        </Button>
      </Box>

      {/* APPLICATIONS TAB */}
      {activeTab === 0 && (
        <Box backgroundColor={colors.primary[400]} borderRadius="8px" p="20px">
          <Typography variant="h5" fontWeight="600" mb="15px" color={colors.yellowAccent[300]}>
            Pending Applications for Approval
          </Typography>
          {pendingApplications.length === 0 ? (
            <Box textAlign="center" py="40px">
              <AssignmentIcon sx={{ fontSize: 60, color: colors.grey[500], mb: 2 }} />
              <Typography color="text.secondary">
                No pending applications at this time.
              </Typography>
            </Box>
          ) : (
            pendingApplications.map((merchant) => (
              <Box
                key={merchant.id}
                backgroundColor={colors.primary[500]}
                borderRadius="8px"
                p="20px"
                mb="15px"
                border={`1px solid ${colors.yellowAccent[700]}`}
              >
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box display="flex" alignItems="center" gap="15px">
                    <Box
                      width="55px"
                      height="55px"
                      borderRadius="50%"
                      backgroundColor={colors.yellowAccent[700]}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <RestaurantIcon sx={{ color: colors.primary[500], fontSize: 28 }} />
                    </Box>
                    <Box>
                      <Typography variant="h5" fontWeight="700">
                        {merchant.name}
                      </Typography>
                      <Typography variant="body2" color={colors.grey[300]}>
                        {merchant.cuisine_type} {merchant.city ? `• ${merchant.city}` : ''}
                      </Typography>
                      <Typography variant="body2" color={colors.grey[400]} mt="3px">
                        {merchant.address || 'No address provided'}
                      </Typography>
                      {(merchant.phone || merchant.email) && (
                        <Typography variant="body2" color={colors.grey[400]} mt="3px">
                          {merchant.phone && `📞 ${merchant.phone}`}
                          {merchant.phone && merchant.email && ' • '}
                          {merchant.email && `✉ ${merchant.email}`}
                        </Typography>
                      )}
                      <Box mt="8px">
                        <Chip 
                          label="Pending Approval" 
                          color="warning" 
                          size="small" 
                        />
                      </Box>
                    </Box>
                  </Box>

                  <Box display="flex" flexDirection="column" gap="8px" alignItems="flex-end">
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      startIcon={<CheckCircleIcon />}
                      onClick={() => handleApprove(merchant)}
                      sx={{ minWidth: 120 }}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      size="small"
                      startIcon={<CancelIcon />}
                      onClick={() => handleDecline(merchant)}
                      sx={{ minWidth: 120 }}
                    >
                      Decline
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<VisibilityIcon />}
                      onClick={() => handleViewMerchant(merchant)}
                      sx={{ minWidth: 120, borderColor: colors.grey[500] }}
                    >
                      View Details
                    </Button>
                  </Box>
                </Box>

                {merchant.description && (
                  <Box mt="12px" p="10px" backgroundColor={colors.primary[400]} borderRadius="6px">
                    <Typography variant="body2" color={colors.grey[300]}>
                      <strong>Description:</strong> {merchant.description}
                    </Typography>
                  </Box>
                )}
              </Box>
            ))
          )}
        </Box>
      )}

      {/* ALL MERCHANTS TAB */}
      {activeTab === 1 && (
        <Box backgroundColor={colors.primary[400]} borderRadius="8px" p="20px">
          {merchants.length === 0 ? (
            <Typography textAlign="center" py="40px" color="text.secondary">
              No merchants found. Add your first merchant!
            </Typography>
          ) : (
            <Box>
              {merchants.map((merchant) => (
                <Box
                  key={merchant.id}
                  backgroundColor={colors.primary[500]}
                  borderRadius="8px"
                  p="15px"
                  mb="10px"
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box display="flex" alignItems="center" gap="15px">
                    <Box
                      width="50px"
                      height="50px"
                      borderRadius="50%"
                      backgroundColor={colors.greenAccent[500]}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <RestaurantIcon sx={{ color: colors.primary[500] }} />
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight="600">
                        {merchant.name}
                      </Typography>
                      <Typography variant="body2" color={colors.grey[300]}>
                        {merchant.cuisine_type} • {merchant.address}
                      </Typography>
                      <Box display="flex" alignItems="center" gap="5px" mt="5px">
                        <Chip 
                          label={STATUS_LABELS[merchant.status] || merchant.status} 
                          color={STATUS_COLORS[merchant.status] || "default"} 
                          size="small" 
                        />
                        <Chip 
                          label={merchant.is_open ? "Open" : "Closed"} 
                          color={merchant.is_open ? "success" : "error"} 
                          size="small" 
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                  </Box>
                  
                  <Box display="flex" alignItems="center" gap="10px">
                    {merchant.rating && (
                      <Box display="flex" alignItems="center" gap="5px">
                        <StarIcon sx={{ color: colors.yellowAccent[500], fontSize: 18 }} />
                        <Typography variant="body2">{merchant.rating}</Typography>
                      </Box>
                    )}
                    
                    {merchant.status === 'pending' && (
                      <>
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => handleApprove(merchant)}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          size="small"
                          startIcon={<CancelIcon />}
                          onClick={() => handleDecline(merchant)}
                        >
                          Decline
                        </Button>
                      </>
                    )}
                    
                    {merchant.status === 'active' && (
                      <Button
                        variant="outlined"
                        color="warning"
                        size="small"
                        startIcon={<BlockIcon />}
                        onClick={() => handleSuspend(merchant)}
                      >
                        Suspend
                      </Button>
                    )}
                    
                    {(merchant.status === 'suspended' || merchant.status === 'declined') && (
                      <Button
                        variant="contained"
                        color="info"
                        size="small"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => handleApprove(merchant)}
                      >
                        Reactivate
                      </Button>
                    )}
                    
                    <IconButton size="small" onClick={() => handleOpenDialog(merchant)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(merchant.id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* View Merchant Details Dialog */}
      <Dialog open={viewDialogOpen} onClose={handleCloseViewDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap="10px">
            <RestaurantIcon />
            Merchant Application Details
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedMerchant && (
            <Box display="flex" flexDirection="column" gap="12px" mt="10px">
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color={colors.grey[300]}>Application ID:</Typography>
                <Typography variant="body2" fontWeight="600">#{selectedMerchant.id}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color={colors.grey[300]}>Status:</Typography>
                <Chip 
                  label={STATUS_LABELS[selectedMerchant.status] || selectedMerchant.status} 
                  color={STATUS_COLORS[selectedMerchant.status] || "default"} 
                  size="small" 
                />
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color={colors.grey[300]}>Restaurant Name:</Typography>
                <Typography variant="body2" fontWeight="600">{selectedMerchant.name}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color={colors.grey[300]}>Cuisine Type:</Typography>
                <Typography variant="body2">{selectedMerchant.cuisine_type || 'N/A'}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color={colors.grey[300]}>Address:</Typography>
                <Typography variant="body2">{selectedMerchant.address || 'N/A'}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color={colors.grey[300]}>City:</Typography>
                <Typography variant="body2">{selectedMerchant.city || 'N/A'}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color={colors.grey[300]}>Phone:</Typography>
                <Typography variant="body2">{selectedMerchant.phone || 'N/A'}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color={colors.grey[300]}>Email:</Typography>
                <Typography variant="body2">{selectedMerchant.email || 'N/A'}</Typography>
              </Box>
              {selectedMerchant.description && (
                <Box>
                  <Typography variant="body2" color={colors.grey[300]} mb="5px">Description:</Typography>
                  <Typography variant="body2" p="10px" backgroundColor={colors.primary[400]} borderRadius="6px">
                    {selectedMerchant.description}
                  </Typography>
                </Box>
              )}

              {/* Documents Section */}
              <Box mt="15px">
                <Typography variant="h6" color={colors.yellowAccent[300]} mb="10px" display="flex" alignItems="center" gap="8px">
                  <InsertDriveFileIcon /> Submitted Documents
                </Typography>
                
                {documentsLoading ? (
                  <Box display="flex" justifyContent="center" py="20px">
                    <CircularProgress size={24} color="secondary" />
                  </Box>
                ) : merchantDocuments.length === 0 ? (
                  <Box 
                    p="15px" 
                    backgroundColor={colors.primary[400]} 
                    borderRadius="8px" 
                    textAlign="center"
                    border={`1px dashed ${colors.grey[600]}`}
                  >
                    <Typography variant="body2" color={colors.grey[400]}>
                      No documents submitted yet
                    </Typography>
                  </Box>
                ) : (
                  <Grid container spacing={2}>
                    {merchantDocuments.map((doc) => (
                      <Grid item xs={12} key={doc.id}>
                        <Box 
                          p="12px" 
                          backgroundColor={colors.primary[400]} 
                          borderRadius="8px"
                          display="flex"
                          alignItems="center"
                          gap="12px"
                          border={`1px solid ${colors.grey[700]}`}
                        >
                          <Box 
                            p="8px" 
                            borderRadius="6px"
                            backgroundColor={colors.blueAccent[700]}
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            {getDocumentIcon(doc.document_type)}
                          </Box>
                          <Box flex={1}>
                            <Typography variant="body2" fontWeight="600">
                              {doc.document_name}
                            </Typography>
                            <Typography variant="caption" color={colors.grey[400]}>
                              {getDocumentTypeLabel(doc.document_type)} • 
                              {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : 'Unknown date'}
                            </Typography>
                          </Box>
                          <IconButton 
                            size="small"
                            onClick={() => window.open(getFullDocumentUrl(doc.document_url), '_blank')}
                            sx={{ color: colors.blueAccent[300] }}
                          >
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog}>Close</Button>
          {selectedMerchant?.status === 'pending' && (
            <>
              <Button 
                variant="contained" 
                color="error" 
                startIcon={<CancelIcon />}
                onClick={() => handleDecline(selectedMerchant)}
              >
                Decline
              </Button>
              <Button 
                variant="contained" 
                color="success" 
                startIcon={<CheckCircleIcon />}
                onClick={() => handleApprove(selectedMerchant)}
              >
                Approve
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedMerchant ? 'Edit Merchant' : 'Add New Merchant'}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap="15px" mt="10px">
            <TextField
              label="Restaurant Name"
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
              label="Cuisine Type"
              value={formData.cuisine_type}
              onChange={(e) => setFormData({ ...formData, cuisine_type: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              fullWidth
            />
            <Box display="flex" gap="10px">
              <TextField
                label="City"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                fullWidth
              />
              <TextField
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                fullWidth
              />
            </Box>
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              fullWidth
            />
            <TextField
              label="Status"
              select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              fullWidth
            >
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="suspended">Suspended</MenuItem>
              <MenuItem value="declined">Declined</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {selectedMerchant ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Merchants;
