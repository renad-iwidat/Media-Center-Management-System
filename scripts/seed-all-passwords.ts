import bcrypt from 'bcryptjs';
import pool from '../src/config/database';

/**
 * تعيين كلمة سر افتراضية لكل المستخدمين اللي ما عندهم كلمة سر
 * كلمة السر الافتراضية: أول 4 حروف من الإيميل + 1234
 * مثال: hmasri@najah.edu → hmas1234
 */
async function seedPasswords() {
  try {
    const result = await pool.query(
      'SELECT id, name, email FROM users WHERE password_hash IS NULL'
    );

    console.log('Users without password:', result.rows.length);

    for (const user of result.rows) {
      const prefix = user.email.split('@')[0].substring(0, 4);
      const defaultPassword = prefix + '1234';
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(defaultPassword, salt);

      await pool.query('UPDATE users SET password_hash = $1, is_active = true WHERE id = $2', [hash, user.id]);
      console.log(' ', user.name, '|', user.email, '| password:', defaultPassword);
    }

    console.log('\nDone. All users can now login.');
    console.log('IMPORTANT: Users should change their passwords on first login.');
  } catch (error) {
    console.error('Failed:', error);
  } finally {
    await pool.end();
  }
}

seedPasswords();
