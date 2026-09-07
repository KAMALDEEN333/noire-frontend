// ==========================================
// 1. CONFIGURATION & AUTH
// ==========================================
const API_BASE = '/api';
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

if (!token) {
    window.location.href = 'login.html';
}

// Global state to track what we are currently paying for
let currentTransaction = {
    type: 'order', // 'order' or 'booking'
    productId: null,
    quantity: 1,
    bookingData: null,
    totalAmount: 0
};

// ==========================================
// 2. INIT
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('userEmail').textContent = user.email || 'Customer';
    
    setupNavigation();
    loadProfile();
    fetchProducts();
    fetchMyOrders();
    fetchMyBookings();
    fetchServices(); // Load services into the dropdown
});

function setupNavigation() {
    const tabs = document.querySelectorAll('.tab-btn');
    const sections = document.querySelectorAll('.content-section');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.section;
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            sections.forEach(sec => {
                sec.id === target ? sec.classList.remove('hidden') : sec.classList.add('hidden');
            });
        });
    });
}

// ==========================================
// 3. DATA FETCHING (PRODUCTS & SERVICES)
// ==========================================
async function fetchProducts() {
    const container = document.getElementById('products-list');
    try {
        const res = await fetch(`${API_BASE}/products`);
        const result = await res.json();
        const products = result.data || [];

        if (products.length === 0) {
            container.innerHTML = `<p class="status-msg">No products available today.</p>`;
            return;
        }

        container.innerHTML = products.map(p => `
            <div class="card product-card">
                <img src="${p.image_url || 'https://via.placeholder.com/150'}" alt="${p.name}">
                <h3>${p.name}</h3>
                <p>${p.description || ''}</p>
                <p class="price">₦${p.price}</p>
                <button class="order-btn" onclick="openOrderModal(${p.id})">Order Now</button>
            </div>
        `).join('');
    } catch (err) {
        container.innerHTML = `<p class="error">Error loading products.</p>`;
    }
}

async function fetchServices() {
    const dropdown = document.getElementById('booking-service-dropdown');
    try {
        const res = await fetch(`${API_BASE}/services`);
        const services = await res.json();
        
        // Keep the first default option
        dropdown.innerHTML = '<option value="">-- Choose a Service --</option>';
        
        services.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.id;
            opt.dataset.price = s.price;
            opt.textContent = `${s.name} (₦${s.price})`;
            dropdown.appendChild(opt);
        });
    } catch (err) {
        console.error("Error loading services:", err);
    }
}

// ==========================================
// 4. ORDER LOGIC
// ==========================================
function openOrderModal(id) {
    currentTransaction.productId = id;
    currentTransaction.type = 'order';
    document.getElementById('orderModal').classList.remove('hidden');
}

function closeOrderModal() {
    document.getElementById('orderModal').classList.add('hidden');
}

async function submitOrder() {
    const qty = document.getElementById('orderQty').value;
    if (!qty || qty < 1) return alert("Please enter a valid quantity.");

    try {
        const res = await fetch(`${API_BASE}/products/${currentTransaction.productId}`);
        const product = await res.json();
        
        currentTransaction.quantity = Number(qty);
        currentTransaction.totalAmount = product.price * qty;

        closeOrderModal();
        openPaymentModal(currentTransaction.totalAmount);
    } catch (err) {
        alert("Could not calculate total.");
    }
}

// ==========================================
// 5. BOOKING LOGIC
// ==========================================
function openBookingModal() {
    document.getElementById('bookingModal').classList.remove('hidden');
}

function closeBookingModal() {
    document.getElementById('bookingModal').classList.add('hidden');
}

