const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://purple-aliens-build.loca.lt/api'; // Public tunnel URL!
const API_TIMEOUT = 10000; // 10 seconds timeout

// Helper function for API calls with timeout
const fetchAPI = async (url, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP Error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - please try again');
    }
    throw error;
  }
};

// Helper for retry logic (optional)
const fetchWithRetry = async (url, options = {}, retries = 2) => {
  try {
    return await fetchAPI(url, options);
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
};

// ===== TEAMS API =====
export const fetchTeams = async () => fetchAPI(`${API_BASE_URL}/teams`);

export const createTeam = async (data) => {
  if (!data.name || !data.email) {
    throw new Error('Name and email are required');
  }
  return fetchAPI(`${API_BASE_URL}/teams`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const updateTeam = async (id, data) => fetchAPI(`${API_BASE_URL}/teams/${id}`, {
  method: 'PUT',
  body: JSON.stringify(data)
});

export const deleteTeam = async (id) => fetchAPI(`${API_BASE_URL}/teams/${id}`, {
  method: 'DELETE'
});

// ===== CONTACTS API =====
export const fetchContacts = async () => fetchAPI(`${API_BASE_URL}/contacts`);

export const createContact = async (data) => {
  if (!data.name || !data.email) {
    throw new Error('Name and email are required');
  }
  return fetchAPI(`${API_BASE_URL}/contacts`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const updateContact = async (id, data) => fetchAPI(`${API_BASE_URL}/contacts/${id}`, {
  method: 'PUT',
  body: JSON.stringify(data)
});

export const deleteContact = async (id) => fetchAPI(`${API_BASE_URL}/contacts/${id}`, {
  method: 'DELETE'
});

// ===== INVOICES API =====
export const fetchInvoices = async () => fetchAPI(`${API_BASE_URL}/invoices`);

export const createInvoice = async (data) => {
  if (!data.name || !data.cost) {
    throw new Error('Name and cost are required');
  }
  return fetchAPI(`${API_BASE_URL}/invoices`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const updateInvoice = async (id, data) => fetchAPI(`${API_BASE_URL}/invoices/${id}`, {
  method: 'PUT',
  body: JSON.stringify(data)
});

export const deleteInvoice = async (id) => fetchAPI(`${API_BASE_URL}/invoices/${id}`, {
  method: 'DELETE'
});

// ===== CALENDAR API =====
export const fetchCalendarEvents = async () => fetchAPI(`${API_BASE_URL}/calendar`);

export const createCalendarEvent = async (data) => {
  if (!data.title || !data.start) {
    throw new Error('Title and start date are required');
  }
  return fetchAPI(`${API_BASE_URL}/calendar`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const deleteCalendarEvent = async (id) => fetchAPI(`${API_BASE_URL}/calendar/${id}`, {
  method: 'DELETE'
});

// ===== CHART DATA API =====
export const fetchChartData = async (type) => {
  const url = type ? `${API_BASE_URL}/chart-data?type=${type}` : `${API_BASE_URL}/chart-data`;
  return fetchAPI(url);
};

export const createChartData = async (data) => fetchAPI(`${API_BASE_URL}/chart-data`, {
  method: 'POST',
  body: JSON.stringify(data)
});

// ===== GEOGRAPHY API =====
export const fetchGeography = async () => fetchAPI(`${API_BASE_URL}/geography`);

export const createGeography = async (data) => fetchAPI(`${API_BASE_URL}/geography`, {
  method: 'POST',
  body: JSON.stringify(data)
});

// ===== DASHBOARD STATS API =====
export const fetchStats = async () => fetchAPI(`${API_BASE_URL}/stats`);

export const updateStats = async (id, data) => fetchAPI(`${API_BASE_URL}/stats/${id}`, {
  method: 'PUT',
  body: JSON.stringify(data)
});

// ===== TRANSACTIONS API =====
export const fetchTransactions = async () => fetchAPI(`${API_BASE_URL}/transactions`);

export const createTransaction = async (data) => {
  if (!data.txId || !data.user || !data.cost) {
    throw new Error('Transaction ID, user, and cost are required');
  }
  return fetchAPI(`${API_BASE_URL}/transactions`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

// Export helper for external use
export { fetchAPI, fetchWithRetry };

// ===== CUSTOMERS API =====
export const fetchCustomers = async () => fetchAPI(`${API_BASE_URL}/customers`);

export const createCustomer = async (data) => {
  if (!data.name || !data.email) {
    throw new Error('Name and email are required');
  }
  return fetchAPI(`${API_BASE_URL}/customers`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const updateCustomer = async (id, data) => fetchAPI(`${API_BASE_URL}/customers/${id}`, {
  method: 'PUT',
  body: JSON.stringify(data)
});

export const deleteCustomer = async (id) => fetchAPI(`${API_BASE_URL}/customers/${id}`, {
  method: 'DELETE'
});

// ===== RIDERS API =====
export const fetchRiders = async () => fetchAPI(`${API_BASE_URL}/riders`);

export const createRider = async (data) => {
  if (!data.name || !data.email) {
    throw new Error('Name and email are required');
  }
  return fetchAPI(`${API_BASE_URL}/riders`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const updateRider = async (id, data) => fetchAPI(`${API_BASE_URL}/riders/${id}`, {
  method: 'PUT',
  body: JSON.stringify(data)
});

export const deleteRider = async (id) => fetchAPI(`${API_BASE_URL}/riders/${id}`, {
  method: 'DELETE'
});

export const fetchAvailableRiders = async () => fetchAPI(`${API_BASE_URL}/riders/available`);

// ===== ORDERS API =====
export const fetchOrders = async () => fetchAPI(`${API_BASE_URL}/orders`);

export const createOrder = async (data) => {
  if (!data.customer_id || !data.food_items || !data.total_cost || !data.delivery_address) {
    throw new Error('Customer ID, food items, total cost, and delivery address are required');
  }
  return fetchAPI(`${API_BASE_URL}/orders`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const updateOrder = async (id, data) => fetchAPI(`${API_BASE_URL}/orders/${id}`, {
  method: 'PUT',
  body: JSON.stringify(data)
});

export const deleteOrder = async (id) => fetchAPI(`${API_BASE_URL}/orders/${id}`, {
  method: 'DELETE'
});

export const assignRiderToOrder = async (orderId, riderId) => fetchAPI(`${API_BASE_URL}/orders/${orderId}/assign-rider`, {
  method: 'PUT',
  body: JSON.stringify({ rider_id: riderId })
});

// ===== FOOD DELIVERY STATS API =====
export const fetchFoodDeliveryStats = async () => fetchAPI(`${API_BASE_URL}/food-delivery-stats`);

// ===== RESTAURANTS API =====
export const fetchRestaurants = async () => fetchAPI(`${API_BASE_URL}/restaurants`);

export const fetchRestaurant = async (id) => fetchAPI(`${API_BASE_URL}/restaurants/${id}`);

export const createRestaurant = async (data) => {
  if (!data.name || !data.cuisine_type) {
    throw new Error('Name and cuisine type are required');
  }
  return fetchAPI(`${API_BASE_URL}/restaurants`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

// ===== MENU ITEMS API =====
export const fetchMenuItems = async () => fetchAPI(`${API_BASE_URL}/menu-items`);

export const fetchMenuItemsByRestaurant = async (restaurantId) => fetchAPI(`${API_BASE_URL}/menu-items/restaurant/${restaurantId}`);

export const fetchMenuItem = async (id) => fetchAPI(`${API_BASE_URL}/menu-items/${id}`);

export const createMenuItem = async (data) => {
  if (!data.restaurant_id || !data.name || !data.price) {
    throw new Error('Restaurant ID, name, and price are required');
  }
  return fetchAPI(`${API_BASE_URL}/menu-items`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

// ===== USERS API =====
export const fetchUsers = async () => fetchAPI(`${API_BASE_URL}/users`);

export const fetchUser = async (id) => fetchAPI(`${API_BASE_URL}/users/${id}`);

export const createUser = async (data) => {
  if (!data.name || !data.email) {
    throw new Error('Name and email are required');
  }
  return fetchAPI(`${API_BASE_URL}/users`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

// ===== MERCHANTS API =====
export const fetchMerchants = async () => fetchAPI(`${API_BASE_URL}/restaurants`);

export const fetchMerchant = async (id) => fetchAPI(`${API_BASE_URL}/restaurants/${id}`);

export const createMerchant = async (data) => {
  if (!data.name || !data.cuisine_type) {
    throw new Error('Name and cuisine type are required');
  }
  return fetchAPI(`${API_BASE_URL}/restaurants`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const updateMerchant = async (id, data) => fetchAPI(`${API_BASE_URL}/restaurants/${id}`, {
  method: 'PUT',
  body: JSON.stringify(data)
});

export const deleteMerchant = async (id) => fetchAPI(`${API_BASE_URL}/restaurants/${id}`, {
  method: 'DELETE'
});

export const approveMerchant = async (id) => fetchAPI(`${API_BASE_URL}/restaurants/${id}/approve`, {
  method: 'PUT'
});

export const suspendMerchant = async (id) => fetchAPI(`${API_BASE_URL}/restaurants/${id}/suspend`, {
  method: 'PUT'
});

// ===== RESTAURANT APPLICATION API =====
export const fetchRestaurantApplication = async (restaurantId) => fetchAPI(`${API_BASE_URL}/restaurants/${restaurantId}`);

export const updateRestaurantApplication = async (restaurantId, data) => fetchAPI(`${API_BASE_URL}/restaurants/${restaurantId}`, {
  method: 'PUT',
  body: JSON.stringify(data)
});

// ===== MERCHANT DOCUMENTS API =====
export const fetchMerchantDocuments = async (merchantId) => fetchAPI(`${API_BASE_URL}/merchants/${merchantId}/documents`);

export const addMerchantDocument = async (merchantId, data) => {
  if (!data.document_type || !data.document_name || !data.document_url) {
    throw new Error('Document type, name, and URL are required');
  }
  return fetchAPI(`${API_BASE_URL}/merchants/${merchantId}/documents`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const deleteDocument = async (documentId) => fetchAPI(`${API_BASE_URL}/documents/${documentId}`, {
  method: 'DELETE'
});

// ===== COMMISSIONS API =====
export const fetchCommissions = async () => fetchAPI(`${API_BASE_URL}/commissions`);

export const updateCommission = async (id, data) => fetchAPI(`${API_BASE_URL}/commissions/${id}`, {
  method: 'PUT',
  body: JSON.stringify(data)
});

export const createCommission = async (data) => fetchAPI(`${API_BASE_URL}/commissions`, {
  method: 'POST',
  body: JSON.stringify(data)
});

// ===== SUPPORT TICKETS API =====
export const fetchTickets = async () => fetchAPI(`${API_BASE_URL}/tickets`);

export const fetchTicket = async (id) => fetchAPI(`${API_BASE_URL}/tickets/${id}`);

export const createTicket = async (data) => fetchAPI(`${API_BASE_URL}/tickets`, {
  method: 'POST',
  body: JSON.stringify(data)
});

export const updateTicket = async (id, data) => fetchAPI(`${API_BASE_URL}/tickets/${id}`, {
  method: 'PUT',
  body: JSON.stringify(data)
});

export const resolveTicket = async (id) => fetchAPI(`${API_BASE_URL}/tickets/${id}/resolve`, {
  method: 'PUT'
});

// ===== SETTINGS API =====
export const fetchSettings = async () => fetchAPI(`${API_BASE_URL}/settings`);

export const updateSettings = async (data) => fetchAPI(`${API_BASE_URL}/settings`, {
  method: 'PUT',
  body: JSON.stringify(data)
});
