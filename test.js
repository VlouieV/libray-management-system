class Book {
    constructor(title, author, category, isbn = null) {
        this.isbn = isbn || this.generateISBN();
        this.title = title;
        this.author = author;
        this.category = category;
        this.status = 'available';
        this.addedDate = new Date().toISOString();
    }

    generateISBN() {
        const prefix = 'ISBN';
        const year = new Date().getFullYear().toString().slice(-2);
        const timestamp = Date.now().toString().slice(-4);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${prefix}-${year}-${timestamp}-${random}`;
    }
}

class Member {
    constructor(name, email, type, id = Date.now().toString()) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.type = type;
        this.borrowedBooks = [];
        this.joinDate = new Date().toISOString();
        this.borrowLimit = type === 'student' ? 3 : 5;
    }
}

class Transaction {
    constructor(memberId, bookId, type, memberType, dueDate = null) {
        this.id = Date.now().toString();
        this.memberId = memberId;
        this.bookId = bookId;
        this.type = type; // 'borrow' or 'return'
        this.date = new Date().toISOString();
        this.dueDate = dueDate;
        this.status = 'active';
        this.returnDate = null;
    }
}

class LibrarySystem {
    constructor() {
        this.loadData();
        this.initializeEventListeners();
    }

    // Data Management
    loadData() {
        this.members = JSON.parse(localStorage.getItem('members')) || [];
        this.books = JSON.parse(localStorage.getItem('books')) || [];
        this.transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    }

    saveData() {
        localStorage.setItem('members', JSON.stringify(this.members));
        localStorage.setItem('books', JSON.stringify(this.books));
        localStorage.setItem('transactions', JSON.stringify(this.transactions));
    }

    // Member Management
    generateMemberId() {
        const prefix = 'MEM';
        const timestamp = Date.now().toString().slice(-4);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${prefix}${timestamp}${random}`;
    }

    addMember(name, email, type) {
        try {
            if (!name || !email || !type) {
                throw new Error('All fields are required');
            }

            if (this.members.some(m => m.email === email)) {
                throw new Error('Email already registered');
            }

            const memberId = this.generateMemberId();
            const member = new Member(name, email, type, memberId);
            this.members.push(member);
            this.saveData();
            this.updateMemberList();
            this.showMessage(`Member registered successfully! ID: ${memberId}`, 'success');
            this.updateDashboardStats();
            return member;
        } catch (error) {
            this.showMessage(error.message, 'error');
            return null;
        }
    }

    searchMembers(query) {
        query = query.toLowerCase().trim();
        return this.members.filter(member => 
            member.id.toLowerCase().includes(query) ||
            member.name.toLowerCase().includes(query) ||
            member.email.toLowerCase().includes(query)
        );
    }

    // Book Management
    addBook(title, author, category) {
        try {
            if (!title || !author || !category) {
                throw new Error('Title, author, and category are required');
            }

            const book = new Book(title, author, category);
            this.books.push(book);
            this.saveData();
            this.updateBookList();
            this.updateBookStats();
            this.showMessage(`Book added successfully! ISBN: ${book.isbn}`, 'success');
            return book;
        } catch (error) {
            this.showMessage(error.message, 'error');
            return null;
        }
    }

    searchBooks(query) {
        query = query.toLowerCase().trim();
        return this.books.filter(book => 
            book.isbn.toLowerCase().includes(query) ||
            book.title.toLowerCase().includes(query) ||
            book.author.toLowerCase().includes(query) ||
            book.category.toLowerCase().includes(query)
        );
    }

    updateBookStats() {
        const totalBooks = this.books.length;
        const borrowedBooks = this.books.filter(book => book.status === 'borrowed').length;
        const availableBooks = this.books.filter(book => book.status === 'available').length;

        // Update stats in the UI
        const stats = {
            totalBooks,
            borrowedBooks,
            availableBooks
        };

        Object.entries(stats).forEach(([key, value]) => {
            const element = document.getElementById(key);
            if (element) {
                element.textContent = value;
            }
        });
    }

    updateBookList() {
        const bookList = document.getElementById('book-list');
        if (!bookList) return;

        const searchQuery = document.getElementById('searchBook')?.value?.toLowerCase() || '';
        const categoryFilter = document.getElementById('categoryFilter')?.value?.toLowerCase() || '';
        const statusFilter = document.getElementById('statusFilter')?.value?.toLowerCase() || '';

        let filteredBooks = this.books;

        // Apply search filter
        if (searchQuery) {
            filteredBooks = filteredBooks.filter(book =>
                book.title.toLowerCase().includes(searchQuery) ||
                book.author.toLowerCase().includes(searchQuery) ||
                book.isbn.toLowerCase().includes(searchQuery)
            );
        }

        // Apply category filter
        if (categoryFilter) {
            filteredBooks = filteredBooks.filter(book => 
                book.category.toLowerCase() === categoryFilter
            );
        }

        // Apply status filter
        if (statusFilter) {
            filteredBooks = filteredBooks.filter(book => 
                book.status.toLowerCase() === statusFilter
            );
        }

        bookList.innerHTML = filteredBooks.map(book => `
            <div class="book-card">
                <div class="book-info">
                    <h3>${book.title}</h3>
                    <p><strong>ISBN:</strong> ${book.isbn}</p>
                    <p><strong>Author:</strong> ${book.author}</p>
                    <p><strong>Category:</strong> ${book.category}</p>
                    <p><strong>Status:</strong> <span class="status-badge ${book.status.toLowerCase()}">${book.status}</span></p>
                    <p><strong>Added Date:</strong> ${new Date(book.addedDate).toLocaleDateString()}</p>
                </div>
                <div class="book-actions">
                    <button onclick="window.library.deleteBook('${book.isbn}')" class="delete-btn" ${book.status === 'borrowed' ? 'disabled' : ''}>
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('') || '<p class="no-books">No books found</p>';
    }

    toggleBookStatus(isbn) {
        const book = this.books.find(b => b.isbn === isbn);
        if (book) {
            book.status = book.status === 'available' ? 'borrowed' : 'available';
            this.saveData();
            this.updateBookList();
            this.updateBookStats();
            this.showMessage(`Book status updated to ${book.status}`, 'success');
        }
    }

    viewBookDetails(isbn) {
        const book = this.books.find(b => b.isbn === isbn);
        if (!book) return;

        const modalContent = `
            <div class="modal-content">
                <h2>Book Details</h2>
                <div class="book-details">
                    <p><strong>ISBN:</strong> ${book.isbn}</p>
                    <p><strong>Title:</strong> ${book.title}</p>
                    <p><strong>Author:</strong> ${book.author}</p>
                    <p><strong>Category:</strong> ${book.category}</p>
                    <p><strong>Status:</strong> 
                        <span class="status-badge ${book.status}">
                            ${book.status === 'available' ? 'Available' : 'Borrowed'}
                        </span>
                    </p>
                    <p><strong>Added Date:</strong> ${new Date(book.addedDate).toLocaleDateString()}</p>
                </div>
                <button onclick="closeModal()" class="close-btn">Close</button>
            </div>
        `;

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = modalContent;
        document.body.appendChild(modal);
    }

    // Transaction Management
    processTransaction(memberId, bookId, type) {
        try {
            const member = this.members.find(m => m.id === memberId);
            const book = this.books.find(b => b.isbn === bookId);

            if (!member || !book) {
                throw new Error('Invalid Member ID or Book ISBN');
            }

            if (type === 'borrow') {
                // Check borrowing limits based on member type
                const borrowLimit = {
                    'student': 3,
                    'faculty': 5,
                    'staff': 4
                }[member.type] || 3;

                if (member.borrowedBooks.length >= borrowLimit) {
                    throw new Error(`Borrowing limit (${borrowLimit}) reached for ${member.type}`);
                }

                if (book.status !== 'available') {
                    throw new Error('Book is not available for borrowing');
                }

                const dueDate = this.calculateDueDate(member.type);
                const transaction = new Transaction(
                    memberId,
                    bookId,
                    'borrow',
                    member.type,
                    dueDate
                );

                this.transactions.push(transaction);
                book.status = 'borrowed';
                member.borrowedBooks.push(bookId);

                this.showMessage(
                    `Book borrowed successfully by ${member.name}
                    Due Date: ${new Date(dueDate).toLocaleDateString()}
                    Loan Period: ${this.getLoanPeriod(member.type)}`, 
                    'success'
                );
            } else if (type === 'return') {
                const activeTransaction = this.findActiveTransaction(memberId, bookId);
                if (!activeTransaction) {
                    throw new Error('No active borrow record found');
                }

                activeTransaction.status = 'completed';
                activeTransaction.returnDate = new Date().toISOString();
                book.status = 'available';
                member.borrowedBooks = member.borrowedBooks.filter(id => id !== bookId);

                // Check if book is returned late
                if (new Date() > new Date(activeTransaction.dueDate)) {
                    this.showMessage(`Book returned late by ${member.name}. Due date was ${new Date(activeTransaction.dueDate).toLocaleDateString()}`, 'warning');
                } else {
                    this.showMessage(`Book returned successfully by ${member.name}`, 'success');
                }
            }

            this.saveData();
            this.updateTransactionList();
            this.updateBookList();
            this.updateMemberList();
            this.updateDashboardStats();

        } catch (error) {
            this.showMessage(error.message, 'error');
        }
    }

    calculateDueDate(memberType) {
        const dueDate = new Date();
        switch (memberType.toLowerCase()) {
            case 'student':
                dueDate.setDate(dueDate.getDate() + 5); // 5 days for students
                break;
            case 'faculty':
                dueDate.setDate(dueDate.getDate() + 7); // 7 days for faculty
                break;
            case 'staff':
                dueDate.setDate(dueDate.getDate() + 6); // 6 days for staff
                break;
            default:
                dueDate.setDate(dueDate.getDate() + 5); // default 5 days
        }
        return dueDate.toISOString();
    }

    findActiveTransaction(memberId, bookId) {
        return this.transactions.find(t => 
            t.memberId === memberId && 
            t.bookId === bookId && 
            t.status === 'active'
        );
    }

    getTransactionHistory(query = '') {
        let filteredTransactions = this.transactions;

        if (query) {
            query = query.toLowerCase().trim();
            filteredTransactions = this.transactions.filter(transaction => {
                const member = this.members.find(m => m.id === transaction.memberId);
                const book = this.books.find(b => b.isbn === transaction.bookId);
                
                return (
                    (member && (
                        member.name.toLowerCase().includes(query) ||
                        member.id.toLowerCase().includes(query)
                    )) ||
                    (book && (
                        book.title.toLowerCase().includes(query) ||
                        book.isbn.toLowerCase().includes(query)
                    )) ||
                    transaction.id.toLowerCase().includes(query) ||
                    transaction.type.toLowerCase().includes(query)
                );
            });
        }

        return filteredTransactions.map(transaction => {
            const member = this.members.find(m => m.id === transaction.memberId);
            const book = this.books.find(b => b.isbn === transaction.bookId);
            
            return {
                ...transaction,
                memberName: member ? member.name : 'Unknown Member',
                memberType: member ? member.type : 'Unknown',
                bookTitle: book ? book.title : 'Unknown Book',
                isOverdue: this.isOverdue(transaction)
            };
        });
    }

    updateTransactionList() {
        const transactionList = document.getElementById('transaction-list');
        if (!transactionList) return;

        const searchQuery = document.getElementById('searchTransaction')?.value || '';
        const statusFilter = document.getElementById('transactionStatusFilter')?.value || '';
        const typeFilter = document.getElementById('transactionTypeFilter')?.value || '';

        let transactions = this.getTransactionHistory(searchQuery);

        // Apply status and type filters
        transactions = transactions.filter(t => {
            const matchesStatus = !statusFilter || this.getTransactionStatus(t) === statusFilter;
            const matchesType = !typeFilter || t.type === typeFilter;
            return matchesStatus && matchesType;
        });

        // Sort transactions by date (most recent first)
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        transactionList.innerHTML = transactions.map(t => `
            <div class="transaction-card ${this.getTransactionStatus(t)}">
                <div class="transaction-info">
                    <h4>${t.type.toUpperCase()}: ${t.bookTitle}</h4>
                    <p><strong>Transaction ID:</strong> ${t.id}</p>
                    <p><strong>Member:</strong> ${t.memberName} (${t.memberType})</p>
                    <p><strong>Book:</strong> ${t.bookTitle}</p>
                    <p><strong>Transaction Date:</strong> ${new Date(t.date).toLocaleDateString()}</p>
                    ${t.type === 'borrow' ? `
                        <p><strong>Due Date:</strong> ${new Date(t.dueDate).toLocaleDateString()}</p>
                        ${t.isOverdue ? '<p class="overdue">OVERDUE</p>' : ''}
                    ` : ''}
                    ${t.returnDate ? `
                        <p><strong>Return Date:</strong> ${new Date(t.returnDate).toLocaleDateString()}</p>
                    ` : ''}
                    <span class="status-badge ${this.getTransactionStatus(t)}">
                        ${this.getTransactionStatusText(t)}
                    </span>
                </div>
            </div>
        `).join('');

        this.updateTransactionStats();
    }

    // UI Updates
    updateMemberList() {
        const memberList = document.getElementById('member-list');
        if (!memberList) return;

        const searchQuery = document.getElementById('searchMember')?.value?.toLowerCase() || '';
        const members = searchQuery ? 
            this.members.filter(m => 
                m.name.toLowerCase().includes(searchQuery) || 
                m.email.toLowerCase().includes(searchQuery) ||
                m.id.toLowerCase().includes(searchQuery)
            ) : this.members;

        memberList.innerHTML = members.map(member => {
            // Ensure borrowedBooks exists, if not, initialize it
            if (!member.borrowedBooks) {
                member.borrowedBooks = [];
            }
            
            return `
                <li class="member-card">
                    <div class="member-info">
                        <h3>${member.name}</h3>
                        <p><strong>Member ID:</strong> ${member.id}</p>
                        <p><strong>Email:</strong> ${member.email}</p>
                        <p><strong>Type:</strong> ${member.type}</p>
                        <p><strong>Books Borrowed:</strong> ${member.borrowedBooks.length}/${member.borrowLimit}</p>
                        <p><strong>Join Date:</strong> ${new Date(member.joinDate).toLocaleDateString()}</p>
                    </div>
                    <div class="member-actions">
                        <button onclick="library.viewMemberDetails('${member.id}')" class="view-btn">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="library.deleteMember('${member.id}')" class="delete-btn">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </li>
            `;
        }).join('');
    }

    updateTransactionStats() {
        const stats = {
            activeLoans: this.transactions.filter(t => t.status === 'active').length,
            overdueItems: this.transactions.filter(t => this.isOverdue(t)).length,
            completedToday: this.transactions.filter(t => 
                t.status === 'completed' && 
                new Date(t.returnDate).toDateString() === new Date().toDateString()
            ).length
        };

        Object.entries(stats).forEach(([key, value]) => {
            const element = document.getElementById(key);
            if (element) element.textContent = value;
        });
    }

    viewMemberDetails(memberId) {
        const member = this.members.find(m => m.id === memberId);
        if (!member) {
            this.showMessage('Member not found', 'error');
            return;
        }

        const modal = document.getElementById('memberModal');
        const memberDetails = document.getElementById('memberDetails');
        
        if (modal && memberDetails) {
            memberDetails.innerHTML = `
                <h2>Member Details</h2>
                <div class="member-detail-info">
                    <p><strong>Name:</strong> ${member.name}</p>
                    <p><strong>ID:</strong> ${member.id}</p>
                    <p><strong>Email:</strong> ${member.email}</p>
                    <p><strong>Type:</strong> ${member.type}</p>
                    <p><strong>Join Date:</strong> ${new Date(member.joinDate).toLocaleDateString()}</p>
                    <p><strong>Books Borrowed:</strong> ${member.borrowedBooks.length}/${member.borrowLimit}</p>
                </div>
                <div class="borrowed-books-list">
                    <h3>Currently Borrowed Books</h3>
                    ${this.getBorrowedBooksHTML(member.borrowedBooks)}
                </div>
            `;
            modal.style.display = 'block';
        }
    }

    getBorrowedBooksHTML(borrowedBooks) {
        if (!borrowedBooks || borrowedBooks.length === 0) {
            return '<p>No books currently borrowed</p>';
        }

        return `
            <ul>
                ${borrowedBooks.map(bookId => {
                    const book = this.books.find(b => b.isbn === bookId);
                    return book ? `
                        <li>
                            <strong>${book.title}</strong> by ${book.author}
                            (ISBN: ${book.isbn})
                        </li>
                    ` : '';
                }).join('')}
            </ul>
        `;
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Utility Methods
    showMessage(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        messageDiv.textContent = message;
        document.body.appendChild(messageDiv);
        setTimeout(() => messageDiv.remove(), 3000);
    }

    initializeEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            // Member Form
            const memberForm = document.getElementById('memberForm');
            if (memberForm) {
                memberForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const name = document.getElementById('memberName').value.trim();
                    const email = document.getElementById('email').value.trim();
                    const type = document.getElementById('memberType').value;
                    this.addMember(name, email, type);
                    memberForm.reset();
                });
            }

            // Book Form
            const bookForm = document.getElementById('bookForm');
            if (bookForm) {
                bookForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const title = document.getElementById('bookTitle').value.trim();
                    const author = document.getElementById('bookAuthor').value.trim();
                    const category = document.getElementById('bookCategory').value;
                    this.addBook(title, author, category);
                    bookForm.reset();
                });
            }

            // Transaction Form
            const transactionForm = document.getElementById('transactionForm');
            if (transactionForm) {
                transactionForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const memberId = document.getElementById('memberID').value.trim();
                    const bookId = document.getElementById('bookID').value.trim();
                    const type = document.getElementById('transactionType').value;
                    this.processTransaction(memberId, bookId, type);
                    transactionForm.reset();
                });
            }

            // Initialize all lists
            this.updateMemberList();
            this.updateBookList();
            this.updateTransactionList();

            // Search Member
            const searchMember = document.getElementById('searchMember');
            if (searchMember) {
                searchMember.addEventListener('input', (e) => {
                    this.updateMemberList();
                });
            }

            // Initialize dashboard stats
            this.updateDashboardStats();

            // Book Search and Filters
            const searchBook = document.getElementById('searchBook');
            const categoryFilter = document.getElementById('categoryFilter');
            const statusFilter = document.getElementById('statusFilter');

            [searchBook, categoryFilter, statusFilter].forEach(element => {
                if (element) {
                    element.addEventListener('input', () => this.updateBookList());
                    element.addEventListener('change', () => this.updateBookList());
                }
            });

            // Initialize book list and stats
            this.updateBookList();
            this.updateBookStats();

            // Transaction search and filters
            const searchTransaction = document.getElementById('searchTransaction');
            const transactionStatusFilter = document.getElementById('transactionStatusFilter');
            const transactionTypeFilter = document.getElementById('transactionTypeFilter');

            [searchTransaction, transactionStatusFilter, transactionTypeFilter].forEach(element => {
                if (element) {
                    element.addEventListener('input', () => this.updateTransactionList());
                    element.addEventListener('change', () => this.updateTransactionList());
                }
            });

            // Close modal when clicking outside
            window.onclick = (event) => {
                const modals = document.getElementsByClassName('modal');
                Array.from(modals).forEach(modal => {
                    if (event.target === modal) {
                        this.closeModal(modal.id);
                    }
                });
            };
        });
    }

    updateDashboardStats() {
        // Get statistics
        const stats = {
            totalMembers: this.members.length,
            totalBooks: this.books.length,
            activeLoans: this.transactions.filter(t => t.status === 'active').length,
            availableBooks: this.books.filter(b => b.status === 'available').length
        };

        // Update stats in the UI
        Object.entries(stats).forEach(([key, value]) => {
            const element = document.getElementById(key);
            if (element) {
                element.textContent = value;
            }
        });

        // Update active members list
        this.updateActiveMembersList();
    }

    updateActiveMembersList() {
        const activeMembersList = document.getElementById('activeMembersList');
        if (!activeMembersList) return;

        // Get members with active loans
        const activeMembers = this.members.filter(member => 
            member.borrowedBooks.length > 0
        ).slice(0, 5); // Show only the last 5 active members

        activeMembersList.innerHTML = activeMembers.length ? activeMembers.map(member => `
            <div class="active-member-card">
                <div class="member-avatar">
                    <i class="fas fa-user-circle"></i>
                </div>
                <div class="member-info">
                    <h4>${member.name}</h4>
                    <p><strong>ID:</strong> ${member.id}</p>
                    <p><strong>Books Borrowed:</strong> ${member.borrowedBooks.length}</p>
                </div>
            </div>
        `).join('') : '<p class="no-members">No active members</p>';
    }

    isOverdue(transaction) {
        if (transaction.status === 'completed' || !transaction.dueDate) return false;
        return new Date() > new Date(transaction.dueDate);
    }

    getTransactionStatus(transaction) {
        if (transaction.status === 'completed') return 'completed';
        if (this.isOverdue(transaction)) return 'overdue';
        return 'active';
    }

    getTransactionStatusText(transaction) {
        if (transaction.status === 'completed') return 'Completed';
        if (this.isOverdue(transaction)) return 'Overdue';
        return 'Active';
    }

    getLoanPeriod(memberType) {
        switch (memberType.toLowerCase()) {
            case 'student':
                return '5 days';
            case 'faculty':
                return '7 days';
            case 'staff':
                return '6 days';
            default:
                return '5 days';
        }
    }

    deleteMember(memberId) {
        if (!memberId) {
            this.showMessage('Invalid member ID', 'error');
            return;
        }

        if (confirm('Are you sure you want to delete this member?')) {
            try {
                const member = this.members.find(m => m.id === memberId);
                if (!member) {
                    this.showMessage('Member not found', 'error');
                    return;
                }

                // Check if member has any active loans
                const hasActiveLoans = this.transactions.some(t => 
                    t.memberId === memberId && t.status === 'active'
                );

                if (hasActiveLoans) {
                    this.showMessage('Cannot delete member with active loans', 'error');
                    return;
                }

                // Remove member from array
                this.members = this.members.filter(m => m.id !== memberId);
                
                // Save to localStorage and update UI
                this.saveData();
                this.updateMemberList();
                this.updateDashboardStats();
                this.showMessage('Member deleted successfully', 'success');
            } catch (error) {
                this.showMessage(`Error deleting member: ${error.message}`, 'error');
            }
        }
    }

    fixMemberData() {
        this.members = this.members.map(member => {
            if (!member.borrowedBooks) {
                member.borrowedBooks = [];
            }
            if (!member.borrowLimit) {
                member.borrowLimit = member.type === 'student' ? 3 : 5;
            }
            return member;
        });
        this.saveData();
    }

    deleteBook(isbn) {
        if (!isbn) {
            this.showMessage('Invalid book ISBN', 'error');
            return;
        }

        if (confirm('Are you sure you want to delete this book?')) {
            try {
                const book = this.books.find(b => b.isbn === isbn);
                if (!book) {
                    this.showMessage('Book not found', 'error');
                    return;
                }

                // Check if book is currently borrowed
                if (book.status === 'borrowed') {
                    this.showMessage('Cannot delete book that is currently borrowed', 'error');
                    return;
                }

                // Remove book from array
                this.books = this.books.filter(b => b.isbn !== isbn);
                
                // Save to localStorage and update UI
                this.saveData();
                this.updateBookList();
                this.updateBookStats();
                this.showMessage('Book deleted successfully', 'success');
            } catch (error) {
                this.showMessage(`Error deleting book: ${error.message}`, 'error');
            }
        }
    }
}

// Create a global instance of LibrarySystem
window.library = new LibrarySystem();
