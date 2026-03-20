/**
 * CashFlow Tracker - Personal Finance Manager
 * A complete client-side web application for tracking income and expenses
 */

// ============================================
// DATA MANAGEMENT
// ============================================

/**
 * Transaction data store
 */
let transactions = [];

/**
 * Load transactions from localStorage
 */
function loadTransactions() {
    const stored = localStorage.getItem('cashflow_transactions');
    if (stored) {
        try {
            transactions = JSON.parse(stored);
        } catch (e) {
            console.error('Error loading transactions:', e);
            transactions = [];
        }
    }
}

/**
 * Save transactions to localStorage
 */
function saveTransactions() {
    localStorage.setItem('cashflow_transactions', JSON.stringify(transactions));
}

/**
 * Generate unique ID for each transaction
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Add new transaction
 */
function addTransaction(transaction) {
    transaction.id = generateId();
    transaction.createdAt = new Date().toISOString();
    transactions.unshift(transaction);
    saveTransactions();
    updateDashboard();
    updateTransactionsList();
    updateSummary();
    return transaction;
}

/**
 * Update existing transaction
 */
function updateTransaction(id, updatedData) {
    const index = transactions.findIndex(t => t.id === id);
    if (index !== -1) {
        transactions[index] = { ...transactions[index], ...updatedData };
        saveTransactions();
        updateDashboard();
        updateTransactionsList();
        updateSummary();
        return transactions[index];
    }
    return null;
}

/**
 * Delete transaction
 */
function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    saveTransactions();
    updateDashboard();
    updateTransactionsList();
    updateSummary();
}

/**
 * Get filtered transactions
 */
function getFilteredTransactions(filters = {}) {
    let filtered = [...transactions];
    
    // Filter by type
    if (filters.type && filters.type !== 'all') {
        filtered = filtered.filter(t => t.type === filters.type);
    }
    
    // Filter by category
    if (filters.category && filters.category !== 'all') {
        filtered = filtered.filter(t => t.category === filters.category);
    }
    
    // Filter by time
    if (filters.time && filters.time !== 'all') {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch (filters.time) {
            case 'today':
                filtered = filtered.filter(t => {
                    const transDate = new Date(t.date);
                    return transDate >= today;
                });
                break;
            case 'week':
                const weekStart = new Date(today);
                weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                filtered = filtered.filter(t => {
                    const transDate = new Date(t.date);
                    return transDate >= weekStart;
                });
                break;
            case 'month':
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                filtered = filtered.filter(t => {
                    const transDate = new Date(t.date);
                    return transDate >= monthStart;
                });
                break;
        }
    }
    
    return filtered;
}

// ============================================
// UI UPDATES
// ============================================

/**
 * Format currency
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

/**
 * Format date for display
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Update dashboard statistics
 */
function updateDashboard() {
    // Calculate totals
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const balance = totalIncome - totalExpenses;
    
    // Update DOM
    document.getElementById('totalBalance').textContent = formatCurrency(balance);
    document.getElementById('totalIncome').textContent = formatCurrency(totalIncome);
    document.getElementById('totalExpenses').textContent = formatCurrency(totalExpenses);
    
    // Update balance color
    const balanceEl = document.getElementById('totalBalance');
    balanceEl.classList.remove('positive', 'negative');
    if (balance > 0) {
        balanceEl.classList.add('positive');
    } else if (balance < 0) {
        balanceEl.classList.add('negative');
    }
    
    // Update transaction count
    document.getElementById('transactionCount').textContent = 
        `${transactions.length} transaction${transactions.length !== 1 ? 's' : ''}`;
    
    // Update recent transactions
    updateRecentTransactions();
}

/**
 * Update recent transactions on dashboard
 */
