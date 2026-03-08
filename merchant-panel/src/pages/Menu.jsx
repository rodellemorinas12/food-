import { Box, Typography, useTheme, Paper, Button, Chip, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Alert, MenuItem as MuiMenuItem } from "@mui/material";
import { tokens } from "../theme";
import { useState, useEffect } from "react";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import CancelIcon from "@mui/icons-material/Cancel";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { API_URL, getFileUrl } from "../utils/api";

// Get user-specific storage key
const getStorageKey = () => {
  const merchantId = localStorage.getItem("merchantId") || "default";
  return `merchantMenuItems_${merchantId}`;
};

const Menu = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // Check merchant approval status (case-insensitive)
  const merchantStatus = (localStorage.getItem("merchantStatus") || "").toLowerCase();
  const isApproved = merchantStatus === "active" || merchantStatus === "approved";
  const isRejected = merchantStatus === "suspended" || merchantStatus === "declined";

  // Load menu items from server on mount
  useEffect(() => {
    const fetchMenuItems = async () => {
      const merchantId = localStorage.getItem("merchantId");
      const token = localStorage.getItem("userToken");
      
      if (merchantId && token) {
        try {
          const response = await fetch(`${API_URL}/menu-items/restaurant/${merchantId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const items = await response.json();
            setMenuItems(items);
            // Also save to localStorage as backup
            localStorage.setItem(getStorageKey(), JSON.stringify(items));
          }
        } catch (err) {
          console.error("Error fetching menu items:", err);
          // Fallback to localStorage
          try {
            const saved = localStorage.getItem(getStorageKey());
            if (saved) {
              setMenuItems(JSON.parse(saved));
            }
          } catch {}
        }
      } else {
        // Fallback to localStorage
        try {
          const saved = localStorage.getItem(getStorageKey());
          if (saved) {
            setMenuItems(JSON.parse(saved));
          }
        } catch {}
      }
    };
    
    fetchMenuItems();
  }, []);

  const [menuItems, setMenuItems] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [newItem, setNewItem] = useState({ name: "", description: "", price: "", category: "Main Dish", image: null });

  // Save menu items to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(getStorageKey(), JSON.stringify(menuItems));
  }, [menuItems]);

  const toggleStatus = (id) => {
    setMenuItems(menuItems.map(item =>
      item.id === id ? { ...item, status: item.status === "available" ? "unavailable" : "available" } : item
    ));
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setNewItem({ name: item.name, description: item.description || "", price: item.price, category: item.category || "Main Dish", image: item.image || null });
    } else {
      setEditingItem(null);
      setNewItem({ name: "", description: "", price: "", category: "Main Dish", image: null });
    }
    setOpenModal(true);
  };

  const handleSave = async () => {
    if (!newItem.name || !newItem.price) return;
    
    const merchantId = localStorage.getItem("merchantId");
    const token = localStorage.getItem("userToken");
    
    if (editingItem && merchantId && token) {
      // Update existing item on server
      try {
        const response = await fetch(`${API_URL}/menu-items/${editingItem.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: newItem.name,
            description: newItem.description,
            price: parseFloat(newItem.price),
            category: newItem.category,
            image_url: newItem.image
          })
        });
        
        if (response.ok) {
          setMenuItems(menuItems.map(item =>
            item.id === editingItem.id ? { ...item, ...newItem, price: parseFloat(newItem.price) } : item
          ));
        }
      } catch (err) {
        console.error("Error updating menu item:", err);
        // Still update locally
        setMenuItems(menuItems.map(item =>
          item.id === editingItem.id ? { ...item, ...newItem, price: parseFloat(newItem.price) } : item
        ));
      }
    } else if (merchantId && token) {
      // Create new item on server
      try {
        const response = await fetch(`${API_URL}/menu-items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            restaurant_id: merchantId,
            name: newItem.name,
            description: newItem.description,
            price: parseFloat(newItem.price),
            category: newItem.category,
            image_url: newItem.image,
            status: 'available'
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          setMenuItems([...menuItems, {
            ...newItem,
            price: parseFloat(newItem.price),
            id: data.id || Date.now(),
            status: "available",
            orders: 0
          }]);
        }
      } catch (err) {
        console.error("Error creating menu item:", err);
        // Still add locally
        setMenuItems([...menuItems, {
          ...newItem,
          price: parseFloat(newItem.price),
          id: Date.now(),
          status: "available",
          orders: 0
        }]);
      }
    } else {
      // No server, save locally only
      if (editingItem) {
        setMenuItems(menuItems.map(item =>
          item.id === editingItem.id ? { ...item, ...newItem, price: parseFloat(newItem.price) } : item
        ));
      } else {
        setMenuItems([...menuItems, {
          ...newItem,
          price: parseFloat(newItem.price),
          id: Date.now(),
          status: "available",
          orders: 0
        }]);
      }
    }
    setOpenModal(false);
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const token = localStorage.getItem("userToken");
      
      // Try to upload to server
      if (token) {
        try {
          const formData = new FormData();
          formData.append('image', file);
          
          const response = await fetch(`${API_URL}/menu-items/upload-image`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          });
          
          if (response.ok) {
            const data = await response.json();
            setNewItem({ ...newItem, image: data.path });
            return;
          }
        } catch (err) {
          console.error("Error uploading image:", err);
        }
      }
      
      // Fallback to local object URL
      const imageUrl = URL.createObjectURL(file);
      setNewItem({ ...newItem, image: imageUrl });
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      setMenuItems(menuItems.filter(item => item.id !== id));
    }
  };

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
          Menu Management is not available yet
        </Typography>
        <Paper sx={{ p: 3, backgroundColor: colors.primary[400], borderRadius: "10px", maxWidth: 500, width: "100%" }}>
          <Alert severity="warning">
            Your merchant account is pending admin approval. Once approved, you will be able to add and manage your menu items.
          </Alert>
        </Paper>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h2" fontWeight="bold" color={colors.grey[100]}>Menu Management</Typography>
          <Typography variant="h5" color={colors.greenAccent[400]}>Manage your restaurant menu items</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()} sx={{ backgroundColor: colors.greenAccent[600] }}>
          Add New Item
        </Button>
      </Box>

      {/* EMPTY STATE */}
      {menuItems.length === 0 && (
        <Paper sx={{ p: 5, backgroundColor: colors.primary[400], borderRadius: "10px", textAlign: "center" }}>
          <Typography variant="h5" color={colors.grey[400]} mb={2}>No menu items yet</Typography>
          <Typography variant="body2" color={colors.grey[500]} mb={3}>Click "Add New Item" to add your first menu item</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()} sx={{ backgroundColor: colors.greenAccent[600] }}>
            Add First Item
          </Button>
        </Paper>
      )}

      {/* MENU ITEMS GRID */}
      <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={3}>
        {menuItems.map((item) => (
          <Paper
            key={item.id}
            sx={{
              p: 3,
              backgroundColor: colors.primary[400],
              borderRadius: "10px",
              border: item.status === "unavailable" ? `2px solid ${colors.redAccent[500]}` : "none"
            }}
          >
            {/* Item Image - support both image (local) and image_url (server) */}
            {(item.image || item.image_url) && (
              <Box 
                sx={{ 
                  width: '100%', 
                  height: 180, 
                  borderRadius: 2, 
                  overflow: 'hidden',
                  mb: 2
                }}
              >
                <img 
                  src={getFileUrl(item.image || item.image_url)} 
                  alt={item.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              </Box>
            )}
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
              <Typography variant="h4" fontWeight="bold" color={colors.grey[100]}>{item.name}</Typography>
              <Chip
                label={item.status === "available" ? "Available" : "Unavailable"}
                color={item.status === "available" ? "success" : "error"}
                size="small"
              />
            </Box>
            <Typography variant="body2" color={colors.grey[300]} mb={2}>{item.description}</Typography>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h3" fontWeight="bold" color={colors.greenAccent[400]}>₱{Number(item.price).toFixed(2)}</Typography>
              <Typography variant="body2" color={colors.grey[400]}>{item.category}</Typography>
            </Box>
            <Typography variant="body2" color={colors.grey[400]} mb={2}>{item.orders || 0} orders</Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                size="small"
                onClick={() => handleOpenModal(item)}
                sx={{ color: colors.blueAccent[400], borderColor: colors.blueAccent[400] }}
              >
                Edit
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => toggleStatus(item.id)}
                sx={{
                  color: item.status === "available" ? colors.redAccent[400] : colors.greenAccent[400],
                  borderColor: item.status === "available" ? colors.redAccent[400] : colors.greenAccent[400]
                }}
              >
                {item.status === "available" ? "Disable" : "Enable"}
              </Button>
              <Button
                variant="outlined"
                startIcon={<DeleteIcon />}
                size="small"
                onClick={() => handleDelete(item.id)}
                sx={{ color: colors.redAccent[400], borderColor: colors.redAccent[400] }}
              >
                Delete
              </Button>
            </Box>
          </Paper>
        ))}
      </Box>

      {/* ADD/EDIT MODAL */}
      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { backgroundColor: colors.primary[400] } }}
      >
        <DialogTitle sx={{ color: colors.grey[100] }}>
          {editingItem ? "Edit Menu Item" : "Add New Menu Item"}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Item Name *"
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            sx={{ mb: 2, mt: 1 }}
            InputProps={{ style: { color: colors.grey[100] } }}
            InputLabelProps={{ style: { color: colors.grey[300] } }}
          />
          <TextField
            fullWidth
            label="Description"
            value={newItem.description}
            onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
            multiline
            rows={2}
            sx={{ mb: 2 }}
            InputProps={{ style: { color: colors.grey[100] } }}
            InputLabelProps={{ style: { color: colors.grey[300] } }}
          />
          <TextField
            fullWidth
            label="Price (₱) *"
            type="number"
            value={newItem.price}
            onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
            sx={{ mb: 2 }}
            InputProps={{ style: { color: colors.grey[100] } }}
            InputLabelProps={{ style: { color: colors.grey[300] } }}
            inputProps={{ min: 0, step: 0.01 }}
          />
          <TextField
            fullWidth
            select
            label="Category"
            value={newItem.category}
            onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
            SelectProps={{ MenuProps: { PaperProps: { sx: { backgroundColor: colors.primary[400] } } } }}
            InputProps={{ style: { color: colors.grey[100] } }}
            InputLabelProps={{ style: { color: colors.grey[300] } }}
          >
            <MuiMenuItem value="Main Dish">Main Dish</MuiMenuItem>
            <MuiMenuItem value="Noodles">Noodles</MuiMenuItem>
            <MuiMenuItem value="Soup">Soup</MuiMenuItem>
            <MuiMenuItem value="Drinks">Drinks</MuiMenuItem>
            <MuiMenuItem value="Dessert">Dessert</MuiMenuItem>
            <MuiMenuItem value="Snacks">Snacks</MuiMenuItem>
            <MuiMenuItem value="Rice">Rice</MuiMenuItem>
            <MuiMenuItem value="Other">Other</MuiMenuItem>
          </TextField>
          {/* Image Upload */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color={colors.grey[300]} sx={{ mb: 1 }}>Item Image (Optional)</Typography>
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUploadIcon />}
              sx={{ color: colors.blueAccent[400], borderColor: colors.blueAccent[400] }}
            >
              Upload Image
              <input type="file" hidden accept="image/*" onChange={handleImageChange} />
            </Button>
            {newItem.image && (
              <Box mt={2} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box 
                  sx={{ 
                    width: 100, 
                    height: 100, 
                    borderRadius: 2, 
                    overflow: 'hidden',
                    border: `2px solid ${colors.greenAccent[500]}`
                  }}
                >
                  <img 
                    src={newItem.image} 
                    alt="Preview" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                </Box>
                <Button 
                  size="small" 
                  onClick={() => setNewItem({ ...newItem, image: null })}
                  sx={{ color: colors.redAccent[400] }}
                >
                  Remove
                </Button>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)} sx={{ color: colors.grey[300] }}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!newItem.name || !newItem.price}
            sx={{ backgroundColor: colors.greenAccent[600] }}
          >
            {editingItem ? "Update" : "Add Item"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Menu;
