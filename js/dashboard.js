// Dashboard JavaScript functionality

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    // Initialize charts when DOM is loaded
    initCharts();
    
    // Add event listeners
    setupEventListeners();
    
    // Load initial data
    loadDashboardData();
});

// Initialize Charts
function initCharts() {
    // Sales chart
    const salesChartCtx = document.getElementById('salesChart');
    if (salesChartCtx) {
        new Chart(salesChartCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                    label: 'Revenue',
                    data: [1500, 2500, 1800, 3500, 2800, 3200, 2400, 2800, 3600, 4200, 3800, 5000],
                    borderColor: '#4a6cf7',
                    backgroundColor: 'rgba(74, 108, 247, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            borderDash: [3, 3]
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Traffic chart
    const trafficChartCtx = document.getElementById('trafficChart');
    if (trafficChartCtx) {
        new Chart(trafficChartCtx, {
            type: 'doughnut',
            data: {
                labels: ['Direct', 'Social', 'Referral', 'Organic'],
                datasets: [{
                    data: [35, 25, 20, 20],
                    backgroundColor: ['#4a6cf7', '#28a745', '#ffc107', '#17a2b8'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                },
                cutout: '70%'
            }
        });
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Navigation menu items
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all items
            navItems.forEach(i => i.classList.remove('active'));
            // Add active class to clicked item
            this.classList.add('active');
        });
    });

    // Search functionality
    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) {
        searchInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
                alert('Search functionality to be implemented: ' + this.value);
                this.value = '';
            }
        });
    }

    // User menu interactions
    const userMenu = document.querySelector('.user-menu');
    if (userMenu) {
        userMenu.addEventListener('click', function() {
            // Toggle user dropdown menu
            const dropdown = document.querySelector('.user-dropdown');
            if (dropdown) {
                dropdown.classList.toggle('show');
            }
        });
    }
}

// Load Dashboard Data
function loadDashboardData() {
    // This function would typically fetch data from an API
    // For demo purposes, we're using static data

    // Update statistics
    updateStatistics({
        totalUsers: 12875,
        activeUsers: 9428,
        newUsers: 1234,
        userGrowth: 12.5,
        revenue: 52890,
        revenueGrowth: 8.2,
        orders: 2890,
        ordersGrowth: 5.7,
        conversion: 3.2,
        conversionGrowth: 1.5
    });

    // Update activity feed
    const activities = [
        { user: 'John Doe', action: 'created a new project', time: '2 minutes ago', icon: 'plus' },
        { user: 'Jane Smith', action: 'completed a task', time: '45 minutes ago', icon: 'check' },
        { user: 'Mike Johnson', action: 'added a comment', time: '3 hours ago', icon: 'comment' },
        { user: 'Sarah Williams', action: 'uploaded a file', time: '5 hours ago', icon: 'file' },
        { user: 'Robert Brown', action: 'started a meeting', time: 'Yesterday at 2:30 PM', icon: 'video' }
    ];
    
    updateActivityFeed(activities);
}

// Update Statistics
function updateStatistics(data) {
    // Update each statistic on the dashboard
    for (const [key, value] of Object.entries(data)) {
        const element = document.getElementById(key);
        if (element) {
            if (typeof value === 'number') {
                // Format numbers
                if (key.includes('Growth')) {
                    element.textContent = value > 0 ? `+${value}%` : `${value}%`;
                    element.classList.add(value > 0 ? 'text-success' : 'text-danger');
                } else if (key.includes('revenue')) {
                    element.textContent = `$${value.toLocaleString()}`;
                } else {
                    element.textContent = value.toLocaleString();
                }
            } else {
                element.textContent = value;
            }
        }
    }

    // Update progress bars
    const progressBars = document.querySelectorAll('.progress-value');
    progressBars.forEach(progressBar => {
        const percent = progressBar.getAttribute('data-percent');
        if (percent) {
            progressBar.style.width = `${percent}%`;
        }
    });
}

// Update Activity Feed
function updateActivityFeed(activities) {
    const activityList = document.querySelector('.activity-list');
    if (!activityList) return;

    activityList.innerHTML = '';

    activities.forEach(activity => {
        const li = document.createElement('li');
        li.className = 'activity-item';
        
        li.innerHTML = `
            <div class="activity-icon">
                <i class="fas fa-${activity.icon}"></i>
            </div>
            <div class="activity-content">
                <div class="activity-title">
                    <strong>${activity.user}</strong> ${activity.action}
                </div>
                <div class="activity-time">${activity.time}</div>
            </div>
        `;
        
        activityList.appendChild(li);
    });
}

// Toggle mobile menu
function toggleMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('show-mobile');
    }
}
