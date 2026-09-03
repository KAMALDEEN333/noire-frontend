// ==========================
// AUTH SETUP
// ==========================
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

if (!token || user.role !== 'admin') {
    window.location.href = 'login.html';
}

// ==========================
// API BASE
// ==========================
const API = '/api';

// ==========================
// STATE
// ==========================
let allOrders = [];
let allBookings = [];

// ==========================
// INIT
// ==========================
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('profileEmailDisplay').textContent = user.email;

    setupNavigation();

    fetchStats();
    fetchProducts();
    fetchOrders();
    fetchBookings();
    fetchServices();
});


// ======================================================
// NAVIGATION
// ======================================================
function setupNavigation() {
    const buttons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.content-section');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {

            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const target = btn.dataset.content;

            sections.forEach(sec => sec.classList.add('hidden'));
            document.getElementById(target).classList.remove('hidden');
        });
    });
}


// ======================================================
// LOGOUT
// ======================================================
function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}


// ======================================================
// MODALS
// ======================================================
function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
}


// ======================================================
// PRODUCT MODAL
// ======================================================
function openProductModal(product = null) {
    const modal = document.getElementById('productModal');
    const form = document.getElementById('productForm');

    form.reset();

    if (product) {
        document.getElementById('productId').value = product.id;
        document.getElementById('productName').value = product.name;
        document.getElementById('productDescription').value = product.description;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productCategory').value = product.category;
    } else {
        document.getElementById('productId').value = '';
    }

    modal.classList.remove('hidden');
}


// ======================================================
// DASHBOARD STATS
// ======================================================
async function fetchStats() {
    try {
        const res = await fetch(`${API}/stats`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();
        if (!res.ok) return;

        document.getElementById('stat-users').textContent = data.summary.totalUsers;
        document.getElementById('stat-orders').textContent = data.summary.totalOrders;
        document.getElementById('stat-bookings').textContent = data.summary.totalBookings;
        document.getElementById('stat-revenue').textContent = `₦${data.summary.totalRevenue}`;

        document.getElementById('recent-orders').innerHTML =
            data.recent.orders.map(o => `
                <div class="mini-card">
                    #${o.id} - ₦${o.total_price} (${o.status})
                </div>
            `).join('');

        document.getElementById('recent-bookings').innerHTML =
            data.recent.bookings.map(b => `
                <div class="mini-card">
                    ${ new Date(b.event_date).toLocaleDateString('en-GB')} (${b.status})
                </div>
            `).join('');

    } catch (err) {
        console.error(err);
    }
}


// ======================================================
// PRODUCTS
// ======================================================
async function fetchProducts() {
    const container = document.getElementById('products-list-area');
    container.innerHTML = "Loading products...";

    const res = await fetch(`${API}/products`);
    const response = await res.json();

    if (!res.ok) {
        container.innerHTML = "Failed to load products";
        return;
    }

    const products = response.data || response;

    container.innerHTML = products.map(product => `
        <div class="card">
            <img src="${product.image_url || ''}" alt="">
            <h3>${product.name}</h3>
            <p>₦${product.price}</p>

            <button onclick='openProductModal(${JSON.stringify(product)})'>Edit</button>
            <button onclick='deleteProduct(${product.id})'>Delete</button>
        </div>
    `).join('');
}


// CREATE / UPDATE PRODUCT
document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('productId').value;
    const formData = new FormData();

    formData.append('name', document.getElementById('productName').value);
    formData.append('description', document.getElementById('productDescription').value);
    formData.append('price', document.getElementById('productPrice').value);
    formData.append('category', document.getElementById('productCategory').value);

    const image = document.getElementById('productImage').files[0];
    if (image) formData.append('image', image);

    const url = id ? `${API}/products/${id}` : `${API}/products`;
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(url, {
        method,
        headers: {
            Authorization: `Bearer ${token}`
        },
        body: formData
    });

    const data = await res.json();

    if (res.ok) {
        alert(data.message);
        closeModal('productModal');
        fetchProducts();
    } else {
        alert(data.message || 'Error');
    }
});


