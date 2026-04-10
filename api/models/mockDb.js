// Mock database implementation for testing without Docker
class MockDatabase {
  constructor() {
    this.users = new Map();
    this.nextId = 1;
    this.initializeAdmin();
  }

  initializeAdmin() {
    // Create default admin user
    this.users.set('admin@example.com', {
      id: this.nextId++,
      name: 'Admin User',
      email: 'admin@example.com',
      password: '$2b$10$9xk4kC.jlx0USnGmQWzulufoTA3cyQ9M6DjIpkSt15TxEgO8Tv.Xy', // password: admin123
      role: 'admin'
    });
    console.log('✅ Mock admin user created: admin@example.com / admin123');
  }

  promise() {
    return this;
  }

  async query(sql, params) {
    console.log('🔍 Mock DB Query:', sql, params);
    
    // Simulate database delay
    await new Promise(resolve => setTimeout(resolve, 100));

    if (sql.includes('SELECT') && sql.includes('users')) {
      if (sql.includes('email = ?')) {
        const email = params[0];
        const user = this.users.get(email);
        if (user) {
          return [[user]];
        }
        return [[]];
      }
      if (sql.includes("SHOW TABLES")) {
        return [[{ 'Tables_in_crud_app': 'users' }]];
      }
    }

    if (sql.includes('INSERT') && sql.includes('users')) {
      const [name, email, password, role] = params;
      
      // Check if user exists
      if (this.users.has(email)) {
        throw new Error('Duplicate entry');
      }

      const newUser = {
        id: this.nextId++,
        name,
        email,
        password,
        role: role || 'viewer'
      };

      this.users.set(email, newUser);
      
      return [{
        insertId: newUser.id,
        affectedRows: 1
      }];
    }

    return [[]];
  }
}

const mockDb = new MockDatabase();
module.exports = mockDb;
