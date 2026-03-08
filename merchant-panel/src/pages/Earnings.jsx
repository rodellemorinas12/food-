import { useState } from "react";
import { Box, Typography, Paper, Grid, Card, CardContent, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Alert, Chip, Divider, useTheme } from "@mui/material";
import { tokens } from "../theme";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import CancelIcon from "@mui/icons-material/Cancel";

const Earnings = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [selectedPeriod, setSelectedPeriod] = useState("today");
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [payoutRequest, setPayoutRequest] = useState({ amount: "", note: "" });
  const [payoutSuccess, setPayoutSuccess] = useState(false);

  // Check merchant approval status (case-insensitive)
  const merchantStatus = (localStorage.getItem("merchantStatus") || "").toLowerCase();
  const isApproved = merchantStatus === "active" || merchantStatus === "approved";
  const isRejected = merchantStatus === "suspended" || merchantStatus === "declined";

  // Empty earnings data - will be populated from API when approved
  const earningsData = {
    today: { totalSales: 0, commission: 0, netIncome: 0, orderCount: 0, pendingPayout: 0 },
    week: { totalSales: 0, commission: 0, netIncome: 0, orderCount: 0, pendingPayout: 0 },
    month: { totalSales: 0, commission: 0, netIncome: 0, orderCount: 0, pendingPayout: 0 }
  };

  const currentData = earningsData[selectedPeriod];
  const commissionRate = 25;

  // Empty transaction history
  const transactions = [];

  const handleRequestPayout = () => {
    if (parseFloat(payoutRequest.amount) > currentData.pendingPayout) {
      alert("Amount exceeds available balance");
      return;
    }
    setPayoutSuccess(true);
    setTimeout(() => {
      setPayoutDialogOpen(false);
      setPayoutSuccess(false);
      setPayoutRequest({ amount: "", note: "" });
    }, 2000);
  };

  const formatCurrency = (amount) => {
    return `₱${Number(amount).toFixed(2)}`;
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
          Earnings & Payouts is not available yet
        </Typography>
        <Paper sx={{ p: 3, backgroundColor: colors.primary[400], borderRadius: "10px", maxWidth: 500, width: "100%" }}>
          <Alert severity="warning">
            Your merchant account is pending admin approval. Once approved, you will be able to track your earnings and request payouts.
          </Alert>
        </Paper>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* HEADER */}
      <Box mb={3}>
        <Typography variant="h2" fontWeight="bold" color={colors.grey[100]}>Earnings & Payouts</Typography>
        <Typography variant="h5" color={colors.greenAccent[400]}>Track your revenue and request payouts</Typography>
      </Box>

      {/* PERIOD SELECTOR */}
      <Paper sx={{ p: 2, mb: 3, backgroundColor: colors.primary[400], borderRadius: "10px" }}>
        <Box display="flex" gap={2} alignItems="center">
          <CalendarTodayIcon sx={{ color: colors.grey[300] }} />
          <Button 
            variant={selectedPeriod === "today" ? "contained" : "outlined"} 
            onClick={() => setSelectedPeriod("today")}
            size="small"
            sx={{ color: selectedPeriod === "today" ? colors.grey[100] : colors.grey[300], borderColor: colors.grey[500] }}
          >
            Today
          </Button>
          <Button 
            variant={selectedPeriod === "week" ? "contained" : "outlined"} 
            onClick={() => setSelectedPeriod("week")}
            size="small"
            sx={{ color: selectedPeriod === "week" ? colors.grey[100] : colors.grey[300], borderColor: colors.grey[500] }}
          >
            This Week
          </Button>
          <Button 
            variant={selectedPeriod === "month" ? "contained" : "outlined"} 
            onClick={() => setSelectedPeriod("month")}
            size="small"
            sx={{ color: selectedPeriod === "month" ? colors.grey[100] : colors.grey[300], borderColor: colors.grey[500] }}
          >
            This Month
          </Button>
        </Box>
      </Paper>

      {/* STATS CARDS */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: colors.primary[400], borderRadius: "10px" }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <AttachMoneyIcon sx={{ color: colors.greenAccent[400], mr: 1 }} />
                <Typography variant="body2" color={colors.grey[300]}>Total Sales</Typography>
              </Box>
              <Typography variant="h3" color={colors.grey[100]} fontWeight="bold">
                {formatCurrency(currentData.totalSales)}
              </Typography>
              <Typography variant="caption" color={colors.grey[400]}>
                {currentData.orderCount} orders
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: colors.primary[400], borderRadius: "10px" }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <TrendingDownIcon sx={{ color: colors.redAccent[400], mr: 1 }} />
                <Typography variant="body2" color={colors.grey[300]}>Commission ({commissionRate}%)</Typography>
              </Box>
              <Typography variant="h3" color={colors.redAccent[400]} fontWeight="bold">
                {formatCurrency(currentData.commission)}
              </Typography>
              <Typography variant="caption" color={colors.grey[400]}>
                Platform fee
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: colors.primary[400], borderRadius: "10px" }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <TrendingUpIcon sx={{ color: colors.greenAccent[400], mr: 1 }} />
                <Typography variant="body2" color={colors.grey[300]}>Net Income</Typography>
              </Box>
              <Typography variant="h3" color={colors.greenAccent[400]} fontWeight="bold">
                {formatCurrency(currentData.netIncome)}
              </Typography>
              <Typography variant="caption" color={colors.grey[400]}>
                After commission
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: colors.primary[400], borderRadius: "10px" }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <AccountBalanceWalletIcon sx={{ color: colors.blueAccent[400], mr: 1 }} />
                <Typography variant="body2" color={colors.grey[300]}>Available Balance</Typography>
              </Box>
              <Typography variant="h3" color={colors.blueAccent[400]} fontWeight="bold">
                {formatCurrency(currentData.pendingPayout)}
              </Typography>
              <Button 
                variant="contained" 
                size="small" 
                startIcon={<RequestQuoteIcon />}
                onClick={() => setPayoutDialogOpen(true)}
                disabled={currentData.pendingPayout < 500}
                sx={{ mt: 1, backgroundColor: colors.greenAccent[600] }}
              >
                Request Payout
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* COMMISSION INFO */}
      <Paper sx={{ p: 2, mb: 3, backgroundColor: colors.blueAccent[900], borderRadius: "10px" }}>
        <Typography variant="body2" color={colors.blueAccent[200]}>
          <strong>Commission Rate:</strong> {commissionRate}% per order | 
          <strong> Payout Schedule:</strong> Every Monday | 
          <strong> Minimum Payout:</strong> ₱500.00
        </Typography>
      </Paper>

      {/* TRANSACTION HISTORY */}
      <Paper sx={{ backgroundColor: colors.primary[400], borderRadius: "10px", overflow: "hidden" }}>
        <Box p={2} borderBottom={`1px solid ${colors.primary[500]}`}>
          <Typography variant="h5" color={colors.grey[100]}>Transaction History</Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: colors.primary[500] }}>
                <TableCell sx={{ color: colors.grey[100] }}>Date</TableCell>
                <TableCell sx={{ color: colors.grey[100] }}>Order ID</TableCell>
                <TableCell sx={{ color: colors.grey[100] }}>Customer</TableCell>
                <TableCell sx={{ color: colors.grey[100] }} align="right">Amount</TableCell>
                <TableCell sx={{ color: colors.grey[100] }} align="right">Commission</TableCell>
                <TableCell sx={{ color: colors.grey[100] }} align="right">Net</TableCell>
                <TableCell sx={{ color: colors.grey[100] }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id} sx={{ borderBottom: `1px solid ${colors.primary[500]}` }}>
                  <TableCell sx={{ color: colors.grey[200] }}>{tx.date}</TableCell>
                  <TableCell sx={{ color: colors.greenAccent[400] }}>{tx.orderId}</TableCell>
                  <TableCell sx={{ color: colors.grey[200] }}>{tx.customer}</TableCell>
                  <TableCell sx={{ color: colors.grey[100] }} align="right">{formatCurrency(tx.amount)}</TableCell>
                  <TableCell sx={{ color: colors.redAccent[400] }} align="right">-{formatCurrency(tx.commission)}</TableCell>
                  <TableCell sx={{ color: colors.greenAccent[400] }} align="right">{formatCurrency(tx.net)}</TableCell>
                  <TableCell>
                    <Chip 
                      label={tx.status.charAt(0).toUpperCase() + tx.status.slice(1)} 
                      color="success" 
                      size="small" 
                      icon={<CheckCircleIcon />}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* PAYOUT DIALOG */}
      <Dialog open={payoutDialogOpen} onClose={() => setPayoutDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { backgroundColor: colors.primary[400] } }}>
        <DialogTitle sx={{ color: colors.grey[100] }}>Request Payout</DialogTitle>
        <DialogContent>
          {payoutSuccess ? (
            <Box textAlign="center" py={4}>
              <CheckCircleIcon sx={{ fontSize: 60, color: colors.greenAccent[500], mb: 2 }} />
              <Typography variant="h5" color={colors.grey[100]} gutterBottom>
                Payout Request Submitted!
              </Typography>
              <Typography variant="body2" color={colors.grey[300]}>
                Your payout will be processed within 1-3 business days.
              </Typography>
            </Box>
          ) : (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                Available Balance: <strong>{formatCurrency(currentData.pendingPayout)}</strong>
              </Alert>
              <TextField
                fullWidth
                label="Amount"
                type="number"
                value={payoutRequest.amount}
                onChange={(e) => setPayoutRequest({ ...payoutRequest, amount: e.target.value })}
                InputProps={{ style: { color: colors.grey[100] } }}
                InputLabelProps={{ style: { color: colors.grey[300] } }}
                sx={{ mb: 2 }}
                helperText={`Minimum: ₱500.00 | Maximum: ${formatCurrency(currentData.pendingPayout)}`}
              />
              <TextField
                fullWidth
                label="Note (Optional)"
                value={payoutRequest.note}
                onChange={(e) => setPayoutRequest({ ...payoutRequest, note: e.target.value })}
                InputProps={{ style: { color: colors.grey[100] } }}
                InputLabelProps={{ style: { color: colors.grey[300] } }}
                multiline
                rows={2}
              />
            </>
          )}
        </DialogContent>
        {!payoutSuccess && (
          <DialogActions>
            <Button onClick={() => setPayoutDialogOpen(false)} sx={{ color: colors.grey[300] }}>Cancel</Button>
            <Button 
              onClick={handleRequestPayout} 
              variant="contained"
              disabled={!payoutRequest.amount || parseFloat(payoutRequest.amount) < 500 || parseFloat(payoutRequest.amount) > currentData.pendingPayout}
              sx={{ backgroundColor: colors.greenAccent[600] }}
            >
              Submit Request
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </Box>
  );
};

export default Earnings;
