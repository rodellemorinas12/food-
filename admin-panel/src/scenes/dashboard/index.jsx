import { Box, Button, IconButton, Typography, useTheme, CircularProgress, Chip } from "@mui/material";
import { tokens } from "../../theme";
import { useState, useEffect, useCallback, memo } from "react";
import { fetchFoodDeliveryStats, fetchAPI } from "../../api";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import PeopleIcon from "@mui/icons-material/People";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import CardMembershipIcon from "@mui/icons-material/CardMembership";
import Header from "../../components/Header";
import StatBox from "../../components/StatBox";

// Constants for magic values
const CHART_CONSTANTS = {
  GRID_COLUMN_SPANS: {
    STAT_BOX: 3,
    LARGE_CHART: 8,
    SMALL_CHART: 4,
  },
  ROW_HEIGHT: 140,
  GAP: "20px",
};

// Default empty stats
const DEFAULT_STATS = {
  totalOrders: 0,
  totalRevenue: 0,
  ordersByStatus: {},
  activeRiders: 0,
  totalCustomers: 0,
  recentOrders: [],
  todayOrders: 0,
  todayRevenue: 0,
  restaurants: 0,
  popularItems: [],
  // Commission stats
  earnings: {
    commissions: { count: 0, total: 0 },
    deliveryFees: { count: 0, total: 0 },
    subscriptions: { count: 0, total: 0 },
    grossEarnings: 0
  }
};

// Memoized components
const MemoizedStatBox = memo(StatBox);

// Loading component
const LoadingSpinner = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
    <CircularProgress color="secondary" size={60} />
  </Box>
);

// Empty state component
const EmptyState = ({ onRetry }) => (
  <Box 
    display="flex" 
    flexDirection="column" 
    alignItems="center" 
    justifyContent="center" 
    minHeight="400px"
    p={3}
  >
    <Typography variant="h5" color="text.secondary" gutterBottom>
      No Data Available
    </Typography>
    <Typography variant="body1" color="text.secondary" gutterBottom>
      The dashboard is empty because there's no data in the database yet.
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
      Add some data to see your food delivery statistics.
    </Typography>
    <Button 
      variant="contained" 
      color="primary" 
      onClick={onRetry}
    >
      Refresh Dashboard
    </Button>
  </Box>
);

// Error component
const ErrorDisplay = ({ message, onRetry }) => (
  <Box 
    display="flex" 
    flexDirection="column" 
    alignItems="center" 
    justifyContent="center" 
    minHeight="400px"
    p={3}
  >
    <Typography variant="h5" color="error" gutterBottom>
      Error Loading Data
    </Typography>
    <Typography variant="body1" color="text.secondary" gutterBottom>
      {message}
    </Typography>
    <Button 
      variant="contained" 
      color="primary" 
      onClick={onRetry}
      sx={{ mt: 2 }}
    >
      Retry
    </Button>
  </Box>
);

// Stats box helper
const StatsBox = ({ title, subtitle, increase, icon, colors }) => (
  <MemoizedStatBox
    title={title?.toLocaleString() || '0'}
    subtitle={subtitle}
    progress={0}
    increase={increase}
    icon={icon}
  />
);

// Order status chip helper
const OrderStatusChip = ({ status }) => {
  const statusColors = {
    pending: "warning",
    confirmed: "info",
    preparing: "secondary",
    out_for_delivery: "primary",
    delivered: "success",
    cancelled: "error"
  };
  
  const statusLabels = {
    pending: "Pending",
    confirmed: "Confirmed",
    preparing: "Preparing",
    out_for_delivery: "Out for Delivery",
    delivered: "Delivered",
    cancelled: "Cancelled"
  };
  
  return (
    <Chip 
      label={statusLabels[status] || status} 
      color={statusColors[status] || "default"} 
      size="small" 
    />
  );
};