// DELETE PRODUCT
async function deleteProduct(id) {
    if (!confirm("Disable this product?")) return;

    const res = await fetch(`${API}/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();

    alert(data.message);
    fetchProducts();
}
// ======================================================
// FETCH ORDERS (ADMIN)
// ======================================================
async function fetchOrders() {
    const container = document.getElementById('orders-list-area');
    container.innerHTML = "<p class='status-msg'>Loading orders...</p>";

    try {
        const res = await fetch(`${API}/orders`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();

        if (!res.ok) {
            container.innerHTML = `<p class='error'>Error: ${data.message}</p>`;
            return;
        }

        allOrders = data; // Store globally for the filterOrders() function
        renderOrders("all");
    } catch (err) {
        console.error(err);
        container.innerHTML = "<p class='error'>Failed to connect to server.</p>";
    }
}

// ======================================================
// RENDER ORDERS
// ======================================================
function renderOrders(filter) {
    const container = document.getElementById('orders-list-area');

    let filtered = allOrders;
    if (filter !== "all") {
        filtered = allOrders.filter(o => o.status === filter);
    }

    if (!filtered.length) {
        container.innerHTML = "<p class='status-msg'>No orders found.</p>";
        return;
    }

    container.innerHTML = filtered.map(order => {
        const orderDate = new Date(order.created_at).toLocaleDateString('en-GB');
        
        return `
        <div class="card order-card">
            <div class="card-header">
                <h3>Order #${order.id}</h3>
                <span class="badge ${order.status}">${order.status}</span>
            </div>
            
            <div class="card-body">
                <p><strong>Customer:</strong> ${order.name || 'N/A'}</p>
                <p><strong>Phone:</strong> ${order.phone || 'N/A'}</p>
                <p><strong>Total:</strong> ₦${order.total_price}</p>
                <p><strong>Payment:</strong> <span class="status-${order.payment_status}">${order.payment_status}</span></p>
                <p><strong>Date:</strong> ${orderDate}</p>
            </div>

            <div class="card-actions">
                <div class="update-group">
                    <label>Status:</label>
                    <select onchange="updateOrderStatus(${order.id}, this.value)">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                        <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </div>
                
                <button class="print-btn" onclick="printOrder(${order.id})">
                    Print Order
                </button>
            </div>
        </div>
        `;
    }).join('');
}



// FILTER ORDERS
function filterOrders() {
    const value = document.getElementById('orderFilter').value;
    renderOrders(value);
}



// UPDATE ORDER
async function updateOrderStatus(id, status) {
    const res = await fetch(`${API}/orders/${id}/status`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
    });

    const data = await res.json();

    if (res.ok) {
        alert("Order updated");
        fetchOrders();
    } else {
        alert(data.message);
    }
}
async function fetchBookings() {
    const container = document.getElementById('bookings-list-area');
    container.innerHTML = "Loading bookings...";

    const res = await fetch(`${API}/bookings`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();

    if (!res.ok) {
        container.innerHTML = "Failed to load bookings";
        return;
    }

    allBookings = data;
    renderBookings();
}


// RENDER BOOKINGS
function renderBookings() {
    const container = document.getElementById('bookings-list-area');

    if (!allBookings.length) {
        container.innerHTML = "<p>No bookings found</p>";
        return;
    }

    container.innerHTML = allBookings.map(b => {

        const isFinal = b.status === "approved" || b.status === "rejected";
        const ev_date = new Date(b.event_date).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });

        return `
        <div class="card">
            <h3>Booking #${b.id}</h3>
            <p>Date: ${ev_date}</p>
            <p>Location: ${b.location}</p>
            <p>Status: ${b.status}</p>

            <button onclick="updateBooking(${b.id}, 'approved')" ${isFinal ? "disabled" : ""}>
                Approve
            </button>

            <button onclick="updateBooking(${b.id}, 'rejected')" ${isFinal ? "disabled" : ""}>
                Reject
            </button>
        </div>
        `;
    }).join('');
}


// UPDATE BOOKING
async function updateBooking(id, status) {
    const res = await fetch(`${API}/bookings/${id}/status`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
    });

    const data = await res.json();

    alert(data.message);
    fetchBookings();
}
async function fetchServices() {
    const container = document.getElementById('services-list-area');
    container.innerHTML = "Loading services...";

    const res = await fetch(`${API}/services`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();

    if (!res.ok) {
        container.innerHTML = "Failed to load services";
        return;
    }

    container.innerHTML = data.map(s => `
        <div class="card">
            <h3>${s.name}</h3>
            <p>${s.description || ''}</p>
            <p>₦${s.price || 0}</p>

            <button onclick='openServiceModal(${JSON.stringify(s)})'>Edit</button>
            <button onclick='deleteService(${s.id})'>Disable</button>
        </div>
    `).join('');
}
function openServiceModal(service = null) {
    const modal = document.getElementById('serviceModal');
    const form = document.getElementById('serviceForm');

    form.reset();

    if (service) {
        document.getElementById('serviceId').value = service.id;
        document.getElementById('serviceName').value = service.name;
        document.getElementById('serviceDescription').value = service.description;
        document.getElementById('servicePrice').value = service.price;
    } else {
        document.getElementById('serviceId').value = '';
    }

    modal.classList.remove('hidden');
}
document.getElementById('serviceForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('serviceId').value;

    const payload = {
        name: document.getElementById('serviceName').value,
        description: document.getElementById('serviceDescription').value,
        price: document.getElementById('servicePrice').value
    };

    const url = id ? `${API}/services/${id}` : `${API}/services`;
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (res.ok) {
        alert(data.message);
        closeModal('serviceModal');
        fetchServices();
    } else {
        alert(data.message || 'Error');
    }
});


async function printOrder(orderId) {
    // 1. Open the window immediately to bypass popup blockers
    const printWindow = window.open('', '_blank');
    printWindow.document.write('<html><body style="font-family:sans-serif; display:flex; justify-content:center; align-items:center; height:100vh;"><p>Generating Manifest...</p></body></html>');

    try {
        // Fetch full manifest details
        const res = await fetch(`${API}/orders/admin/delivery-manifest/${orderId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to fetch manifest data");

        const { delivery_details: det, items } = data;

        // Generate the Table Rows for items
        const tableRows = items.map(i => `
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #eee;">${i.product_name}</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${i.quantity}</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₦${Number(i.price_at_purchase).toLocaleString()}</td>
            </tr>
        `).join('');

        // 2. Overwrite with full styled content
        printWindow.document.open();
        printWindow.document.write(`
            <html>
            <head>
                <title>Delivery Manifest - #${det.order_id}</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; padding: 20px; line-height: 1.6; }
                    .invoice-box { max-width: 800px; margin: auto; border: 1px solid #eee; padding: 40px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.05); }
                    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #f8f8f8; padding-bottom: 20px; margin-bottom: 20px; }
                    .header h1 { margin: 0; color: #2c3e50; font-size: 24px; }
                    .address-section { text-align: right; }
                    .address-section h3 { margin: 0 0 10px 0; color: #2c3e50; font-size: 16px; text-transform: uppercase; }
                    .address-section p { margin: 2px 0; font-size: 14px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 30px; }
                    th { background: #fdfdfd; color: #777; text-transform: uppercase; font-size: 12px; padding: 12px; border-bottom: 2px solid #eee; text-align: left; }
                    .total-section { margin-top: 30px; padding-top: 20px; border-top: 2px solid #f8f8f8; text-align: right; }
                    .total-amount { font-size: 22px; font-weight: bold; color: #2c3e50; }
                    @media print { body { padding: 0; } .invoice-box { border: none; box-shadow: none; } }
                </style>
            </head>
            <body>
                <div class="invoice-box">
                    <div class="header">
                        <div>
                            <h1>BAKERY CO.</h1>
                            <p style="color: #777;">Order Reference: <strong>#${det.order_id}</strong></p>
                            <p style="color: #777;">Order Date: ${new Date(det.created_at).toLocaleDateString('en-GB')}</p>
                        </div>
                        <div class="address-section">
                            <h3>Delivery Details</h3>
                            <p><strong>${det.customer_name}</strong></p>
                            <p>${det.customer_phone}</p>
                            <p>${det.street || 'No Street Address'}</p>
                            <p>${det.city || ''}, ${det.state || ''}</p>
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th style="text-align: left;">Product Item</th>
                                <th style="text-align: center;">Quantity</th>
                                <th style="text-align: right;">Unit Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>

                    <div class="total-section">
                        <p style="margin: 0; color: #777; text-transform: uppercase; font-size: 12px;">Total Paid</p>
                        <span class="total-amount">₦${Number(det.total_price).toLocaleString()}</span>
                    </div>
                    
                    <div style="margin-top: 50px; text-align: center; color: #bbb; font-size: 12px;">
                        <p>Thank you for choosing Bakery Co.!</p>
                    </div>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();

        // 3. Trigger Printer
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
        }, 500);

    } catch (err) {
        if (printWindow) printWindow.close();
        alert("Print Error: " + err.message);
    }
}



// Don't forget to expose the function to the window
window.printOrder = printOrder;




async function deleteService(id) {
    if (!confirm("Disable this service?")) return;

    const res = await fetch(`${API}/services/${id}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const data = await res.json();

    alert(data.message);
    fetchServices();
}