import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Typography, IconButton, Chip, CircularProgress, useTheme, Grid, Card, CardContent, Tabs, Tab } from "@mui/material";
import { tokens } from "../../theme";
import { useState, useEffect, useCallback } from "react";
import { fetchTickets, updateTicket, resolveTicket } from "../../api";
import Header from "../../components/Header";
import ReplyIcon from "@mui/icons-material/Reply";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import WarningIcon from "@mui/icons-material/Warning";
import ChatIcon from "@mui/icons-material/Chat";
import RefreshIcon from "@mui/icons-material/Refresh";

const TICKET_STATUS_COLORS = {
  open: "warning",
  in_progress: "info",
  resolved: "success",
  closed: "default"
};

const TICKET_TYPE_COLORS = {
  refund: "error",
  dispute: "warning",
  general: "info",
  technical: "secondary"
};

const Support = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [activeTab, setActiveTab] = useState(0);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTickets();
      setTickets(data || []);
    } catch (error) {
      console.error("Error loading tickets:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in_progress');
  const resolvedTickets = tickets.filter(t => t.status === 'resolved' || t.status === 'closed');

  const handleOpenReply = (ticket) => {
    setSelectedTicket(ticket);
    setReplyText(ticket.admin_reply || "");
    setReplyDialogOpen(true);
  };

  const handleCloseReply = () => {
    setReplyDialogOpen(false);
    setSelectedTicket(null);
    setReplyText("");
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;
    
    try {
      await updateTicket(selectedTicket.id, {
        ...selectedTicket,
        admin_reply: replyText,
        status: 'in_progress'
      });
      handleCloseReply();
      loadData();
    } catch (error) {
      console.error("Error sending reply:", error);
    }
  };

  const handleResolve = async (ticket) => {
    if (!window.confirm("Mark this ticket as resolved?")) return;
    
    try {
      await resolveTicket(ticket.id);
      loadData();
    } catch (error) {
      console.error("Error resolving ticket:", error);
    }
  };

  const handleRefund = async (ticket) => {
    if (!window.confirm("Process refund for this ticket?")) return;
    
    try {
      await updateTicket(ticket.id, {
        ...ticket,
        status: 'resolved',
        admin_reply: "Refund has been processed.",
        refund_processed: true
      });
      loadData();
    } catch (error) {
      console.error("Error processing refund:", error);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress color="secondary" size={60} />
      </Box>
    );
  }

  const displayedTickets = activeTab === 0 ? openTickets : resolvedTickets;

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb="20px">
        <Header 
          title="SUPPORT TICKETS" 
          subtitle="Manage customer support and disputes" 
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

      {/* Stats Cards */}
      <Box display="flex" gap="20px" mb="20px">
        <Box flex={1} p="20px" backgroundColor={colors.primary[400]} borderRadius="8px">
          <Typography variant="h3" color={colors.yellowAccent[400]}>
            {openTickets.length}
          </Typography>
          <Typography variant="body2">Open Tickets</Typography>
        </Box>
        <Box flex={1} p="20px" backgroundColor={colors.primary[400]} borderRadius="8px">
          <Typography variant="h3" color={colors.redAccent[400]}>
            {tickets.filter(t => t.type === 'refund').length}
          </Typography>
          <Typography variant="body2">Refund Requests</Typography>
        </Box>
        <Box flex={1} p="20px" backgroundColor={colors.primary[400]} borderRadius="8px">
          <Typography variant="h3" color={colors.yellowAccent[400]}>
            {tickets.filter(t => t.type === 'dispute').length}
          </Typography>
          <Typography variant="body2">Disputes</Typography>
        </Box>
        <Box flex={1} p="20px" backgroundColor={colors.primary[400]} borderRadius="8px">
          <Typography variant="h3" color={colors.greenAccent[400]}>
            {resolvedTickets.length}
          </Typography>
          <Typography variant="body2">Resolved</Typography>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab label={`Open (${openTickets.length})`} />
          <Tab label={`Resolved (${resolvedTickets.length})`} />
        </Tabs>
      </Box>

      {/* Tickets List */}
      <Box backgroundColor={colors.primary[400]} borderRadius="8px" p="20px">
        {displayedTickets.length === 0 ? (
          <Typography textAlign="center" py="40px" color="text.secondary">
            No {activeTab === 0 ? 'open' : 'resolved'} tickets
          </Typography>
        ) : (
          <Box>
            {displayedTickets.map((ticket) => (
              <Box
                key={ticket.id}
                backgroundColor={colors.primary[500]}
                borderRadius="8px"
                p="15px"
                mb="10px"
              >
                <Box display="flex" justifyContent="space-between" alignItems="start" mb="10px">
                  <Box>
                    <Box display="flex" alignItems="center" gap="10px" mb="5px">
                      <Typography variant="h6" fontWeight="600">
                        {ticket.subject || `Ticket #${ticket.id}`}
                      </Typography>
                      <Chip 
                        label={ticket.type} 
                        color={TICKET_TYPE_COLORS[ticket.type] || "default"} 
                        size="small" 
                      />
                      <Chip 
                        label={ticket.status} 
                        color={TICKET_STATUS_COLORS[ticket.status] || "default"} 
                        size="small" 
                        variant="outlined"
                      />
                    </Box>
                    <Typography variant="body2" color={colors.grey[300]}>
                      <strong>From:</strong> {ticket.user_name || ticket.user_email || 'Unknown'} 
                      {ticket.order_id && <span> • <strong>Order:</strong> #{ticket.order_id}</span>}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color={colors.grey[400]}>
                    {ticket.created_at ? new Date(ticket.created_at).toLocaleString() : 'Unknown date'}
                  </Typography>
                </Box>

                <Box backgroundColor={colors.primary[600]} borderRadius="4px" p="10px" mb="10px">
                  <Typography variant="body2" color={colors.grey[200]}>
                    {ticket.message || ticket.description || 'No message'}
                  </Typography>
                </Box>

                {ticket.admin_reply && (
                  <Box backgroundColor={colors.blueAccent[900]} borderRadius="4px" p="10px" mb="10px">
                    <Typography variant="body2" color={colors.blueAccent[200]}>
                      <strong>Admin Reply:</strong> {ticket.admin_reply}
                    </Typography>
                  </Box>
                )}

                <Box display="flex" gap="10px" flexWrap="wrap">
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<ReplyIcon />}
                    onClick={() => handleOpenReply(ticket)}
                  >
                    Reply
                  </Button>
                  
                  {ticket.type === 'refund' && ticket.status !== 'resolved' && (
                    <Button
                      variant="outlined"
                      color="success"
                      size="small"
                      onClick={() => handleRefund(ticket)}
                    >
                      Process Refund
                    </Button>
                  )}
                  
                  {ticket.status !== 'resolved' && (
                    <Button
                      variant="outlined"
                      color="info"
                      size="small"
                      startIcon={<CheckCircleIcon />}
                      onClick={() => handleResolve(ticket)}
                    >
                      Mark Resolved
                    </Button>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onClose={handleCloseReply} maxWidth="sm" fullWidth>
        <DialogTitle>
          Reply to Ticket #{selectedTicket?.id}
        </DialogTitle>
        <DialogContent>
          <Box mb="15px">
            <Typography variant="body2" color="text.secondary" mb="5px">
              <strong>Original Message:</strong>
            </Typography>
            <Box backgroundColor={colors.primary[600]} p="10px" borderRadius="4px">
              <Typography variant="body2">
                {selectedTicket?.message || selectedTicket?.description}
              </Typography>
            </Box>
          </Box>
          <TextField
            label="Your Reply"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            fullWidth
            multiline
            rows={4}
            placeholder="Type your response to the customer..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReply}>Cancel</Button>
          <Button variant="contained" onClick={handleSendReply}>
            Send Reply
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Support;
