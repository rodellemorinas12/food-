import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Typography, IconButton, Chip, CircularProgress, useTheme } from "@mui/material";
import { tokens } from "../../theme";
import { useState, useEffect, useCallback } from "react";
import { fetchRiders, createRider, updateRider, deleteRider } from "../../api";
import Header from "../../components/Header";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import StarIcon from "@mui/icons-material/Star";

const STATUS_COLORS = {
  available: "success",
  busy: "warning",
  offline: "default"
};

const STATUS_LABELS = {
  available: "Available",
  busy: "Busy",
  offline: "Offline"
};

const Riders = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRider, setSelectedRider] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    vehicle_type: "Bike",
    status: "offline"
  });

  const loadData = useCallback(async () => {
    try {
      const data = await fetchRiders();
      setRiders(data || []);
    } catch (error) {
      console.error("Error loading riders:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenDialog = (rider = null) => {
    if (rider) {
      setSelectedRider(rider);
      setFormData({
        name: rider.name,
        email: rider.email,
        phone: rider.phone || "",
        vehicle_type: rider.vehicle_type || "Bike",
        status: rider.status
      });
    } else {
      setSelectedRider(null);
      setFormData({
        name: "",
        email: "",
        phone: "",
        vehicle_type: "Bike",
        status: "offline"
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedRider(null);
  };

  const handleSubmit = async () => {
    try {
      if (selectedRider) {
        await updateRider(selectedRider.id, formData);
      } else {
        await createRider(formData);
      }
      handleCloseDialog();
      loadData();
    } catch (error) {
      console.error("Error saving rider:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this rider?")) {
      try {
        await deleteRider(id);
        loadData();
      } catch (error) {
        console.error("Error deleting rider:", error);
      }
    }
  };

  const handleStatusChange = async (rider, newStatus) => {
    try {
      await updateRider(rider.id, { ...rider, status: newStatus });
      loadData();
    } catch (error) {
      console.error("Error updating status:", error);
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
        <Header title="RIDERS" subtitle="Manage delivery riders" />
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ backgroundColor: colors.blueAccent[700] }}
        >
          Add Rider
        </Button>
      </Box>

      {/* RIDERS TABLE */}
      <Box
        mt="20px"
        overflow="auto"
        backgroundColor={colors.primary[400]}
        borderRadius="8px"
      >
        <Box p="20px">
          <Typography variant="h5" fontWeight="600" mb="20px">
            All Riders ({riders.length})
          </Typography>
          {riders.length === 0 ? (
            <Typography color="text.secondary">No riders yet. Add your first rider!</Typography>
          ) : (
            <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap="20px">
              {riders.map((rider) => (
                <Box
                  key={rider.id}
                  backgroundColor={colors.primary[500]}
                  p="20px"
                  borderRadius="8px"
                  display="flex"
                  flexDirection="column"
                  gap="10px"
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" fontWeight="600">
                      {rider.name}
                    </Typography>
                    <Chip 
                      icon={<DirectionsBikeIcon />}
                      label={rider.vehicle_type || "Bike"} 
                      color="default" 
                      size="small" 
                    />
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Chip 
                      label={STATUS_LABELS[rider.status]} 
                      color={STATUS_COLORS[rider.status]} 
                      size="small" 
                    />
                    {selectedRider && selectedRider.id === rider.id ? (
                      <TextField
                        select
                        size="small"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        sx={{ minWidth: 100 }}
                      >
                        {Object.entries(STATUS_LABELS).map(([value, label]) => (
                          <MenuItem key={value} value={value}>
                            {label}
                          </MenuItem>
                        ))}
                      </TextField>
                    ) : (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          const nextStatus = rider.status === "offline" ? "available" : rider.status === "available" ? "busy" : "offline";
                          handleStatusChange(rider, nextStatus);
                        }}
                        sx={{ 
                          color: STATUS_COLORS[rider.status === "offline" ? "available" : rider.status === "available" ? "busy" : "offline"],
                          borderColor: STATUS_COLORS[rider.status === "offline" ? "available" : rider.status === "available" ? "busy" : "offline"]
                        }}
                      >
                        Set {rider.status === "offline" ? "Available" : rider.status === "available" ? "Busy" : "Offline"}
                      </Button>
                    )}
                  </Box>
                  
                  <Box display="flex" alignItems="center" gap="10px">
                    <EmailIcon sx={{ color: colors.grey[400], fontSize: 20 }} />
                    <Typography variant="body2" color={colors.grey[200]}>
                      {rider.email}
                    </Typography>
                  </Box>
                  
                  {rider.phone && (
                    <Box display="flex" alignItems="center" gap="10px">
                      <PhoneIcon sx={{ color: colors.grey[400], fontSize: 20 }} />
                      <Typography variant="body2" color={colors.grey[200]}>
                        {rider.phone}
                      </Typography>
                    </Box>
                  )}
                  
                  <Box display="flex" justifyContent="space-between" alignItems="center" mt="5px">
                    <Box display="flex" alignItems="center" gap="5px">
                      <StarIcon sx={{ color: colors.yellowAccent[500], fontSize: 20 }} />
                      <Typography variant="body2" color={colors.grey[200]}>
                        {Number(rider.rating || 0).toFixed(2)}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color={colors.grey[200]}>
                      {rider.total_deliveries || 0} deliveries
                    </Typography>
                  </Box>
                  
                  <Typography variant="caption" color={colors.grey[400]}>
                    Since: {new Date(rider.created_at).toLocaleDateString()}
                  </Typography>
                  
                  <Box display="flex" gap="10px" mt="5px">
                    <IconButton size="small" onClick={() => handleOpenDialog(rider)}>
                      <EditIcon sx={{ color: colors.blueAccent[300] }} />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(rider.id)}>
                      <DeleteIcon sx={{ color: colors.redAccent[400] }} />
                    </IconButton>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>

      {/* CREATE/EDIT RIDER DIALOG */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedRider ? "Edit Rider" : "Add New Rider"}</DialogTitle>
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
              select
              label="Vehicle Type"
              value={formData.vehicle_type}
              onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
              fullWidth
            >
              <MenuItem value="Bike">Bike</MenuItem>
              <MenuItem value="Motorcycle">Motorcycle</MenuItem>
              <MenuItem value="Car">Car</MenuItem>
              <MenuItem value="Van">Van</MenuItem>
            </TextField>
            <TextField
              select
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              fullWidth
            >
              <MenuItem value="available">Available</MenuItem>
              <MenuItem value="busy">Busy</MenuItem>
              <MenuItem value="offline">Offline</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {selectedRider ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Riders;