function submitBooking() {
    const date = document.getElementById('bookingDate').value;
    const loc = document.getElementById('bookingLocation').value;
    const serviceSelect = document.getElementById('booking-service-dropdown');
    const selectedOption = serviceSelect.options[serviceSelect.selectedIndex];

    if (!date || !loc || !selectedOption.value) {
        return alert("Please fill all fields and select a service.");
    }

    currentTransaction.type = 'booking';
    currentTransaction.totalAmount = Number(selectedOption.dataset.price);
    currentTransaction.bookingData = {
        event_date: date,
        location: loc,
        service_ids: [Number(selectedOption.value)], // Array for backend support
        event_time: "12:00:00" 
    };

    closeBookingModal();
    openPaymentModal(currentTransaction.totalAmount);
}

// ==========================================
// 6. PAYMENT SIMULATION & API CALL
// ==========================================
function openPaymentModal(amount) {
    // Reset UI
    document.getElementById('payment-form-content').classList.remove('hidden');
    document.getElementById('payment-processing').classList.add('hidden');
    document.getElementById('payment-footer').classList.remove('hidden');
    document.getElementById('paymentStatusMsg').textContent = "";
    
    document.getElementById('paymentAmount').value = `₦${amount}`;
    document.getElementById('paymentModal').classList.remove('hidden');
}

function closePaymentModal() {
    document.getElementById('paymentModal').classList.add('hidden');
}

