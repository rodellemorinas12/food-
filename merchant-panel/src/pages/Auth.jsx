import { useState, useEffect } from "react";
import { Box, Typography, Paper, TextField, Button, Grid, Alert, Link, Divider, InputAdornment, IconButton, Chip } from "@mui/material";
import { useTheme } from "@mui/material";
import { tokens } from "../theme";
import { useNavigate } from "react-router-dom";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import BadgeIcon from "@mui/icons-material/Badge";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

import { API_URL } from "../utils/api";
import { getFileUrl } from "../utils/api";

const Auth = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Application status states
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [declineReason, setDeclineReason] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    businessName: "",
    ownerName: "",
    email: "",
    mobileNumber: "",
    password: "",
    confirmPassword: "",
    businessAddress: "",
    businessPermit: null,
    validId: null
  });

  // Check application status on component mount
  useEffect(() => {
    const checkApplicationStatus = async () => {
      const storedEmail = localStorage.getItem("userEmail");
      const storedStatus = localStorage.getItem("merchantStatus");
      
      // If user is already logged in, fetch latest status from server
      if (storedEmail) {
        setStatusLoading(true);
        try {
          const response = await fetch(`${API_URL}/restaurants`);
          if (response.ok) {
            const restaurants = await response.json();
            const merchantRestaurant = restaurants.find(r => r.email === storedEmail);
            if (merchantRestaurant) {
              // Make status lowercase for case-insensitive comparison
              const status = merchantRestaurant.status ? merchantRestaurant.status.toLowerCase() : null;
              setApplicationStatus(status);
              setDeclineReason(merchantRestaurant.decline_reason || merchantRestaurant.declineReason || "");
              // Update localStorage with latest status
              localStorage.setItem("merchantStatus", status || "");


            } else {
              // No merchant restaurant found for email
            }
          } else {
            // Failed to fetch restaurants
          }
        } catch (err) {
          // Silent fail - fallback to stored status if available
          if (storedStatus) {
            setApplicationStatus(storedStatus.toLowerCase());
          }
        }
        setStatusLoading(false);
      }
    };
    
    checkApplicationStatus();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type (PDF/JPG/PNG only)
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setError("Only PDF, JPG, and PNG files are allowed.");
        return;
      }
      setFormData({ ...formData, [fieldName]: file });
      setError("");
    }
  };

  // Validate email format
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (isLogin) {
      // Login - call the API
      if (!formData.email || !formData.password) {
        setError("All fields are required.");
        setLoading(false);
        return;
      }

      if (!isValidEmail(formData.email)) {
        setError("Invalid email format.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password
          })
        });
        
        const data = await response.json();
        
        if (data.status === "1") {
          // Login successful
          localStorage.setItem("isAuthenticated", "true");
          localStorage.setItem("userEmail", formData.email);
          localStorage.setItem("userToken", data.payload.token);
          localStorage.setItem("userName", data.payload.name);
          
          // Check if user registered but hasn't completed application
          const registeredEmail = localStorage.getItem("registeredEmail");
          const hasPendingBusiness = localStorage.getItem("pendingBusinessName");
          const shouldCompleteApplication = registeredEmail === formData.email || hasPendingBusiness;
          
          // Try to get restaurant info
          let hasRestaurant = false;
          let hasDocuments = false;
          try {
            const restaurantResponse = await fetch(`${API_URL}/restaurants`);
            if (restaurantResponse.ok) {
              const restaurants = await restaurantResponse.json();
              const merchantRestaurant = restaurants.find(r => r.email === formData.email);
              if (merchantRestaurant) {
                hasRestaurant = true;
                localStorage.setItem("merchantId", merchantRestaurant.id);
                localStorage.setItem("restaurantName", merchantRestaurant.name);
                localStorage.setItem("merchantStatus", merchantRestaurant.status);
                
                // Save logo URL if exists
                if (merchantRestaurant.logo) {
                  localStorage.setItem("restaurantLogo", getFileUrl(merchantRestaurant.logo));
                }
                
                // Check if documents have been uploaded
                try {
                  const docsResponse = await fetch(`${API_URL}/merchant-documents/merchant/${merchantRestaurant.id}`, {
                    headers: { 'Authorization': `Bearer ${data.payload.token}` }
                  });
                  if (docsResponse.ok) {
                    const documents = await docsResponse.json();
                    hasDocuments = documents && documents.length > 0;
                  }
                } catch (docErr) {
                  // If we can't check documents, assume they need to submit
                  hasDocuments = false;
                }
                
                // Only mark as submitted if documents exist
                if (hasDocuments) {
                  localStorage.setItem("merchantSubmitted", "true");
                } else {
                  // Clear submitted flag - user needs to complete onboarding with documents
                  localStorage.setItem("merchantSubmitted", "false");
                }
                
                // Update application status state (make it lowercase for case-insensitive comparison)
                setApplicationStatus(merchantRestaurant.status ? merchantRestaurant.status.toLowerCase() : null);
                setDeclineReason(merchantRestaurant.decline_reason || merchantRestaurant.declineReason || "");

              }
            }
          } catch (err) {
            // Silent fail
          }
          
          // Clear registered email after login
          localStorage.removeItem("registeredEmail");
          localStorage.removeItem("registeredName");
          
          // Redirect based on application status
          setTimeout(() => {
            if (shouldCompleteApplication || !hasRestaurant || !hasDocuments) {
              // User registered but hasn't completed application - go to onboarding
              navigate("/onboarding");
            }
            window.location.reload();
          }, 500);
        } else {
          setError(data.message || "Login failed. Please try again.");
        }
      } catch (err) {
        setError("Could not connect to server. Please try again.");
      }
      
      setLoading(false);

    } else {
      // Registration with all new fields
      
      // Check all required fields
      if (!formData.businessName || !formData.ownerName || !formData.email || 
          !formData.mobileNumber || !formData.password || !formData.confirmPassword || 
          !formData.businessAddress) {
        setError("All fields are required.");
        setLoading(false);
        return;
      }

      // Validate email format
      if (!isValidEmail(formData.email)) {
        setError("Invalid email format.");
        setLoading(false);
        return;
      }

      // Check password length (minimum 8 characters)
      if (formData.password.length < 8) {
        setError("Password must be at least 8 characters.");
        setLoading(false);
        return;
      }

      // Check password match
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match.");
        setLoading(false);
        return;
      }

      // Note: Document uploads are now done in the onboarding process
      // Removed requirement for business permit and valid ID during signup
      // Restaurant will be created AFTER completing onboarding with documents

      try {
        // Step 1: Register the user only
        const registerResponse = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.ownerName,
            email: formData.email,
            password: formData.password,
            phone: formData.mobileNumber
          })
        });
        
        const registerData = await registerResponse.json();
        
        if (registerData.status === "0") {
          if (registerData.message && registerData.message.includes("already registered")) {
            setError("Email already registered.");
          } else {
            setError(registerData.message || "Registration failed.");
          }
          setLoading(false);
          return;
        }
        
        // Save business info to localStorage for use in onboarding later
        localStorage.setItem("registeredEmail", formData.email);
        localStorage.setItem("registeredName", formData.ownerName);
        localStorage.setItem("pendingBusinessName", formData.businessName);
        localStorage.setItem("pendingBusinessAddress", formData.businessAddress);
        localStorage.setItem("pendingMobileNumber", formData.mobileNumber);
        
        setLoading(false);
        
        setLoading(false);
        
        // Show success message and switch to login
        setSuccess("Registration successful! Please login with your account.");
        
        // Switch to login mode after a short delay
        setTimeout(() => {
          setIsLogin(true);
        }, 2000);
        
      } catch (err) {
        setError("Could not connect to server. Please make sure the backend is running.");
        setLoading(false);
      }
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError("");
    setSuccess("");
    setFormData({
      businessName: "",
      ownerName: "",
      email: "",
      mobileNumber: "",
      password: "",
      confirmPassword: "",
      businessAddress: "",
      businessPermit: null,
      validId: null
    });
  };

  // Render status message based on application status
  const renderStatusMessage = () => {
    if (statusLoading || !applicationStatus) return null;
    
    const status = applicationStatus.toLowerCase();
    
    switch (status) {
      case "pending":
        return (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body1" fontWeight="bold">
              Your application is under review.
            </Typography>
            <Typography variant="body2">
              Please wait for admin approval. This may take 2-3 business days.
            </Typography>
          </Alert>
        );
      case "approved":
        return (
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography variant="body1" fontWeight="bold">
              Your application has been approved!
            </Typography>
            <Typography variant="body2">
              You can now access your merchant dashboard.
            </Typography>
          </Alert>
        );
      case "declined":
        return (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body1" fontWeight="bold">
              Your application was declined by the admin.
            </Typography>
            {declineReason && (
              <Typography variant="body2">
                Reason: {declineReason}
              </Typography>
            )}
            <Typography variant="body2">
              Please try again in 2-3 business days or contact support.
            </Typography>
          </Alert>
        );
      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `linear-gradient(135deg, ${colors.primary[900]} 0%, ${colors.primary[700]} 100%)`,
        p: 2
      }}
    >
      <Paper
        sx={{
          maxWidth: 600,
          width: "100%",
          p: 4,
          borderRadius: "15px",
          backgroundColor: colors.primary[400],
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          maxHeight: "90vh",
          overflowY: "auto"
        }}
      >
        <Box textAlign="center" mb={3}>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 80,
              height: 80,
              borderRadius: "50%",
              backgroundColor: colors.greenAccent[500],
              mb: 2
            }}
          >
            <RestaurantIcon sx={{ fontSize: 40, color: colors.primary[500] }} />
          </Box>
          <Typography variant="h3" color={colors.grey[100]} fontWeight="bold">
            TeresaEats
          </Typography>
          <Typography variant="body1" color={colors.grey[300]}>
            {isLogin ? "Merchant Login" : "Merchant Registration"}
          </Typography>
          {/* Status Badge */}
          {applicationStatus && !statusLoading && (
            <Box mt={2}>
              <Chip 
                label={applicationStatus.toLowerCase() === "pending" ? "⏳ Under Review" : applicationStatus.toLowerCase() === "approved" ? "✅ Approved" : "❌ Declined"}
                color={
                  applicationStatus.toLowerCase() === "pending" ? "warning" : 
                  applicationStatus.toLowerCase() === "approved" ? "success" : 
                  "error"
                }
                variant="filled"
                sx={{ 
                  fontWeight: "bold",
                  fontSize: "14px",
                  py: 2
                }}
              />
            </Box>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {/* Application Status Message */}
        {renderStatusMessage()}

        {/* Debug/Test Button - Remove in production */}
        {process.env.NODE_ENV === "development" && (
          <Box sx={{ mb: 2, p: 1, bgcolor: colors.grey[800], borderRadius: 1 }}>
            <Typography variant="caption" color={colors.grey[400]}>
              Debug: Set Status
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
              <Button 
                size="small" 
                variant="outlined" 
                onClick={() => { setApplicationStatus("pending"); setDeclineReason(""); }}
                sx={{ color: colors.yellowAccent[500], borderColor: colors.yellowAccent[500] }}
              >
                Pending
              </Button>
              <Button 
                size="small" 
                variant="outlined" 
                onClick={() => { setApplicationStatus("approved"); setDeclineReason(""); }}
                sx={{ color: colors.greenAccent[500], borderColor: colors.greenAccent[500] }}
              >
                Approved
              </Button>
              <Button 
                size="small" 
                variant="outlined" 
                onClick={() => { setApplicationStatus("declined"); setDeclineReason("Invalid documents"); }}
                sx={{ color: colors.redAccent[500], borderColor: colors.redAccent[500] }}
              >
                Declined
              </Button>
              <Button 
                size="small" 
                variant="outlined" 
                onClick={() => { setApplicationStatus(null); setDeclineReason(""); }}
                sx={{ color: colors.grey[500], borderColor: colors.grey[500] }}
              >
                Clear
              </Button>
            </Box>
          </Box>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            {!isLogin && (
              <>
                {/* Business Name */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Business Name"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                    required={!isLogin}
                    InputProps={{
                      style: { color: colors.grey[100] },
                      startAdornment: (
                        <InputAdornment position="start">
                          <RestaurantIcon sx={{ color: colors.grey[400] }} />
                        </InputAdornment>
                      )
                    }}
                    InputLabelProps={{ style: { color: colors.grey[300] } }}
                    sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: colors.grey[500] } } }}
                  />
                </Grid>

                {/* Owner Name */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Owner Name"
                    name="ownerName"
                    value={formData.ownerName}
                    onChange={handleChange}
                    required={!isLogin}
                    InputProps={{
                      style: { color: colors.grey[100] },
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon sx={{ color: colors.grey[400] }} />
                        </InputAdornment>
                      )
                    }}
                    InputLabelProps={{ style: { color: colors.grey[300] } }}
                    sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: colors.grey[500] } } }}
                  />
                </Grid>

                {/* Mobile Number */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Mobile Number"
                    name="mobileNumber"
                    value={formData.mobileNumber}
                    onChange={handleChange}
                    required={!isLogin}
                    InputProps={{
                      style: { color: colors.grey[100] },
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon sx={{ color: colors.grey[400] }} />
                        </InputAdornment>
                      )
                    }}
                    InputLabelProps={{ style: { color: colors.grey[300] } }}
                    sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: colors.grey[500] } } }}
                  />
                </Grid>

                {/* Business Address */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Business Address"
                    name="businessAddress"
                    value={formData.businessAddress}
                    onChange={handleChange}
                    required={!isLogin}
                    multiline
                    rows={2}
                    InputProps={{
                      style: { color: colors.grey[100] },
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationOnIcon sx={{ color: colors.grey[400] }} />
                        </InputAdornment>
                      )
                    }}
                    InputLabelProps={{ style: { color: colors.grey[300] } }}
                    sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: colors.grey[500] } } }}
                  />
                </Grid>

                {/* Business Permit Upload - Now done in onboarding */}
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      You will upload your business documents after registration in the application process.
                    </Typography>
                  </Alert>
                </Grid>
              </>
            )}
            
            {/* Email Address */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                InputProps={{
                  style: { color: colors.grey[100] },
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: colors.grey[400] }} />
                    </InputAdornment>
                  )
                }}
                InputLabelProps={{ style: { color: colors.grey[300] } }}
                sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: colors.grey[500] } } }}
              />
            </Grid>
            
            {/* Password */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                required
                InputProps={{
                  style: { color: colors.grey[100] },
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: colors.grey[400] }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOffIcon sx={{ color: colors.grey[400] }} /> : <VisibilityIcon sx={{ color: colors.grey[400] }} />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                InputLabelProps={{ style: { color: colors.grey[300] } }}
                sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: colors.grey[500] } } }}
              />
            </Grid>
            
            {/* Confirm Password */}
            {!isLogin && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Confirm Password"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required={!isLogin}
                  InputProps={{
                    style: { color: colors.grey[100] },
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon sx={{ color: colors.grey[400] }} />
                      </InputAdornment>
                    )
                  }}
                  InputLabelProps={{ style: { color: colors.grey[300] } }}
                  sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: colors.grey[500] } } }}
                />
              </Grid>
            )}
            
            {/* Submit Button */}
            <Grid item xs={12}>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  mt: 1,
                  py: 1.5,
                  backgroundColor: colors.greenAccent[600],
                  '&:hover': { backgroundColor: colors.greenAccent[700] },
                  fontSize: "16px",
                  fontWeight: "bold"
                }}
              >
                {loading ? "Please wait..." : isLogin ? "Login" : "Register"}
              </Button>
            </Grid>
          </Grid>
        </form>

        <Divider sx={{ my: 3, color: colors.grey[400] }}>
          <Typography variant="body2" color={colors.grey[400]}>
            OR
          </Typography>
        </Divider>

        <Box textAlign="center">
          <Typography variant="body2" color={colors.grey[300]}>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <Link
              component="button"
              variant="body2"
              onClick={toggleMode}
              sx={{
                color: colors.greenAccent[400],
                fontWeight: "bold",
                ml: 1,
                textDecoration: "none",
                '&:hover': { textDecoration: "underline" }
              }}
            >
              {isLogin ? "Sign Up" : "Login"}
            </Link>
          </Typography>
        </Box>

        <Box textAlign="center" mt={2}>
          <Link
            href="/"
            sx={{
              color: colors.grey[400],
              textDecoration: "none",
              fontSize: "14px",
              '&:hover': { color: colors.grey[200] }
            }}
          >
            ← Back to Home
          </Link>
        </Box>
      </Paper>
    </Box>
  );
};

export default Auth;