function updateRecentTransactions() {
    const container = document.getElementById('recentTransactions');
    const recent = transactions.slice(0, 5);
    
    if (recent.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-receipt"></i>
                <p>No transactions yet. Add your first transaction!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = recent.map(t => createTransactionHTML(t)).join('');
}

/**
 * Create transaction HTML element
 */
function createTransactionHTML(transaction) {
    const isIncome = transaction.type === 'income';
    const categoryIcons = {
        'Food': '🍔',
        'Travel': '✈️',
        'Shopping': '🛍️',
        'Bills': '📄',
        'Entertainment': '🎬',
        'Health': '🏥',
        'Education': '📚',
        'Transport': '🚗',
        'Other Expense': '📦',
        'Salary': '💼',
        'Freelance': '💻',
        'Investment': '📈',
        'Gift': '🎁',
        'Other Income': '💰'
    };
    
    return `
        <div class="transaction-item ${transaction.type}">
            <div class="transaction-info">
                <h4>${categoryIcons[transaction.category] || '💵'} ${transaction.category}</h4>
                <div class="meta">
                    <span class="badge-${transaction.type}">${transaction.type}</span>
                    <span class="ms-2">${formatDate(transaction.date)}</span>
                    ${transaction.note ? `<span class="ms-2">• ${transaction.note}</span>` : ''}
                </div>
            </div>
            <div class="d-flex align-items-center gap-3">
                <div class="transaction-amount ${transaction.type}">
                    ${isIncome ? '+' : '-'}${formatCurrency(transaction.amount)}
                </div>
                <div class="transaction-actions">
                    <button class="btn-edit" onclick="editTransaction('${transaction.id}')" title="Edit">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn-delete" onclick="confirmDelete('${transaction.id}')" title="Delete">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Update transactions list
 */
function updateTransactionsList() {
    const container = document.getElementById('transactionsList');
    const filters = {
        type: document.getElementById('filterType').value,
        category: document.getElementById('filterCategory').value,
        time: document.getElementById('filterTime').value
    };
    
    const filtered = getFilteredTransactions(filters);
    
    // Update filter count
    document.getElementById('filteredCount').textContent = 
        filters.type === 'all' && filters.category === 'all' && filters.time === 'all'
            ? `Showing all ${filtered.length} transaction${filtered.length !== 1 ? 's' : ''}`
            : `Showing ${filtered.length} transaction${filtered.length !== 1 ? 's' : ''}`;
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-receipt"></i>
                <p>No transactions found</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filtered.map(t => createTransactionHTML(t)).join('');
}

/**
 * Update summary section
 */
function updateSummary() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Calculate monthly totals
    const monthlyIncome = transactions
        .filter(t => t.type === 'income' && new Date(t.date) >= monthStart)
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const monthlyExpenses = transactions
        .filter(t => t.type === 'expense' && new Date(t.date) >= monthStart)
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    document.getElementById('monthlyIncome').textContent = formatCurrency(monthlyIncome);
    document.getElementById('monthlyExpenses').textContent = formatCurrency(monthlyExpenses);
    
    // Category breakdowns
    updateCategoryBreakdown('expense', 'expenseBreakdown');
    updateCategoryBreakdown('income', 'incomeBreakdown');
}

/**
 * Update category breakdown
 */
function updateCategoryBreakdown(type, containerId) {
    const container = document.getElementById(containerId);
    const filtered = transactions.filter(t => t.type === type);
    const total = filtered.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state py-4">
                <i class="bi bi-pie-chart" style="font-size: 2rem;"></i>
                <p class="mb-0">No ${type} data available</p>
            </div>
        `;
        return;
    }
    
    // Group by category
    const categories = {};
    filtered.forEach(t => {
        if (!categories[t.category]) {
            categories[t.category] = 0;
        }
        categories[t.category] += parseFloat(t.amount);
    });
    
    // Sort by amount
    const sorted = Object.entries(categories).sort((a, b) => b[1] - a[1]);
    
    const colorClass = type === 'expense' ? 'danger' : 'success';
    
    container.innerHTML = sorted.map(([category, amount]) => {
        const percentage = ((amount / total) * 100).toFixed(1);
        return `
            <div class="category-item">
                <div class="flex-grow-1 me-3">
                    <div class="d-flex justify-content-between mb-1">
                        <span>${category}</span>
                        <span>${formatCurrency(amount)}</span>
                    </div>
                    <div class="progress">
                        <div class="progress-bar bg-${colorClass}" style="width: ${percentage}%"></div>
                    </div>
                    <small class="text-muted">${percentage}%</small>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================
// FORM HANDLING
// ============================================

/**
 * Handle form submission
 */
function handleFormSubmit(e) {
    e.preventDefault();
    
    // Clear previous alerts
    document.getElementById('formAlert').innerHTML = '';
    
    // Get form values
    const editId = document.getElementById('editTransactionId').value;
    const type = document.querySelector('input[name="transactionType"]:checked').value;
    const amount = document.getElementById('amount').value;
    const category = document.getElementById('category').value;
    const date = document.getElementById('date').value;
    const note = document.getElementById('note').value.trim();
    
    // Validation
    if (!amount || parseFloat(amount) <= 0) {
        showAlert('Please enter a valid amount greater than 0', 'danger');
        return;
    }
    
    if (!category) {
        showAlert('Please select a category', 'danger');
        return;
    }
    
    if (!date) {
        showAlert('Please select a date', 'danger');
        return;
    }
    
    // Create transaction object
    const transaction = {
        type,
        amount: parseFloat(amount),
        category,
        date,
        note
    };
    
    if (editId) {
        // Update existing
        updateTransaction(editId, transaction);
        showAlert('Transaction updated successfully!', 'success');
        resetForm();
    } else {
        // Add new
        addTransaction(transaction);
        showAlert('Transaction added successfully!', 'success');
        resetForm();
    }
    
    // Navigate to transactions after a delay
    setTimeout(() => {
        if (!editId) {
            navigateToSection('transactions');
        }
    }, 1000);
}

/**
 * Show alert message
 */
function showAlert(message, type) {
    const alertContainer = document.getElementById('formAlert');
    alertContainer.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            <i class="bi bi-${type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
}

/**
 * Reset form to default state
 */
function resetForm() {
    document.getElementById('transactionForm').reset();
    document.getElementById('editTransactionId').value = '';
    document.getElementById('submitBtn').innerHTML = '<i class="bi bi-plus-lg me-2"></i>Add Transaction';
    document.getElementById('cancelEdit').style.display = 'none';
    document.getElementById('typeExpense').checked = true;
    toggleCategoryOptions();
    setDefaultDate();
}

/**
 * Edit transaction - populate form
 */
function editTransaction(id) {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;
    
    // Set form values
    document.getElementById('editTransactionId').value = id;
    document.querySelector(`input[name="transactionType"][value="${transaction.type}"]`).checked = true;
    document.getElementById('amount').value = transaction.amount;
    document.getElementById('category').value = transaction.category;
    document.getElementById('date').value = transaction.date;
    document.getElementById('note').value = transaction.note || '';
    
    // Toggle category options based on type
    toggleCategoryOptions();
    
    // Update UI
    document.getElementById('submitBtn').innerHTML = '<i class="bi bi-pencil me-2"></i>Update Transaction';
    document.getElementById('cancelEdit').style.display = 'block';
    
    // Navigate to add transaction section
    navigateToSection('add-transaction');
}

/**
 * Confirm delete transaction
 */
function confirmDelete(id) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        deleteTransaction(id);
    }
}

/**
 * Toggle category options based on transaction type
 */
function toggleCategoryOptions() {
    const type = document.querySelector('input[name="transactionType"]:checked').value;
    const expenseGroup = document.getElementById('expenseCategories');
    const incomeGroup = document.getElementById('incomeCategories');
    const categorySelect = document.getElementById('category');
    
    if (type === 'expense') {
        expenseGroup.style.display = '';
        incomeGroup.style.display = 'none';
    } else {
        expenseGroup.style.display = 'none';
        incomeGroup.style.display = '';
    }
    
    // Reset category selection
    categorySelect.value = '';
}

// ============================================
// NAVIGATION
// ============================================

/**
 * Navigate to section
 */
function navigateToSection(sectionId) {
    // Update page title
    const titles = {
        'dashboard': 'Dashboard',
        'add-transaction': 'Add Transaction',
        'transactions': 'Transactions',
        'summary': 'Summary',
        'settings': 'Settings'
    };
    document.getElementById('pageTitle').textContent = titles[sectionId] || 'Dashboard';
    
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.section === sectionId) {
            item.classList.add('active');
        }
    });
    
    // Show/hide sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
    
    // Close sidebar on mobile
    if (window.innerWidth <= 992) {
        closeSidebar();
    }
}

/**
 * Toggle sidebar
 */
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    sidebar.classList.toggle('show');
    overlay.classList.toggle('show');
}

/**
 * Close sidebar
 */
function closeSidebar() {
    document.getElementById('sidebar').classList.remove('show');
    document.getElementById('sidebarOverlay').classList.remove('show');
}

// ============================================
// SETTINGS
// ============================================

/**
 * Load settings from localStorage
 */
function loadSettings() {
    const darkMode = localStorage.getItem('cashflow_darkMode') === 'true';
    document.getElementById('darkModeToggle').checked = darkMode;
    applyDarkMode(darkMode);
}

/**
 * Toggle dark mode
 */
function toggleDarkMode(enabled) {
    localStorage.setItem('cashflow_darkMode', enabled);
    applyDarkMode(enabled);
}

/**
 * Apply dark mode styling
 */
function applyDarkMode(enabled) {
    if (enabled) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}

/**
 * Clear all data
 */
function clearAllData() {
    if (confirm('Are you sure you want to delete all transactions? This action cannot be undone.')) {
        transactions = [];
        saveTransactions();
        updateDashboard();
        updateTransactionsList();
        updateSummary();
        alert('All data has been cleared.');
    }
}

/**
 * Export data to JSON
 */
function exportData() {
    const data = {
        transactions: transactions,
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `cashflow-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Import data from JSON
 */
function importData(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.transactions && Array.isArray(data.transactions)) {
                if (confirm(`This will import ${data.transactions.length} transactions. Continue?`)) {
                    transactions = [...data.transactions, ...transactions];
                    saveTransactions();
                    updateDashboard();
                    updateTransactionsList();
                    updateSummary();
                    alert('Data imported successfully!');
                }
            } else {
                alert('Invalid file format. Please select a valid CashFlow export file.');
            }
        } catch (err) {
            alert('Error reading file. Please select a valid JSON file.');
        }
    };
    
    reader.readAsText(file);
}