async function processPayment() {
    const formContent = document.getElementById('payment-form-content');
    const processingUI = document.getElementById('payment-processing');
    const footer = document.getElementById('payment-footer');
    const statusMsg = document.getElementById('paymentStatusMsg');

    // Validation
    const card = document.getElementById('cardNumber').value;
    if (card.length < 12) {
        return alert("Please enter a valid card number.");
    }

    // 1. UI State: Show Loading
    formContent.classList.add('hidden');
    footer.classList.add('hidden');
    processingUI.classList.remove('hidden');
    statusMsg.innerHTML = "Processing your payment...";

    // 2. Simulate Network Delay (Match your 5s requirement or reduce to 3s for better UX)
    setTimeout(async () => {
        try {
            // Determine endpoint (ensure plural 'orders')
            const endpoint = currentTransaction.type === 'order' ? '/orders' : '/bookings';
            
            // Step A: Create the Order/Booking 
            // Note: address_id is REMOVED so the backend picks the user's saved address
            const res = await fetch(`${API_BASE}${endpoint}`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(
                    currentTransaction.type === 'order' 
                    ? {
                        items: [{ 
                            product_id: currentTransaction.productId, 
                            quantity: currentTransaction.quantity 
                        }]
                        // No address_id here; backend handles it!
                      }
                    : currentTransaction.bookingData
                )
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            // Step B: Update Payment Status to 'successful'
            // Extract the ID returned by the backend
            const transactionId = data.orderId || data.bookingId; 
            
            const payRes = await fetch(`${API_BASE}${endpoint}/${transactionId}/pay`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}` 
                }
            });

            if (!payRes.ok) throw new Error("Transaction created, but payment confirmation failed.");

            // 3. UI State: Success
            processingUI.classList.add('hidden');
            statusMsg.innerHTML = `
                <div style="text-align: center;">
                    <span style="color: green; font-weight: bold; font-size: 1.2rem;">
                        Payment Successful! ✅
                    </span>
                    <p>Redirecting to your dashboard...</p>
                </div>
            `;
            
            // Refresh data and close modal
            setTimeout(() => {
                closePaymentModal();
                if (currentTransaction.type === 'order') fetchMyOrders();
                else fetchMyBookings();
            }, 2000);

        } catch (err) {
            // UI State: Error Recovery
            processingUI.classList.add('hidden');
            formContent.classList.remove('hidden');
            footer.classList.remove('hidden');
            statusMsg.innerHTML = `<span style="color: red; font-weight: bold;">Error: ${err.message}</span>`;
        }
    }, 5000); 
}



// ==========================================
// 7. HISTORY (ORDERS & BOOKINGS)
// ==========================================
async function fetchMyOrders() {
    const container = document.getElementById('orders-list');
    try {
        const res = await fetch(`${API_BASE}/orders/my`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const orders = await res.json();

        if (!orders || orders.length === 0) {
            container.innerHTML = `<p class="status-msg">No orders found.</p>`;
            return;
        }

        container.innerHTML = orders.map(o => {
            const orderDate = new Date(o.created_at).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });

            // If there's more than one item type, show "Product (+X others)"
            const displayName = o.item_count > 1 
                ? `${o.product_name} (+${o.item_count - 1} more)` 
                : (o.product_name || 'Bakery Item');

            return `
                <div class="card">
                    <div class="card-header">
                        <h3>${displayName}</h3>
                        <span class="badge ${o.status}">${o.status}</span>
                    </div>
                    <div class="card-body">
                        <p><strong>Order ID:</strong> #${o.id}</p>
                        <p><strong>Date:</strong> ${orderDate}</p>
                        <p class="price">₦${o.total_price}</p>
                    </div>
                </div>
            `;
        }).join('');
    } catch (err) {
        container.innerHTML = `<p class="error">Failed to load orders.</p>`;
    }
}


async function fetchMyBookings() {
    const container = document.getElementById('bookings-list');
    try {
        // Updated to fetch with service details if your API supports it, 
        // otherwise we show the Booking ID and Date clearly.
        const res = await fetch(`${API_BASE}/bookings/my`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const bookings = await res.json();

        if (!bookings || bookings.length === 0) {
            container.innerHTML = `<p class="status-msg">No active bookings found.</p>`;
            return;
        }

        container.innerHTML = bookings.map(b => {
    const eventDate = new Date(b.event_date).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });

    return `
        <div class="card booking-card">
            <div class="card-header">
                <h3>${b.service_name || 'General Booking'}</h3>
                <span class="badge ${b.status}">${b.status}</span>
            </div>
            <div class="card-body">
                <p><strong>Booking ID:</strong> #${b.id}</p>
                <p><strong>Date:</strong> ${eventDate}</p>
                <p><strong>Location:</strong> ${b.location}</p>
            </div>
        </div>
    `;
}).join('');

    } catch (err) {
        container.innerHTML = `<p class="error">Failed to load bookings history.</p>`;
    }
}

async function updateProfile() {
  const token = localStorage.getItem('token');

  const data = {
    name: document.getElementById('profileName').value,
    phone: document.getElementById('profilePhone').value,
    street: document.getElementById('profileStreet').value,
    city: document.getElementById('profileCity').value,
    state: document.getElementById('profileState').value,
    postal_code: document.getElementById('profilePostalCode').value
  };

  try {
    const res = await fetch('/api/auth/update-profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify(data)
    });

    const result = await res.json();

    const msg = document.getElementById('profileMsg');

    if (res.ok) {
      msg.style.color = 'green';
      msg.textContent = result.message;
    } else {
      msg.style.color = 'red';
      msg.textContent = result.message;
    }

  } catch (error) {
    console.error(error);
  }
}


async function loadProfile() {
  const token = localStorage.getItem('token');

  const res = await fetch('/api/auth/profile', {
    headers: {
      'Authorization': 'Bearer ' + token
    }
  });

  const data = await res.json();

  if (res.ok) {
    document.getElementById('profileName').value = data.name || '';
    document.getElementById('profilePhone').value = data.phone || '';
    document.getElementById('profileStreet').value = data.street || '';
    document.getElementById('profileCity').value = data.city || '';
    document.getElementById('profileState').value = data.state || '';
    document.getElementById('profilePostalCode').value = data.postal_code || '';
  }
}


// ==========================================
// 8. LOGOUT
// ==========================================
function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}

// Attach functions to window for HTML onclick attributes
window.openOrderModal = openOrderModal;
window.closeOrderModal = closeOrderModal;
window.submitOrder = submitOrder;
window.openBookingModal = openBookingModal;
window.closeBookingModal = closeBookingModal;
window.submitBooking = submitBooking;
window.processPayment = processPayment;
window.closePaymentModal = closePaymentModal;
window.logout = logout;