// Dashboard content component
const DashboardContent = ({ stats, colors, hasData }) => {
  if (!hasData) {
    return (
      <Box gridColumn="span 12">
        <EmptyState onRetry={() => window.location.reload()} />
      </Box>
    );
  }

  return (
    <>
      {/* ROW 1 - Stats Boxes */}
      <Box
        gridColumn={`span ${CHART_CONSTANTS.GRID_COLUMN_SPANS.STAT_BOX}`}
        backgroundColor={colors.primary[400]}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <StatsBox
          title={stats.totalOrders}
          subtitle="Total Orders"
          increase={`+${stats.todayOrders} today`}
          icon={<ShoppingCartIcon sx={{ color: colors.greenAccent[600], fontSize: "26px" }} />}
          colors={colors}
        />
      </Box>
      <Box
        gridColumn={`span ${CHART_CONSTANTS.GRID_COLUMN_SPANS.STAT_BOX}`}
        backgroundColor={colors.primary[400]}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <StatsBox
          title={`₱${Number(stats.totalRevenue).toFixed(2)}`}
          subtitle="Total Revenue"
          increase={`+₱${Number(stats.todayRevenue).toFixed(2)} today`}
          icon={<AttachMoneyIcon sx={{ color: colors.greenAccent[600], fontSize: "26px" }} />}
          colors={colors}
        />
      </Box>
      <Box
        gridColumn={`span ${CHART_CONSTANTS.GRID_COLUMN_SPANS.STAT_BOX}`}
        backgroundColor={colors.primary[400]}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <StatsBox
          title={stats.totalCustomers}
          subtitle="Total Customers"
          increase="+0 today"
          icon={<PeopleIcon sx={{ color: colors.greenAccent[600], fontSize: "26px" }} />}
          colors={colors}
        />
      </Box>
      <Box
        gridColumn={`span ${CHART_CONSTANTS.GRID_COLUMN_SPANS.STAT_BOX}`}
        backgroundColor={colors.primary[400]}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <StatsBox
          title={stats.activeRiders}
          subtitle="Active Riders"
          increase="Available"
          icon={<LocalShippingIcon sx={{ color: colors.greenAccent[600], fontSize: "26px" }} />}
          colors={colors}
        />
      </Box>

      {/* ROW 1.5 - EARNINGS STATS */}
      <Box
        gridColumn={`span ${CHART_CONSTANTS.GRID_COLUMN_SPANS.STAT_BOX}`}
        backgroundColor={colors.primary[400]}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <StatsBox
          title={`₱${Number(stats.earnings?.commissions?.total || 0).toFixed(2)}`}
          subtitle="Commissions"
          increase={`${stats.earnings?.commissions?.count || 0} orders`}
          icon={<TrendingUpIcon sx={{ color: colors.yellowAccent[600], fontSize: "26px" }} />}
          colors={colors}
        />
      </Box>
      <Box
        gridColumn={`span ${CHART_CONSTANTS.GRID_COLUMN_SPANS.STAT_BOX}`}
        backgroundColor={colors.primary[400]}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <StatsBox
          title={`₱${Number(stats.earnings?.deliveryFees?.total || 0).toFixed(2)}`}
          subtitle="Delivery Fees"
          increase={`${stats.earnings?.deliveryFees?.count || 0} deliveries`}
          icon={<LocalShippingIcon sx={{ color: colors.blueAccent[600], fontSize: "26px" }} />}
          colors={colors}
        />
      </Box>
      <Box
        gridColumn={`span ${CHART_CONSTANTS.GRID_COLUMN_SPANS.STAT_BOX}`}
        backgroundColor={colors.primary[400]}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <StatsBox
          title={`₱${Number(stats.earnings?.subscriptions?.total || 0).toFixed(2)}`}
          subtitle="Subscriptions"
          increase={`${stats.earnings?.subscriptions?.count || 0} active`}
          icon={<CardMembershipIcon sx={{ color: colors.greenAccent[600], fontSize: "26px" }} />}
          colors={colors}
        />
      </Box>
      <Box
        gridColumn={`span ${CHART_CONSTANTS.GRID_COLUMN_SPANS.STAT_BOX}`}
        backgroundColor={colors.primary[400]}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <StatsBox
          title={`₱${Number(stats.earnings?.grossEarnings || 0).toFixed(2)}`}
          subtitle="Gross Earnings"
          increase="Today"
          icon={<AccountBalanceWalletIcon sx={{ color: colors.redAccent[600], fontSize: "26px" }} />}
          colors={colors}
        />
      </Box>

      {/* ROW 2 - Recent Orders */}
      <Box
        gridColumn={`span ${CHART_CONSTANTS.GRID_COLUMN_SPANS.LARGE_CHART}`}
        gridRow="span 2"
        backgroundColor={colors.primary[400]}
      >
        <Box
          mt="25px"
          p="0 30px"
          display="flex "
          justifyContent="space-between"
          alignItems="center"
        >
          <Box>
            <Typography variant="h5" fontWeight="600" color={colors.grey[100]}>
              Recent Orders
            </Typography>
            <Typography
              variant="h3"
              fontWeight="bold"
              color={colors.greenAccent[500]}
            >
              {stats.totalOrders} Total
            </Typography>
          </Box>
          <Box>
            <IconButton>
              <DownloadOutlinedIcon sx={{ fontSize: "26px", color: colors.greenAccent[500] }} />
            </IconButton>
          </Box>
        </Box>
        <Box height="250px" overflow="auto" p="20px">
          {stats.recentOrders && Array.isArray(stats.recentOrders) && stats.recentOrders.length > 0 ? (
            stats.recentOrders.map((order, i) => (
              <Box
                key={`${order.id}-${i}`}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                borderBottom={`1px solid ${colors.primary[500]}`}
                p="15px"
              >
                <Box>
                  <Typography color={colors.greenAccent[500]} variant="h6" fontWeight="600">
                    {order.order_number}
                  </Typography>
                  <Typography color={colors.grey[100]}>
                    Items: {Array.isArray(order.food_items) 
                      ? order.food_items.map(item => `${item.name} x${item.quantity}`).join(", ")
                      : order.food_items 
                        ? (typeof order.food_items === 'string' ? JSON.parse(order.food_items).map(item => `${item.name} x${item.quantity}`).join(", ") : 'No items')
                        : 'No items'}
                  </Typography>
                  {order.customer_name && (
                    <Typography variant="body2" color={colors.grey[300]}>
                      Customer: {order.customer_name}
                    </Typography>
                  )}
                </Box>
                <Box display="flex" alignItems="center" gap="10px">
                  <OrderStatusChip status={order.status} />
                  <Box
                    backgroundColor={colors.greenAccent[500]}
                    p="5px 10px"
                    borderRadius="4px"
                  >
                    ₱{Number(order.total_cost || order.total || 0).toFixed(2)}
                  </Box>
                </Box>
              </Box>
            ))
          ) : (
            <Box textAlign="center" p={3}>
              <Typography color="text.secondary" gutterBottom>
                No recent orders
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {stats.totalOrders > 0 ? 'Orders exist but could not be displayed' : 'Add orders to see them here'}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* ROW 2 - Order Status Overview */}
      <Box
        gridColumn={`span ${CHART_CONSTANTS.GRID_COLUMN_SPANS.SMALL_CHART}`}
        gridRow="span 2"
        backgroundColor={colors.primary[400]}
        p="30px"
      >
        <Typography variant="h5" fontWeight="600">
          Orders by Status
        </Typography>
        <Box
          display="flex"
          flexDirection="column"
          gap="15px"
          mt="25px"
        >
          {Object.entries(stats.ordersByStatus || {}).map(([status, count]) => (
            <Box
              key={status}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              p="10px"
              backgroundColor={colors.primary[500]}
              borderRadius="4px"
            >
              <OrderStatusChip status={status} />
              <Typography variant="h6" fontWeight="600" color={colors.grey[100]}>
                {count}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ROW 3 - Today's Summary */}
      <Box
        gridColumn={`span ${CHART_CONSTANTS.GRID_COLUMN_SPANS.SMALL_CHART}`}
        gridRow="span 2"
        backgroundColor={colors.primary[400]}
        p="30px"
      >
        <Typography variant="h5" fontWeight="600">
          Today's Summary
        </Typography>
        <Box
          display="flex"
          flexDirection="column"
          gap="20px"
          mt="25px"
        >
          <Box textAlign="center">
            <Typography variant="h3" fontWeight="bold" color={colors.greenAccent[500]}>
              {stats.todayOrders}
            </Typography>
            <Typography variant="body1" color={colors.grey[200]}>
              Orders Today
            </Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h3" fontWeight="bold" color={colors.blueAccent[500]}>
              ₱{Number(stats.todayRevenue).toFixed(2)}
            </Typography>
            <Typography variant="body1" color={colors.grey[200]}>
              Revenue Today
            </Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h4" fontWeight="bold" color={colors.greenAccent[500]}>
              {stats.restaurants}
            </Typography>
            <Typography variant="body1" color={colors.grey[200]}>
              Active Restaurants
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ROW 3 - Quick Stats */}
      <Box
        gridColumn={`span ${CHART_CONSTANTS.GRID_COLUMN_SPANS.SMALL_CHART}`}
        gridRow="span 2"
        backgroundColor={colors.primary[400]}
        p="30px"
      >
        <Typography variant="h5" fontWeight="600">
          Quick Stats
        </Typography>
        <Box
          display="flex"
          flexDirection="column"
          gap="20px"
          mt="25px"
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            p="10px"
            backgroundColor={colors.primary[500]}
            borderRadius="4px"
          >
            <Typography color={colors.grey[200]}>Active Riders</Typography>
            <Typography variant="h6" fontWeight="600" color={colors.greenAccent[400]}>
              {stats.activeRiders}
            </Typography>
          </Box>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            p="10px"
            backgroundColor={colors.primary[500]}
            borderRadius="4px"
          >
            <Typography color={colors.grey[200]}>Total Customers</Typography>
            <Typography variant="h6" fontWeight="600" color={colors.blueAccent[400]}>
              {stats.totalCustomers}
            </Typography>
          </Box>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            p="10px"
            backgroundColor={colors.primary[500]}
            borderRadius="4px"
          >
            <Typography color={colors.grey[200]}>Avg Order Value</Typography>
            <Typography variant="h6" fontWeight="600" color={colors.yellowAccent[400]}>
              ₱{stats.totalOrders > 0 ? (Number(stats.totalRevenue) / stats.totalOrders).toFixed(2) : "0.00"}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ROW 3 - Popular Items */}
      <Box
        gridColumn={`span ${CHART_CONSTANTS.GRID_COLUMN_SPANS.SMALL_CHART}`}
        gridRow="span 2"
        backgroundColor={colors.primary[400]}
        p="30px"
      >
        <Typography variant="h5" fontWeight="600">
          Popular Items
        </Typography>
        <Box
          display="flex"
          flexDirection="column"
          gap="15px"
          mt="25px"
        >
          {stats.popularItems && Array.isArray(stats.popularItems) && stats.popularItems.length > 0 ? (
            stats.popularItems.slice(0, 5).map((item, index) => (
              <Box
                key={index}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                p="10px"
                backgroundColor={colors.primary[500]}
                borderRadius="4px"
              >
                <Box>
                  <Typography variant="body1" fontWeight="600" color={colors.grey[100]}>
                    {item.name}
                  </Typography>
                  <Typography variant="body2" color={colors.grey[300]}>
                    {item.category} • ₱{Number(item.price).toFixed(2)}
                  </Typography>
                </Box>
                <Box textAlign="right">
                  <Typography variant="body1" fontWeight="600" color={colors.greenAccent[400]}>
                    {item.order_count || 0} orders
                  </Typography>
                  <Typography variant="body2" color={colors.yellowAccent[400]}>
                    ★ {item.rating || "N/A"}
                  </Typography>
                </Box>
              </Box>
            ))
          ) : (
            <Typography color="text.secondary" textAlign="center">
              No popular items data
            </Typography>
          )}
        </Box>
      </Box>
    </>
  );
};

// Check if database has data
const hasDatabaseData = (stats) => {
  return (
    stats &&
    (stats.totalOrders > 0 ||
    stats.totalRevenue > 0 ||
    stats.activeRiders > 0 ||
    stats.totalCustomers > 0 ||
    stats.restaurants > 0)
  );
};

// Main Dashboard component
const Dashboard = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch food delivery stats
      const statsData = await fetchFoodDeliveryStats();
      
      // Fetch earnings data (with fallback)
      let earningsData = {
        commissions: { count: 0, total: 0 },
        deliveryFees: { count: 0, total: 0 },
        subscriptions: { count: 0, total: 0 },
        grossEarnings: 0
      };
      
      try {
        const earningsResponse = await fetchAPI('/earnings/today');
        if (earningsResponse) {
          earningsData = {
            commissions: earningsResponse.commissions || { count: 0, total: 0 },
            deliveryFees: earningsResponse.delivery_fees || { count: 0, total: 0 },
            subscriptions: earningsResponse.subscriptions || { count: 0, total: 0 },
            grossEarnings: earningsResponse.grossEarnings || 0
          };
        }
      } catch (earningsErr) {
        console.warn('Could not fetch earnings data:', earningsErr);
      }
      
      // Merge stats with earnings
      setStats({
        ...(statsData || DEFAULT_STATS),
        earnings: earningsData
      });
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Check if we have actual data in the database
  const hasData = hasDatabaseData(stats);

  // Safety check - wait for colors to be defined
  if (!colors || !colors.primary || !colors.greenAccent || !colors.blueAccent || !colors.grey) {
    return <LoadingSpinner />;
  }

  return (
    <Box m="20px">
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header title="FOOD DELIVERY DASHBOARD" subtitle="Welcome to your food delivery management system" />

        <Box>
          <Button
            sx={{
              backgroundColor: colors.blueAccent[700],
              color: colors.grey[100],
              fontSize: "14px",
              fontWeight: "bold",
              padding: "10px 20px",
            }}
          >
            <DownloadOutlinedIcon sx={{ mr: "10px" }} />
            Download Reports
          </Button>
        </Box>
      </Box>

      {/* GRID & CHARTS */}
      <Box
        display="grid"
        gridTemplateColumns="repeat(12, 1fr)"
        gridAutoRows={`${CHART_CONSTANTS.ROW_HEIGHT}px`}
        gap={CHART_CONSTANTS.GAP}
      >
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorDisplay message={error} onRetry={loadData} />
        ) : (
          <DashboardContent 
            stats={stats} 
            colors={colors}
            hasData={hasData}
          />
        )}
      </Box>
    </Box>
  );
};

export default memo(Dashboard);

// Export constants and defaults for reuse
export { CHART_CONSTANTS, DEFAULT_STATS };
