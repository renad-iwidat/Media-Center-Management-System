import bcrypt from 'bcryptjs';
import pool from '../src/config/database';

async function seedAdmin() {
  try {
    console.log('Setting up admin password...');

    // نلاقي مدير المركز (غازي)
    const adminResult = await pool.query(
      "SELECT u.id, u.name, u.email FROM users u " +
      "INNER JOIN user_roles ur ON u.id = ur.user_id " +
      "INNER JOIN roles r ON ur.role_id = r.id " +
      "WHERE r.id = 22"
    );

    if (adminResult.rows.length === 0) {
      console.error('No user with مدير المركز role found');
      process.exit(1);
    }

    const admin = adminResult.rows[0];

    // نصلح الإيميل إذا غلط
    if (admin.email !== 'gmortaja@najah.edu') {
      await pool.query("UPDATE users SET email = 'gmortaja@najah.edu' WHERE id = $1", [admin.id]);
      console.log('Email fixed to: gmortaja@najah.edu');
    }

    // نشوف إذا عنده كلمة سر
    const checkResult = await pool.query('SELECT password_hash FROM users WHERE id = $1', [admin.id]);
    if (checkResult.rows[0].password_hash) {
      console.log('Admin already has a password:', admin.email);
      process.exit(0);
    }

    // نعمل كلمة سر
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('admin123', salt);
    await pool.query('UPDATE users SET password_hash = $1, is_active = true WHERE id = $2', [hash, admin.id]);

    console.log('Password set for:', admin.name, '-', admin.email);
    console.log('Default password: admin123');
    console.log('IMPORTANT: Change this password immediately!');
  } catch (error) {
    console.error('Failed:', error);
  } finally {
    await pool.end();
  }
}

seedAdmin();