// ============================================
// FILTER SYSTEM
// ============================================

/**
 * Populate filter category dropdown
 */
function populateFilterCategories() {
    const select = document.getElementById('filterCategory');
    const categories = new Set();
    
    transactions.forEach(t => categories.add(t.category));
    
    // Keep the "All Categories" option
    select.innerHTML = '<option value="all">All Categories</option>';
    
    // Add categories sorted alphabetically
    [...categories].sort().forEach(cat => {
        select.innerHTML += `<option value="${cat}">${cat}</option>`;
    });
}

/**
 * Set default date to today
 */
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
}

// ============================================
// EVENT LISTENERS
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Load data
    loadTransactions();
    loadSettings();
    
    // Initialize UI
    setDefaultDate();
    updateDashboard();
    updateTransactionsList();
    updateSummary();
    populateFilterCategories();
    
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            navigateToSection(this.dataset.section);
        });
    });
    
    // Sidebar toggle
    document.getElementById('toggleSidebar').addEventListener('click', toggleSidebar);
    document.getElementById('sidebarOverlay').addEventListener('click', closeSidebar);
    
    // Form submission
    document.getElementById('transactionForm').addEventListener('submit', handleFormSubmit);
    
    // Cancel edit button
    document.getElementById('cancelEdit').addEventListener('click', resetForm);
    
    // Transaction type change
    document.querySelectorAll('input[name="transactionType"]').forEach(radio => {
        radio.addEventListener('change', toggleCategoryOptions);
    });
    
    // Filters
    document.getElementById('filterType').addEventListener('change', updateTransactionsList);
    document.getElementById('filterCategory').addEventListener('change', updateTransactionsList);
    document.getElementById('filterTime').addEventListener('change', updateTransactionsList);
    document.getElementById('clearFilters').addEventListener('click', function() {
        document.getElementById('filterType').value = 'all';
        document.getElementById('filterCategory').value = 'all';
        document.getElementById('filterTime').value = 'all';
        updateTransactionsList();
    });
    
    // Settings
    document.getElementById('darkModeToggle').addEventListener('change', function() {
        toggleDarkMode(this.checked);
    });
    
    document.getElementById('clearAllData').addEventListener('click', clearAllData);
    document.getElementById('exportData').addEventListener('click', exportData);
    
    document.getElementById('importBtn').addEventListener('click', function() {
        document.getElementById('importData').click();
    });
    
    document.getElementById('importData').addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            importData(e.target.files[0]);
            e.target.value = '';
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 992) {
            closeSidebar();
        }
    });
});

// Make functions globally available for onclick handlers
window.editTransaction = editTransaction;
window.confirmDelete = confirmDelete;
