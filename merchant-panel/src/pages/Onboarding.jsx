import { useState, useEffect } from "react";
import { Box, Typography, Paper, TextField, Button, Stepper, Step, StepLabel, Grid, Card, CardContent, Alert, Chip, LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { tokens } from "../theme";
import { useTheme } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import BusinessIcon from "@mui/icons-material/Business";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingIcon from "@mui/icons-material/Pending";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import RefreshIcon from "@mui/icons-material/Refresh";

import { API_URL } from "../utils/api";

const Onboarding = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState("pending"); // pending, approved, declined
  const [isLoading, setIsLoading] = useState(false);
  
  // Reapply eligibility states
  const [canReapply, setCanReapply] = useState(false);
  const [daysLeft, setDaysLeft] = useState(0);
  const [declineReason, setDeclineReason] = useState("");
  
  // Fetch status from backend with reapply eligibility
  const checkStatus = async () => {
    const merchantId = localStorage.getItem("merchantId");
    if (!merchantId) return;
    
    try {
      const token = localStorage.getItem('userToken');
      // Fetch from restaurant endpoint (production-ready)
      const response = await fetch(`${API_URL}/restaurants/${merchantId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      if (response.ok) {
        const data = await response.json();
        const newStatus = (data.status || "pending").toLowerCase();
        
        setApprovalStatus(newStatus);
        setCanReapply(data.can_reapply || false);
        setDaysLeft(data.days_left || 0);
        setDeclineReason(data.decline_reason || data.reason || "");
        
        // Update localStorage
        localStorage.setItem("merchantStatus", newStatus);
        
        // If approved, update registered users
        if (newStatus === "active" || newStatus === "approved") {
          const userEmail = localStorage.getItem("userEmail");
          if (userEmail) {
            try {
              const registeredUsers = JSON.parse(localStorage.getItem("registeredUsers") || "{}");
              if (registeredUsers[userEmail]) {
                registeredUsers[userEmail].merchantStatus = newStatus;
                localStorage.setItem("registeredUsers", JSON.stringify(registeredUsers));
              }
            } catch (e) { /* ignore */ }
          }
        }
        return;
      }
    } catch (error) {
      // Silent fail - using fallback method
    }
    
    // Fallback: Use old polling method
    try {
      const merchantId = localStorage.getItem("merchantId");
      if (!merchantId) return;
      
      const response = await fetch(`${API_URL}/restaurants/${merchantId}`);
      if (response.ok) {
        const data = await response.json();
        const currentStatus = localStorage.getItem("merchantStatus");
        const newStatus = data.status ? data.status.toLowerCase() : null;
        
        if (newStatus && newStatus !== (currentStatus || "").toLowerCase()) {
          localStorage.setItem("merchantStatus", newStatus);
          setApprovalStatus(newStatus);
          setDeclineReason(data.decline_reason || data.reason || "");
        }
      }
    } catch (error) {
      // Silent fail
    }
  };

  // Check if already submitted and poll for status updates
  useEffect(() => {
    const submitted = localStorage.getItem("merchantSubmitted");
    const status = localStorage.getItem("merchantStatus");
    if (submitted === "true") {
      setIsSubmitted(true);
      setApprovalStatus((status || "pending").toLowerCase());
    }
    
    // Initial status check
    checkStatus();
    
    // Poll for status updates every 30 seconds
    const interval = setInterval(() => {
      checkStatus();
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  // Form data
  const [formData, setFormData] = useState({
    // Business Info
    businessName: "",
    businessType: "",
    businessAddress: "",
    businessPhone: "",
    businessEmail: "",
    // Bank Details
    bankName: "",
    accountName: "",
    accountNumber: "",
    branchCode: "",
    // Commission
    commissionRate: 25,
    // Documents
    businessPermit: null,
    birRegistration: null,
    foodSafetyCert: null,
    menuFile: null,
    restaurantLogo: null
  });

  // Pre-fill form data from signup if available
  useEffect(() => {
    const savedBusinessName = localStorage.getItem("pendingBusinessName");
    const savedBusinessAddress = localStorage.getItem("pendingBusinessAddress");
    const savedMobileNumber = localStorage.getItem("pendingMobileNumber");
    const userEmail = localStorage.getItem("userEmail");
    
    if (savedBusinessName || savedBusinessAddress || savedMobileNumber) {
      setFormData(prev => ({
        ...prev,
        businessName: savedBusinessName || prev.businessName,
        businessAddress: savedBusinessAddress || prev.businessAddress,
        businessPhone: savedMobileNumber || prev.businessPhone,
        businessEmail: userEmail || prev.businessEmail
      }));
      
      // Clear the pending data after use
      localStorage.removeItem("pendingBusinessName");
      localStorage.removeItem("pendingBusinessAddress");
      localStorage.removeItem("pendingMobileNumber");
    }
  }, []);

  const steps = ["Business Information", "Bank Details", "Commission Agreement", "Document Upload"];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, [field]: file });
    }
  };

  // Handle reapply action
  const handleReapply = () => {
    setIsSubmitted(false);
    setApprovalStatus("pending");
    localStorage.setItem("merchantSubmitted", "false");
    localStorage.setItem("merchantStatus", "pending");
    // Reset to first step
    setActiveStep(0);
  };

  const handleNext = async () => {
    // Prevent double submission
    if (isSubmitted || isLoading) return;

    // Validate current step before proceeding
    if (activeStep === 0) {
      // Business Information step - validate required fields
      if (!formData.businessName || !formData.businessType || !formData.businessAddress || 
          !formData.businessPhone || !formData.businessEmail) {
        alert("Please fill in all required business information fields.");
        return;
      }
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.businessEmail)) {
        alert("Please enter a valid email address.");
        return;
      }
      // Validate phone number (basic check for digits)
      if (!/^\d{10,15}$/.test(formData.businessPhone.replace(/\D/g, ''))) {
        alert("Please enter a valid phone number.");
        return;
      }
    } else if (activeStep === 1) {
      // Bank Details step
      if (!formData.bankName || !formData.accountName || !formData.accountNumber) {
        alert("Please fill in all required bank details.");
        return;
      }
    } else if (activeStep === 2) {
      // Commission Agreement step
      if (!formData.commissionRate) {
        alert("Please select a commission rate.");
        return;
      }
    } else if (activeStep === 3) {
      // Document Upload step - validate required documents
      if (!formData.businessPermit || !formData.birRegistration) {
        alert("Please upload Business Permit and BIR Registration documents.");
        return;
      }
    }

    if (activeStep === steps.length - 1) {
      // Submit the application
      setIsLoading(true);
      try {
        // First, upload logo as file if exists (optional)
        let logoPath = null;
        if (formData.restaurantLogo) {
          try {
            const logoFormData = new FormData();
            logoFormData.append('logo', formData.restaurantLogo);
            
            const logoResponse = await fetch(`${API_URL}/restaurants/upload-logo`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`
              },
              body: logoFormData
            });
            if (logoResponse.ok) {
              const logoData = await logoResponse.json();
              logoPath = logoData.path;
            }
          } catch (logoErr) {
            console.error('Error uploading logo:', logoErr);
            // Continue without logo - it's optional
          }
        }

        // First, create the restaurant record
        const token = localStorage.getItem("userToken");
        const response = await fetch(`${API_URL}/restaurants`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: formData.businessName,
            cuisine_type: formData.businessType,
            address: formData.businessAddress,
            phone: formData.businessPhone,
            email: formData.businessEmail,
            description: `Bank: ${formData.bankName}, Account: ${formData.accountNumber}, Commission: ${formData.commissionRate}%`,
            status: 'pending', // Set to pending - needs admin approval
            is_open: false,
            logo: logoPath
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          const merchantId = data.id;
          
          // Upload documents to merchant_documents table
          const documentsToUpload = [
            { type: 'business_permit', file: formData.businessPermit, name: 'Business Permit' },
            { type: 'bir_registration', file: formData.birRegistration, name: 'BIR Registration' },
            { type: 'food_safety_cert', file: formData.foodSafetyCert, name: 'Food Safety Certificate' },
            { type: 'menu_file', file: formData.menuFile, name: 'Menu File' }
          ];
          
          // Upload each document
          for (const doc of documentsToUpload) {
            if (doc.file) {
              const docFormData = new FormData();
              docFormData.append('merchant_id', merchantId);
              docFormData.append('document_type', doc.type);
              docFormData.append('document_name', doc.name);
              docFormData.append('document', doc.file);
              
              try {
                await fetch(`${API_URL}/merchant-documents`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${token}`
                  },
                  body: docFormData
                });
              } catch (docError) {
                console.error('Error uploading document:', docError);
              }
            }
          }
          
          // Save to localStorage
          localStorage.setItem("merchantSubmitted", "true");
          localStorage.setItem("merchantStatus", "pending");
          localStorage.setItem("merchantId", merchantId);
          localStorage.setItem("restaurantName", formData.businessName);
          
          // Update registered users with merchant info
          const userEmail = localStorage.getItem("userEmail");
          if (userEmail) {
            try {
              const registeredUsers = JSON.parse(localStorage.getItem("registeredUsers") || "{}");
              if (registeredUsers[userEmail]) {
                registeredUsers[userEmail] = {
                  ...registeredUsers[userEmail],
                  merchantSubmitted: true,
                  merchantStatus: "pending",
                  merchantId: data.id,
                  restaurantName: formData.businessName,
                  restaurantLogo: logoPath
                };
                localStorage.setItem("registeredUsers", JSON.stringify(registeredUsers));
              }
            } catch (e) { /* ignore */ }
          }
          
          // Save logo URL to localStorage
          if (logoPath) {
            localStorage.setItem("restaurantLogo", logoPath);
          }
          
          setIsSubmitted(true);
          setApprovalStatus("pending");
        } else {
          alert("Failed to submit application. Please try again.");
        }
      } catch (error) {
        console.error("Error submitting application:", error);
        // For demo purposes, still save locally even if API fails
        localStorage.setItem("merchantSubmitted", "true");
        localStorage.setItem("merchantStatus", "pending");
        localStorage.setItem("restaurantName", formData.businessName);
        
        // Update registered users with merchant info
        const userEmail = localStorage.getItem("userEmail");
        if (userEmail) {
          try {
            const registeredUsers = JSON.parse(localStorage.getItem("registeredUsers") || "{}");
            if (registeredUsers[userEmail]) {
              registeredUsers[userEmail] = {
                ...registeredUsers[userEmail],
                merchantSubmitted: true,
                merchantStatus: "pending",
                restaurantName: formData.businessName
              };
              localStorage.setItem("registeredUsers", JSON.stringify(registeredUsers));
            }
          } catch (e) { /* ignore */ }
        }
        
        setIsSubmitted(true);
        setApprovalStatus("pending");
      } finally {
        setIsLoading(false);
      }
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
      case "approved": return "success";
      case "suspended":
      case "declined": return "error";
      default: return "warning";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "active":
      case "approved": return "Approved";
      case "suspended":
      case "declined": return "Rejected";
      default: return "Pending Approval";
    }
  };

  // If submitted and pending approval
  if (isSubmitted) {
    return (
      <Box p={3}>
        <Box mb={3}>
          <Typography variant="h2" fontWeight="bold" color={colors.grey[100]}>Merchant Application</Typography>
          <Typography variant="h5" color={colors.greenAccent[400]}>Application Status</Typography>
        </Box>

        <Paper sx={{ p: 4, backgroundColor: colors.primary[400], borderRadius: "10px", textAlign: "center" }}>
          {(approvalStatus === "pending" || !approvalStatus) && (
            <>
              <PendingIcon sx={{ fontSize: 80, color: colors.yellowAccent[500], mb: 2 }} />
              <Typography variant="h4" color={colors.grey[100]} gutterBottom>
                Application Submitted Successfully!
              </Typography>
              <Typography variant="body1" color={colors.grey[300]} mb={3}>
                Your application is now pending admin approval. This typically takes 1-2 business days.
              </Typography>
              <Chip
                label="Pending Approval"
                color="warning"
                size="large"
                sx={{ mb: 3 }}
              />
              <Alert severity="info" sx={{ mt: 2, textAlign: "left" }}>
                <strong>What's Next?</strong>
                <ul style={{ margin: "10px 0", paddingLeft: "20px" }}>
                  <li>Our team will review your business documents</li>
                  <li>Verify your bank details</li>
                  <li>Confirm your commission agreement</li>
                  <li>You'll be notified once approved</li>
                </ul>
              </Alert>
              <Alert severity="warning" sx={{ mt: 2, textAlign: "left" }}>
                <strong>Access Restricted:</strong> Dashboard, Orders, Menu, and Earnings are locked until your account is approved.
              </Alert>
            </>
          )}

          {approvalStatus === "active" && (
            <>
              <CheckCircleIcon sx={{ fontSize: 80, color: colors.greenAccent[500], mb: 2 }} />
              <Typography variant="h4" color={colors.grey[100]} gutterBottom>
                Congratulations! You're Approved!
              </Typography>
              <Typography variant="body1" color={colors.grey[300]} mb={3}>
                Your merchant account has been approved. You can now start receiving orders.
              </Typography>
              <Chip
                label="Approved"
                color="success"
                size="large"
                sx={{ mb: 3 }}
              />
              <Button
                variant="contained"
                color="success"
                size="large"
                onClick={() => {
                  localStorage.setItem("merchantStatus", "active");
                  window.location.href = "/";
                }}
              >
                Go to Dashboard
              </Button>
            </>
          )}

          {(approvalStatus === "suspended" || approvalStatus === "declined") && (
            <>
              <Typography variant="h4" color={colors.redAccent[500]} gutterBottom>
                Application Declined
              </Typography>
              <Typography variant="body1" color={colors.grey[300]} mb={2}>
                Your application has been declined by the admin.
              </Typography>
              {declineReason && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  <Typography variant="body2" fontWeight="bold">Reason:</Typography>
                  <Typography variant="body2">{declineReason}</Typography>
                </Alert>
              )}
              {!canReapply ? (
                <Alert severity="warning" sx={{ mb: 3 }}>
                  <Typography variant="body1">
                    You can re-apply after <strong>{daysLeft || 3}</strong> day(s).
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Please wait for the cooldown period before submitting a new application.
                  </Typography>
                </Alert>
              ) : (
                <Box>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    You are now eligible to re-apply!
                  </Alert>
                  <Button
                    variant="contained"
                    color="warning"
                    size="large"
                    startIcon={<RefreshIcon />}
                    onClick={handleReapply}
                    sx={{ mb: 2 }}
                  >
                    Re-Apply Now
                  </Button>
                </Box>
              )}
              <Chip
                label="Declined"
                color="error"
                size="large"
                sx={{ mt: 2 }}
              />
            </>
          )}
        </Paper>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* HEADER */}
      <Box mb={3}>
        <Typography variant="h2" fontWeight="bold" color={colors.grey[100]}>Merchant Onboarding</Typography>
        <Typography variant="h5" color={colors.greenAccent[400]}>Complete your restaurant registration</Typography>
      </Box>

      {/* STEPPER */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: colors.primary[400], borderRadius: "10px" }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel sx={{ color: colors.grey[100] }}>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* FORM CONTENT */}
      <Paper sx={{ p: 3, backgroundColor: colors.primary[400], borderRadius: "10px" }}>
        {/* STEP 1: Business Information */}
        {activeStep === 0 && (
          <Box>
            <Box display="flex" alignItems="center" mb={3}>
              <BusinessIcon sx={{ fontSize: 30, color: colors.blueAccent[400], mr: 1 }} />
              <Typography variant="h4" color={colors.grey[100]}>Business Information</Typography>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Restaurant/Business Name"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  required
                  InputProps={{ style: { color: colors.grey[100] } }}
                  InputLabelProps={{ style: { color: colors.grey[300] } }}
                  sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: colors.grey[500] } } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Business Type"
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleInputChange}
                  select
                  SelectProps={{ native: true }}
                  InputProps={{ style: { color: colors.grey[100] } }}
                  InputLabelProps={{ style: { color: colors.grey[300] } }}
                  sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: colors.grey[500] } } }}
                >
                  <option value="">Select Type</option>
                  <option value="Restaurant">Restaurant</option>
                  <option value="Fast Food">Fast Food</option>
                  <option value="Cafe">Cafe</option>
                  <option value="Food Stall">Food Stall</option>
                  <option value="Cloud Kitchen">Cloud Kitchen</option>
                </TextField>
              </Grid>
              {/* Logo Upload Section */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3, backgroundColor: colors.primary[500], borderRadius: "10px", textAlign: "center" }}>
                  <Typography variant="h6" color={colors.grey[100]} gutterBottom>Restaurant Logo</Typography>
                  <Typography variant="body2" color={colors.grey[400]} mb={2}>Optional - Upload your business logo</Typography>
                  <Box display="flex" justifyContent="center" alignItems="center" gap={2} flexWrap="wrap">
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<CloudUploadIcon />}
                      sx={{ color: colors.blueAccent[400], borderColor: colors.blueAccent[400] }}
                    >
                      Upload Logo
                      <input type="file" hidden accept="image/*" onChange={(e) => handleFileChange(e, "restaurantLogo")} />
                    </Button>
                    {formData.restaurantLogo && (
                      <Box>
                        <Typography variant="body2" color={colors.greenAccent[400]}>
                          ✓ {formData.restaurantLogo.name}
                        </Typography>
                        <Box mt={1} sx={{ width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${colors.greenAccent[500]}` }}>
                          <img 
                            src={URL.createObjectURL(formData.restaurantLogo)} 
                            alt="Logo Preview" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Business Address"
                  name="businessAddress"
                  value={formData.businessAddress}
                  onChange={handleInputChange}
                  required
                  InputProps={{ style: { color: colors.grey[100] } }}
                  InputLabelProps={{ style: { color: colors.grey[300] } }}
                  sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: colors.grey[500] } } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  name="businessPhone"
                  value={formData.businessPhone}
                  onChange={handleInputChange}
                  required
                  InputProps={{ style: { color: colors.grey[100] } }}
                  InputLabelProps={{ style: { color: colors.grey[300] } }}
                  sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: colors.grey[500] } } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email Address"
                  name="businessEmail"
                  type="email"
                  value={formData.businessEmail}
                  onChange={handleInputChange}
                  required
                  InputProps={{ style: { color: colors.grey[100] } }}
                  InputLabelProps={{ style: { color: colors.grey[300] } }}
                  sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: colors.grey[500] } } }}
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* STEP 2: Bank Details */}
        {activeStep === 1 && (
          <Box>
            <Box display="flex" alignItems="center" mb={3}>
              <AccountBalanceIcon sx={{ fontSize: 30, color: colors.blueAccent[400], mr: 1 }} />
              <Typography variant="h4" color={colors.grey[100]}>Bank Details</Typography>
            </Box>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              Your earnings will be deposited to this bank account. Please ensure all details are correct.
            </Alert>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Bank Name"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleInputChange}
                  required
                  InputProps={{ style: { color: colors.grey[100] } }}
                  InputLabelProps={{ style: { color: colors.grey[300] } }}
                  sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: colors.grey[500] } } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Branch Code"
                  name="branchCode"
                  value={formData.branchCode}
                  onChange={handleInputChange}
                  InputProps={{ style: { color: colors.grey[100] } }}
                  InputLabelProps={{ style: { color: colors.grey[300] } }}
                  sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: colors.grey[500] } } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Account Name"
                  name="accountName"
                  value={formData.accountName}
                  onChange={handleInputChange}
                  required
                  InputProps={{ style: { color: colors.grey[100] } }}
                  InputLabelProps={{ style: { color: colors.grey[300] } }}
                  sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: colors.grey[500] } } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Account Number"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleInputChange}
                  required
                  InputProps={{ style: { color: colors.grey[100] } }}
                  InputLabelProps={{ style: { color: colors.grey[300] } }}
                  sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: colors.grey[500] } } }}
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* STEP 3: Commission Agreement */}
        {activeStep === 2 && (
          <Box>
            <Box display="flex" alignItems="center" mb={3}>
              <CheckCircleIcon sx={{ fontSize: 30, color: colors.blueAccent[400], mr: 1 }} />
              <Typography variant="h4" color={colors.grey[100]}>Commission Agreement</Typography>
            </Box>

            <Paper sx={{ p: 3, backgroundColor: colors.primary[500], borderRadius: "10px", mb: 3 }}>
              <Typography variant="h5" color={colors.grey[100]} gutterBottom>Commission Structure</Typography>
              <Typography variant="body1" color={colors.grey[300]} paragraph>
                TeresaEats charges a commission on every order completed through the platform. 
                This commission covers payment processing, delivery coordination, and platform maintenance.
              </Typography>
              
              <Box my={3}>
                <Typography variant="h6" color={colors.grey[200]} gutterBottom>
                  Select Your Commission Rate
                </Typography>
                <Typography variant="body2" color={colors.grey[400]} mb={2}>
                  Higher commission rates may provide better visibility and lower fees
                </Typography>
                
                <Grid container spacing={2} mb={2}>
                  {[20, 25, 30].map((rate) => (
                    <Grid item xs={4} key={rate}>
                      <Card 
                        sx={{ 
                          cursor: "pointer",
                          backgroundColor: formData.commissionRate === rate ? colors.greenAccent[600] : colors.primary[500],
                          border: formData.commissionRate === rate ? `2px solid ${colors.greenAccent[400]}` : "1px solid",
                          transition: "all 0.3s"
                        }}
                        onClick={() => setFormData({ ...formData, commissionRate: rate })}
                      >
                        <CardContent sx={{ textAlign: "center" }}>
                          <Typography variant="h3" color={colors.grey[100]} fontWeight="bold">
                            {rate}%
                          </Typography>
                          <Typography variant="caption" color={colors.grey[300]}>
                            Commission
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                <Box mt={2}>
                  <Typography variant="body2" color={colors.grey[400]}>
                    Current Selection: <strong>{formData.commissionRate}%</strong> per order
                  </Typography>
                </Box>
              </Box>

              <Alert severity="warning">
                <strong>Important:</strong> Once selected, the commission rate can only be changed after 30 days notice period.
              </Alert>
            </Paper>

            <Paper sx={{ p: 3, backgroundColor: colors.primary[500], borderRadius: "10px" }}>
              <Typography variant="h5" color={colors.grey[100]} gutterBottom>Payout Schedule</Typography>
              <Typography variant="body2" color={colors.grey[300]}>
                • Payouts are processed every <strong>Monday</strong><br/>
                • Minimum payout amount: <strong>₱500.00</strong><br/>
                • Payouts take 1-3 business days to reflect in your account<br/>
                • Earnings are calculated after successful delivery
              </Typography>
            </Paper>
          </Box>
        )}

        {/* STEP 4: Document Upload */}
        {activeStep === 3 && (
          <Box>
            <Box display="flex" alignItems="center" mb={3}>
              <UploadFileIcon sx={{ fontSize: 30, color: colors.blueAccent[400], mr: 1 }} />
              <Typography variant="h4" color={colors.grey[100]}>Document Upload</Typography>
            </Box>

            <Alert severity="info" sx={{ mb: 3 }}>
              Please upload clear photos or scans of the following documents. Maximum file size: 5MB each.
            </Alert>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, backgroundColor: colors.primary[500], borderRadius: "10px", textAlign: "center" }}>
                  <Typography variant="h6" color={colors.grey[100]} gutterBottom>Business Permit</Typography>
                  <Typography variant="body2" color={colors.grey[400]} mb={2}>Required</Typography>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUploadIcon />}
                    sx={{ color: colors.blueAccent[400], borderColor: colors.blueAccent[400] }}
                  >
                    Upload File
                    <input type="file" hidden accept="image/*,.pdf" onChange={(e) => handleFileChange(e, "businessPermit")} />
                  </Button>
                  {formData.businessPermit && (
                    <Typography variant="body2" color={colors.greenAccent[400]} mt={1}>
                      ✓ {formData.businessPermit.name}
                    </Typography>
                  )}
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, backgroundColor: colors.primary[500], borderRadius: "10px", textAlign: "center" }}>
                  <Typography variant="h6" color={colors.grey[100]} gutterBottom>BIR Registration</Typography>
                  <Typography variant="body2" color={colors.grey[400]} mb={2}>Required</Typography>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUploadIcon />}
                    sx={{ color: colors.blueAccent[400], borderColor: colors.blueAccent[400] }}
                  >
                    Upload File
                    <input type="file" hidden accept="image/*,.pdf" onChange={(e) => handleFileChange(e, "birRegistration")} />
                  </Button>
                  {formData.birRegistration && (
                    <Typography variant="body2" color={colors.greenAccent[400]} mt={1}>
                      ✓ {formData.birRegistration.name}
                    </Typography>
                  )}
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, backgroundColor: colors.primary[500], borderRadius: "10px", textAlign: "center" }}>
                  <Typography variant="h6" color={colors.grey[100]} gutterBottom>Food Safety Certificate</Typography>
                  <Typography variant="body2" color={colors.grey[400]} mb={2}>Required</Typography>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUploadIcon />}
                    sx={{ color: colors.blueAccent[400], borderColor: colors.blueAccent[400] }}
                  >
                    Upload File
                    <input type="file" hidden accept="image/*,.pdf" onChange={(e) => handleFileChange(e, "foodSafetyCert")} />
                  </Button>
                  {formData.foodSafetyCert && (
                    <Typography variant="body2" color={colors.greenAccent[400]} mt={1}>
                      ✓ {formData.foodSafetyCert.name}
                    </Typography>
                  )}
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, backgroundColor: colors.primary[500], borderRadius: "10px", textAlign: "center" }}>
                  <Typography variant="h6" color={colors.grey[100]} gutterBottom>Menu File</Typography>
                  <Typography variant="body2" color={colors.grey[400]} mb={2}>Optional (or add later)</Typography>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUploadIcon />}
                    sx={{ color: colors.blueAccent[400], borderColor: colors.blueAccent[400] }}
                  >
                    Upload File
                    <input type="file" hidden accept="image/*,.pdf,.xlsx,.xls" onChange={(e) => handleFileChange(e, "menuFile")} />
                  </Button>
                  {formData.menuFile && (
                    <Typography variant="body2" color={colors.greenAccent[400]} mt={1}>
                      ✓ {formData.menuFile.name}
                    </Typography>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* NAVIGATION BUTTONS */}
        <Box display="flex" justifyContent="space-between" mt={4}>
          <Button
            variant="outlined"
            onClick={handleBack}
            disabled={activeStep === 0 || isLoading}
            sx={{ color: colors.grey[300], borderColor: colors.grey[500] }}
          >
            Back
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={isLoading}
            sx={{ backgroundColor: colors.greenAccent[600], minWidth: 160 }}
          >
            {isLoading ? "Submitting..." : activeStep === steps.length - 1 ? "Submit Application" : "Next"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default Onboarding;
