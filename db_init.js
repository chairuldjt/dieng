const mysql = require('mysql2/promise');
require('dotenv').config();
const bcrypt = require('bcryptjs');

async function ensureColumn(connection, databaseName, tableName, columnName, definition) {
    const [rows] = await connection.query(
        `
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?
        `,
        [databaseName, tableName, columnName]
    );

    if (rows.length === 0) {
        await connection.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${definition}`);
        console.log(`Kolom ${tableName}.${columnName} ditambahkan.`);
    }
}

async function initDB() {
    const databaseName = process.env.DB_NAME || 'dieng_db';
    const config = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'chairul',
        password: process.env.DB_PASSWORD || '190701',
    };

    try {
        const connection = await mysql.createConnection(config);
        console.log('Menghubungkan ke MySQL...');

        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\``);
        console.log(`Database ${databaseName} siap.`);

        await connection.query(`USE \`${databaseName}\``);

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
                gps_accuracy DECIMAL(10, 2),
                method ENUM('GPS', 'IP'),
                city VARCHAR(100),
                region VARCHAR(100),
                state VARCHAR(100),
                district VARCHAR(100),
                subdistrict VARCHAR(100),
                postal_code VARCHAR(20),
                country VARCHAR(100),
                browser VARCHAR(100),
                os VARCHAR(100),
                device_model VARCHAR(100),
                isp VARCHAR(255),
                referring_url TEXT,
                last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await ensureColumn(connection, databaseName, 'user_tracking', 'ip_address', 'VARCHAR(45)');
        await ensureColumn(connection, databaseName, 'user_tracking', 'user_agent', 'TEXT');
        await ensureColumn(connection, databaseName, 'user_tracking', 'latitude', 'DECIMAL(10, 8)');
        await ensureColumn(connection, databaseName, 'user_tracking', 'longitude', 'DECIMAL(11, 8)');
        await ensureColumn(connection, databaseName, 'user_tracking', 'gps_accuracy', 'DECIMAL(10, 2)');
        await ensureColumn(connection, databaseName, 'user_tracking', 'method', "ENUM('GPS', 'IP')");
        await ensureColumn(connection, databaseName, 'user_tracking', 'city', 'VARCHAR(100)');
        await ensureColumn(connection, databaseName, 'user_tracking', 'region', 'VARCHAR(100)');
        await ensureColumn(connection, databaseName, 'user_tracking', 'state', 'VARCHAR(100)');
        await ensureColumn(connection, databaseName, 'user_tracking', 'district', 'VARCHAR(100)');
        await ensureColumn(connection, databaseName, 'user_tracking', 'subdistrict', 'VARCHAR(100)');
        await ensureColumn(connection, databaseName, 'user_tracking', 'postal_code', 'VARCHAR(20)');
        await ensureColumn(connection, databaseName, 'user_tracking', 'country', 'VARCHAR(100)');
        await ensureColumn(connection, databaseName, 'user_tracking', 'browser', 'VARCHAR(100)');
        await ensureColumn(connection, databaseName, 'user_tracking', 'os', 'VARCHAR(100)');
        await ensureColumn(connection, databaseName, 'user_tracking', 'device_model', 'VARCHAR(100)');
        await ensureColumn(connection, databaseName, 'user_tracking', 'isp', 'VARCHAR(255)');
        await ensureColumn(connection, databaseName, 'user_tracking', 'referring_url', 'TEXT');
        await ensureColumn(connection, databaseName, 'user_tracking', 'last_activity', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
        await ensureColumn(connection, databaseName, 'user_tracking', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

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
            ['Kawah Sikidang', 'Kawah vulkanik aktif yang dapat didekati dengan aman.', '/img/kawah_sikidang.webp', 'Vulcanism'],
            ['Gunung Prau', 'Puncak yang menawarkan pemandangan "Golden Sunrise" terbaik di Asia Tenggara.', '/img/mt_prau_view.png', 'Petualangan'],
            ['Sikunir Sunrise', 'Bukit dengan pemandangan sunrise 8 gunung yang memukau.', '/img/sikunir_sunrise.png', 'Alam'],
            ['Telaga Pengilon', 'Danau jernih yang memantulkan keindahan alam sekitarnya seperti cermin.', '/img/telaga_pengilon.png', 'Alam'],
            ['Candi Bima', 'Candi unik dengan gaya arsitektur perpaduan India Utara dan Selatan.', '/img/candi_bima.png', 'Sejarah'],
            ['Milky Way Dieng', 'Langit malam Dieng yang bersih memperlihatkan gugusan bintang Bima Sakti.', '/img/dieng_milky_way.png', 'Fotografi'],
            ['Perkebunan Dieng', 'Hamparan hijau tanaman lokal yang tertata rapi di lereng bukit.', '/img/dieng_potato_fields.png', 'Budaya']
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
