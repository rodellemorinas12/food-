import { Box, Button, TextField, Typography, Card, CardContent, Grid, Switch, FormControlLabel, CircularProgress, useTheme, Divider } from "@mui/material";
import { tokens } from "../../theme";
import { useState, useEffect } from "react";
import { fetchSettings, updateSettings } from "../../api";
import Header from "../../components/Header";
import SaveIcon from "@mui/icons-material/Save";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import PercentIcon from "@mui/icons-material/Percent";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import DiscountIcon from "@mui/icons-material/Discount";

const CommissionSettings = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    commission_percent: 15,
    delivery_fee_base: 30,
    delivery_fee_per_km: 10,
    surge_pricing_enabled: false,
    surge_multiplier: 1.5,
    surge_threshold_orders: 20,
    promo_codes_enabled: false,
    minimum_order_amount: 100,
    maximum_discount: 200
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await fetchSettings();
      if (data) {
        setSettings({ ...settings, ...data });
      }
    } catch (error) {
      console.log("Using default settings");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings({ ...settings, [field]: value });
    setMessage({ type: '', text: '' });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(settings);
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving settings' });
    } finally {
      setSaving(false);
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb="20px">
        <Header 
          title="COMMISSION & FEES" 
          subtitle="Configure platform fees and pricing settings" 
        />
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          onClick={handleSave}
          disabled={saving}
          sx={{ backgroundColor: colors.blueAccent[700] }}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </Box>

      {message.text && (
        <Box 
          mb="20px" 
          p="15px" 
          borderRadius="8px"
          backgroundColor={message.type === 'success' ? colors.greenAccent[700] : colors.redAccent[700]}
        >
          <Typography>{message.text}</Typography>
        </Box>
      )}

      <Grid container spacing="20px">
        {/* Commission Settings */}
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: colors.primary[400] }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap="10px" mb="20px">
                <PercentIcon sx={{ color: colors.blueAccent[400], fontSize: 30 }} />
                <Typography variant="h5">Commission Settings</Typography>
              </Box>
              
              <TextField
                label="Platform Commission (%)"
                type="number"
                value={settings.commission_percent}
                onChange={(e) => handleChange('commission_percent', parseFloat(e.target.value))}
                fullWidth
                InputProps={{ inputProps: { min: 0, max: 100, step: 0.5 } }}
                helperText="Percentage charged to merchants on each order"
                sx={{ mb: 3 }}
              />

              <TextField
                label="Minimum Order Amount (₱)"
                type="number"
                value={settings.minimum_order_amount}
                onChange={(e) => handleChange('minimum_order_amount', parseFloat(e.target.value))}
                fullWidth
                InputProps={{ inputProps: { min: 0 } }}
                helperText="Minimum order value for delivery"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Delivery Fee Settings */}
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: colors.primary[400] }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap="10px" mb="20px">
                <LocalShippingIcon sx={{ color: colors.greenAccent[400], fontSize: 30 }} />
                <Typography variant="h5">Delivery Fees</Typography>
              </Box>
              
              <TextField
                label="Base Delivery Fee (₱)"
                type="number"
                value={settings.delivery_fee_base}
                onChange={(e) => handleChange('delivery_fee_base', parseFloat(e.target.value))}
                fullWidth
                InputProps={{ inputProps: { min: 0 } }}
                helperText="Base fee for any delivery"
                sx={{ mb: 3 }}
              />

              <TextField
                label="Fee per Kilometer (₱)"
                type="number"
                value={settings.delivery_fee_per_km}
                onChange={(e) => handleChange('delivery_fee_per_km', parseFloat(e.target.value))}
                fullWidth
                InputProps={{ inputProps: { min: 0 } }}
                helperText="Additional fee per kilometer"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Surge Pricing */}
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: colors.primary[400] }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap="10px" mb="20px">
                <AttachMoneyIcon sx={{ color: colors.yellowAccent[400], fontSize: 30 }} />
                <Typography variant="h5">Surge Pricing</Typography>
              </Box>
              
              <FormControlLabel
                control={
                  <Switch 
                    checked={settings.surge_pricing_enabled}
                    onChange={(e) => handleChange('surge_pricing_enabled', e.target.checked)}
                    color="secondary"
                  />
                }
                label="Enable Surge Pricing"
                sx={{ mb: 2, display: 'block' }}
              />

              {settings.surge_pricing_enabled && (
                <>
                  <TextField
                    label="Surge Multiplier"
                    type="number"
                    value={settings.surge_multiplier}
                    onChange={(e) => handleChange('surge_multiplier', parseFloat(e.target.value))}
                    fullWidth
                    InputProps={{ inputProps: { min: 1, max: 5, step: 0.1 } }}
                    helperText="Price multiplier during surge (e.g., 1.5 = 50% increase)"
                    sx={{ mb: 3 }}
                  />

                  <TextField
                    label="Surge Threshold (orders)"
                    type="number"
                    value={settings.surge_threshold_orders}
                    onChange={(e) => handleChange('surge_threshold_orders', parseInt(e.target.value))}
                    fullWidth
                    InputProps={{ inputProps: { min: 1 } }}
                    helperText="Number of concurrent orders to trigger surge"
                  />
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Promo Codes */}
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: colors.primary[400] }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap="10px" mb="20px">
                <DiscountIcon sx={{ color: colors.redAccent[400], fontSize: 30 }} />
                <Typography variant="h5">Promo Codes</Typography>
              </Box>
              
              <FormControlLabel
                control={
                  <Switch 
                    checked={settings.promo_codes_enabled}
                    onChange={(e) => handleChange('promo_codes_enabled', e.target.checked)}
                    color="secondary"
                  />
                }
                label="Enable Promo Codes"
                sx={{ mb: 2, display: 'block' }}
              />

              {settings.promo_codes_enabled && (
                <TextField
                  label="Maximum Discount (₱)"
                  type="number"
                  value={settings.maximum_discount}
                  onChange={(e) => handleChange('maximum_discount', parseFloat(e.target.value))}
                  fullWidth
                  InputProps={{ inputProps: { min: 0 } }}
                  helperText="Maximum discount amount per order"
                />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Summary Card */}
      <Box mt="20px">
        <Card sx={{ backgroundColor: colors.primary[400] }}>
          <CardContent>
            <Typography variant="h5" mb="15px">Fee Summary</Typography>
            <Typography variant="body2" color={colors.grey[300]} mb="10px">
              Current configuration for order pricing:
            </Typography>
            <Box display="flex" gap="30px" flexWrap="wrap">
              <Box>
                <Typography variant="caption" color={colors.grey[400]}>Commission</Typography>
                <Typography variant="h6">{settings.commission_percent}%</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color={colors.grey[400]}>Base Delivery</Typography>
                <Typography variant="h6">₱{settings.delivery_fee_base}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color={colors.grey[400]}>Per KM</Typography>
                <Typography variant="h6">₱{settings.delivery_fee_per_km}/km</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color={colors.grey[400]}>Min Order</Typography>
                <Typography variant="h6">₱{settings.minimum_order_amount}</Typography>
              </Box>
              {settings.surge_pricing_enabled && (
                <Box>
                  <Typography variant="caption" color={colors.grey[400]}>Surge Multiplier</Typography>
                  <Typography variant="h6">{settings.surge_multiplier}x</Typography>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default CommissionSettings;
