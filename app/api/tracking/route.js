import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import * as UAParserLib from 'ua-parser-js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { id, lat, lng, method, referrer } = body;
    const headersList = await headers();
    let ip = headersList.get('x-forwarded-for') || headersList.get('cf-connecting-ip') || '127.0.0.1';
    
    // Jika ada banyak IP (proxy), ambil yang pertama
    if (ip.includes(',')) {
      ip = ip.split(',')[0].trim();
    }
    
    const userAgentStr = headersList.get('user-agent') || 'Unknown';

    // Parse User Agent
    const parser = new (UAParserLib.UAParser || UAParserLib)(userAgentStr);
    const browser = `${parser.getBrowser().name} (${parser.getBrowser().version})`;
    const os = `${parser.getOS().name} ${parser.getOS().version}`;

    // --- CASE 1: UPDATE EXISTING RECORD WITH GPS ---
    if (id) {
      await pool.query(
        'UPDATE user_tracking SET latitude = ?, longitude = ?, method = ? WHERE id = ?',
        [lat, lng, method, id]
      );
      return NextResponse.json({ status: 'updated' });
    }

    // --- CASE 2: NEW RECORD (SERVER-SIDE IP LOOKUP) ---
    let city = 'Unknown', region = 'Unknown', country = 'Unknown', isp = 'Unknown';
    let latitude = lat, longitude = lng;

    try {
        // Cek jika IP adalah localhost atau private LAN
        if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
            city = 'Local Test';
            region = 'Local Network';
            country = 'Testing Site';
            isp = 'Local Development';
        } else {
            console.log(`Fetching GeoIP for: ${ip}`);
            try {
                // Gunakan freeipapi.com sebagai utama (lebih stabil & gratis)
                const ipRes = await fetch(`https://freeipapi.com/api/json/${ip}`);
                const ipData = await ipRes.json();
                
                city = ipData.cityName || 'Unknown';
                region = ipData.regionName || 'Unknown';
                country = ipData.countryName || 'Unknown';
                isp = 'Visitor ISP'; 
                latitude = ipData.latitude;
                longitude = ipData.longitude;
            } catch (err) {
                console.log('Primary GeoIP failed, trying fallback...');
                const fallRes = await fetch(`http://ip-api.com/json/${ip}`);
                const fallData = await fallRes.json();
                city = fallData.city || 'Unknown';
                region = fallData.regionName || 'Unknown';
                country = fallData.country || 'Unknown';
                isp = fallData.isp || 'Unknown';
                latitude = fallData.lat;
                longitude = fallData.lon;
            }
        }
    } catch (e) {
        console.error('IP Geolocation all failed:', e.message);
    }

    const [result] = await pool.query(
      'INSERT INTO user_tracking (ip_address, user_agent, latitude, longitude, method, city, region, country, browser, os, isp, referring_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [ip, userAgentStr, latitude, longitude, method, city, region, country, browser, os, isp, referrer || 'no-referrer']
    );

    console.log(`New visit recorded: ${ip} from ${city}`);
    return NextResponse.json({ id: result.insertId });

  } catch (err) {
    console.error('Tracking API Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
