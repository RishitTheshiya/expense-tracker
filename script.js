const incomeCats = ['Salary', 'Freelance', 'Business', 'Investment', 'Other'];
        const expenseCats = ['Food', 'Entertainment', 'Shopping', 'Transport', 'Utilities', 'Other'];
        
        let currentType = 'income';
        let currentFilter = 'all';
        let currentSort = 'date';
        let transactions = [];
        let overviewChart = null;
        let expenseChart = null;

        function initializeApp() {
            loadData();
            updateDate();
            renderTransactions();
            updateCharts();
            updateDashboard();
        }

        function loadData() {
            const saved = localStorage.getItem('transactions');
            if (saved) {
                transactions = JSON.parse(saved);
            }
        }

        function saveData() {
            localStorage.setItem('transactions', JSON.stringify(transactions));
        }

        function updateDate() {
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', options);
            document.getElementById('date').valueAsDate = new Date();
        }

        function openModal(type) {
            currentType = type;
            document.getElementById('modalTitle').textContent = type === 'income' ? 'Add Income' : 'Add Expense';
            const cats = type === 'income' ? incomeCats : expenseCats;
            const select = document.getElementById('category');
            select.innerHTML = '<option value="">Select category</option>';
            cats.forEach(cat => {
                select.innerHTML += `<option value="${cat}">${cat}</option>`;
            });
            document.getElementById('modal').style.display = 'block';
        }

        function closeModal() {
            document.getElementById('modal').style.display = 'none';
            document.getElementById('form').reset();
        }

        function submitForm() {
            const amount = parseFloat(document.getElementById('amount').value);
            const category = document.getElementById('category').value;
            const description = document.getElementById('description').value;
            const date = document.getElementById('date').value;

            if (!amount || !category || !date) {
                showNotification('Please fill all fields', 'error');
                return;
            }

            transactions.unshift({
                id: Date.now(),
                date,
                category,
                amount: currentType === 'income' ? amount : -amount,
                description,
                type: currentType,
                status: 'Success'
            });

            saveData();
            updateDashboard();
            renderTransactions();
            updateCharts();
            closeModal();
            showNotification(`${currentType.charAt(0).toUpperCase() + currentType.slice(1)} added!`, 'success');
        }

        function filterTransactions(type) {
            currentFilter = type;
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
            renderTransactions();
        }

        function sortTransactions(type) {
            currentSort = type;
            document.querySelectorAll('.sort-btn').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
            renderTransactions();
        }

        function renderTransactions() {
            let filtered = transactions.filter(t => 
                currentFilter === 'all' ? true : t.type === currentFilter
            );

            filtered.sort((a, b) => {
                if (currentSort === 'date') {
                    return new Date(b.date) - new Date(a.date);
                } else {
                    return Math.abs(b.amount) - Math.abs(a.amount);
                }
            });

            const tbody = document.getElementById('transactionsBody');
            tbody.innerHTML = filtered.map(t => `
                <tr>
                    <td>${new Date(t.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}</td>
                    <td>${t.category}</td>
                    <td style="color: ${t.amount > 0 ? '#10b981' : '#ef4444'}">${t.amount > 0 ? '+' : ''}${t.amount.toFixed(2)}</td>
                    <td><span class="status-success">${t.status}</span></td>
                    <td><button onclick="deleteTransaction(${t.id})" style="background: none; border: none; cursor: pointer; color: #ef4444;"><i class="fas fa-trash"></i></button></td>
                </tr>
            `).join('');
        }

        function deleteTransaction(id) {
            transactions = transactions.filter(t => t.id !== id);
            saveData();
            updateDashboard();
            renderTransactions();
            updateCharts();
        }

        function updateDashboard() {
            const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
            const expenses = Math.abs(transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0));
            const balance = income - expenses;

            document.getElementById('incomeAmount').textContent = `$${income.toFixed(2)}`;
            document.getElementById('expenseAmount').textContent = `$${expenses.toFixed(2)}`;
            document.getElementById('netBalance').textContent = `$${balance.toFixed(2)}`;
            
            const budget = 5000;
            const progress = Math.min((expenses / budget) * 100, 100);
            document.getElementById('balanceProgress').style.width = progress + '%';
            document.getElementById('budgetInfo').textContent = `$${budget}`;
        }

        function updateCharts() {
            updateOverviewChart();
            updateExpenseChart();
        }

        function updateOverviewChart() {
            const ctx = document.getElementById('overviewChart').getContext('2d');
            const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
            const expenses = Math.abs(transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0));

            if (overviewChart) overviewChart.destroy();
            overviewChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Income', 'Expenses'],
                    datasets: [{
                        label: 'Amount',
                        data: [income, expenses],
                        backgroundColor: ['#10b981', '#ef4444'],
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true } }
                }
            });
        }

        function updateExpenseChart() {
            const ctx = document.getElementById('expenseChart').getContext('2d');
            const expensesByCategory = {};
            
            transactions.filter(t => t.type === 'expense').forEach(t => {
                expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + Math.abs(t.amount);
            });

            const labels = Object.keys(expensesByCategory);
            const data = Object.values(expensesByCategory);
            const colors = ['#ef4444', '#f59e0b', '#eab308', '#10b981', '#3b82f6', '#8b5cf6'];

            if (expenseChart) expenseChart.destroy();
            expenseChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels,
                    datasets: [{
                        data,
                        backgroundColor: colors.slice(0, labels.length)
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } }
                }
            });

            updateLegend(labels, colors);
        }

        function updateLegend(labels, colors) {
            const legend = document.getElementById('chartLegend');
            legend.innerHTML = labels.map((label, i) => `
                <div class="legend-item">
                    <div class="legend-dot" style="background: ${colors[i]}"></div>
                    <span>${label}</span>
                </div>
            `).join('');
        }

        function clearAllData() {
            if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
                transactions = [];
                localStorage.removeItem('transactions');
                updateDashboard();
                renderTransactions();
                updateCharts();
                showNotification('All data cleared', 'success');
            }
        }

        function exportData() {
            const dataStr = JSON.stringify(transactions, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'finance-data.json';
            link.click();
        }

        function showNotification(msg, type) {
            const notif = document.createElement('div');
            notif.className = `notification ${type}`;
            notif.textContent = msg;
            document.body.appendChild(notif);
            setTimeout(() => notif.remove(), 3000);
        }

        window.onclick = function(event) {
            const modal = document.getElementById('modal');
            if (event.target === modal) closeModal();
        }

        document.addEventListener('DOMContentLoaded', initializeApp);