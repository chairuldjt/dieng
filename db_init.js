const mysql = require('mysql2/promise');
require('dotenv').config();
const bcrypt = require('bcryptjs');

async function initDB() {
    const config = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'chairul',
        password: process.env.DB_PASSWORD || '190701',
    };

    try {
        const connection = await mysql.createConnection(config);
        console.log('Menghubungkan ke MySQL...');

        await connection.query(`CREATE DATABASE IF NOT EXISTS dieng_db`);
        console.log('Database dieng_db siap.');

        await connection.query(`USE dieng_db`);

        // Tabel Destinasi
        await connection.query(`
            CREATE TABLE IF NOT EXISTS destinations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                image_url VARCHAR(255),
                category VARCHAR(50)
            )
        `);

        // Tabel Contacts/Feedback
        await connection.query(`
            CREATE TABLE IF NOT EXISTS contacts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100),
                message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Tabel Admin
        await connection.query(`
            CREATE TABLE IF NOT EXISTS admin_users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL
            )
        `);

        // Tabel Tracking
        await connection.query(`
            CREATE TABLE IF NOT EXISTS user_tracking (
                id INT AUTO_INCREMENT PRIMARY KEY,
                ip_address VARCHAR(45),
                user_agent TEXT,
                latitude DECIMAL(10, 8),
                longitude DECIMAL(11, 8),
                method ENUM('GPS', 'IP'),
                city VARCHAR(100),
                region VARCHAR(100),
                country VARCHAR(100),
                browser VARCHAR(100),
                os VARCHAR(100),
                isp VARCHAR(255),
                referring_url TEXT,
                last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Insert Default Admin
        const [rows] = await connection.query('SELECT * FROM admin_users WHERE username = ?', ['chairul']);
        if (rows.length === 0) {
            const hashedPassword = await bcrypt.hash('190701', 10);
            await connection.query('INSERT INTO admin_users (username, password) VALUES (?, ?)', ['chairul', hashedPassword]);
            console.log('Admin default dibuat: u: chairul p: 190701');
        }

        // Insert Sample Destinations (Update paths to /img/...)
        const sampleDestinations = [
            ['Candi Arjuna', 'Kompleks candi Hindu tertua di Jawa yang eksotis.', '/img/candi_arjuna.webp', 'Sejarah'],
            ['Telaga Warna', 'Danau yang warnanya berubah-ubah karena kandungan belerang.', '/img/telaga_warna.webp', 'Alam'],
            ['Kawah Sikidang', 'Kawah vulkanik aktif yang dapat didekati dengan aman.', '/img/kawah_sikidang.webp', 'Vulcanism']
        ];

        for (const dest of sampleDestinations) {
            const [existing] = await connection.query('SELECT * FROM destinations WHERE name = ?', [dest[0]]);
            if (existing.length === 0) {
                await connection.query('INSERT INTO destinations (name, description, image_url, category) VALUES (?, ?, ?, ?)', dest);
            }
        }

        console.log('Semua tabel dan data awal siap.');
        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error('Terjadi kesalahan saat init DB:', error);
        process.exit(1);
    }
}

initDB();
