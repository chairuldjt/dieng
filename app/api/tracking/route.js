import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import * as UAParserLib from 'ua-parser-js';

function getClientIp(headersList) {
  const candidates = [
    headersList.get('cf-connecting-ip'),
    headersList.get('x-real-ip'),
    headersList.get('x-client-ip'),
    headersList.get('true-client-ip'),
    headersList.get('x-forwarded-for'),
    headersList.get('x-vercel-forwarded-for'),
    headersList.get('forwarded')
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (!candidate) continue;

    if (candidate.includes('for=')) {
      const match = candidate.match(/for="?(\[?[A-Fa-f0-9:.]+\]?|[^;,"]+)/i);
      if (match?.[1]) {
        return match[1].replace(/^\[|\]$/g, '').trim();
      }
    }

    const ip = candidate.split(',')[0].trim().replace(/^::ffff:/, '');
    if (ip) return ip;
  }

  return '127.0.0.1';
}

function normalizeDeviceModel({ bodyModel, parsedModel, parsedVendor, osName, userAgentStr }) {
  const rawModel = (bodyModel || parsedModel || '').trim();
  const normalizedModel = rawModel.replace(/^"+|"+$/g, '');

  if (normalizedModel && normalizedModel.length > 1 && normalizedModel.toLowerCase() !== 'k') {
    return normalizedModel;
  }

  if (parsedVendor && parsedVendor !== normalizedModel) {
    return parsedVendor;
  }

  // Banyak Android modern hanya mengirim token generik seperti "; K)" pada UA.
  if (/Android/i.test(userAgentStr)) {
    return 'Android Device';
  }

  return osName || 'Desktop';
}

function getAddressDetails(address = {}) {
  const city =
    address.city ||
    address.town ||
    address.city_district ||
    address.municipality ||
    address.village ||
    'Unknown';

  const state = address.state || address.province || address.region || 'Unknown';
  const district =
    address.county ||
    address.state_district ||
    address.city_district ||
    address.municipality ||
    'Unknown';

  const subdistrict =
    address.suburb ||
    address.quarter ||
    address.neighbourhood ||
    address.village ||
    address.hamlet ||
    'Unknown';

  const postalCode = address.postcode || 'Unknown';
  const country = address.country || 'Unknown';

  return {
    city,
    region: state,
    state,
    district,
    subdistrict,
    postalCode,
    country
  };
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { id, lat, lng, method, referrer, deviceModel } = body;
    const headersList = await headers();
    const ip = getClientIp(headersList);
    
    const userAgentStr = headersList.get('user-agent') || 'Unknown';

    // Parse User Agent
    const parser = new (UAParserLib.UAParser || UAParserLib)(userAgentStr);
    const browser = `${parser.getBrowser().name} (${parser.getBrowser().version})`;
    const os = `${parser.getOS().name} ${parser.getOS().version}`;
    const device_model = normalizeDeviceModel({
      bodyModel: deviceModel,
      parsedModel: parser.getDevice().model,
      parsedVendor: parser.getDevice().vendor,
      osName: parser.getOS().name,
      userAgentStr
    });

    // --- CASE 1: UPDATE EXISTING RECORD WITH GPS ---
    if (id && lat && lng) {
      // 1. Coba dapatkan nama lokasi asli dari GPS (Reverse Geocoding)
      let locationDetails = {
        city: 'Unknown',
        region: 'Unknown',
        state: 'Unknown',
        district: 'Unknown',
        subdistrict: 'Unknown',
        postalCode: 'Unknown',
        country: 'Unknown'
      };
      try {
        const revRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, {
          headers: { 'User-Agent': 'DiengExplorer/1.0' }
        });
        const revData = await revRes.json();
        if (revData.address) {
          locationDetails = getAddressDetails(revData.address);
        }
      } catch (e) { console.log('Reverse Geo failed:', e.message); }

      await pool.query(
        'UPDATE user_tracking SET latitude = ?, longitude = ?, method = ?, city = ?, region = ?, state = ?, district = ?, subdistrict = ?, postal_code = ?, country = ? WHERE id = ?',
        [lat, lng, method, locationDetails.city, locationDetails.region, locationDetails.state, locationDetails.district, locationDetails.subdistrict, locationDetails.postalCode, locationDetails.country, id]
      );
      return NextResponse.json({ status: 'updated' });
    }

    // --- CASE 2: NEW RECORD (SERVER-SIDE IP LOOKUP) ---
    let city = 'Unknown', region = 'Unknown', state = 'Unknown', district = 'Unknown', subdistrict = 'Unknown', postalCode = 'Unknown', country = 'Unknown', isp = 'Unknown';
    let latitude = lat, longitude = lng;

    try {
        // Cek jika IP adalah localhost atau private LAN
        if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
            city = 'Local Test';
            region = 'Local Network';
            state = 'Local Network';
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
                state = ipData.regionName || 'Unknown';
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
                state = fallData.regionName || 'Unknown';
                country = fallData.country || 'Unknown';
                isp = fallData.isp || 'Unknown';
                postalCode = fallData.zip || 'Unknown';
                latitude = fallData.lat;
                longitude = fallData.lon;
            }
        }
    } catch (e) {
        console.error('IP Geolocation all failed:', e.message);
    }

    const [result] = await pool.query(
      'INSERT INTO user_tracking (ip_address, user_agent, latitude, longitude, method, city, region, state, district, subdistrict, postal_code, country, browser, os, device_model, isp, referring_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [ip, userAgentStr, latitude, longitude, method, city, region, state, district, subdistrict, postalCode, country, browser, os, device_model, isp, referrer || 'no-referrer']
    );

    console.log(`New visit recorded: ${ip} from ${city}`);
    return NextResponse.json({ id: result.insertId });

  } catch (err) {
    console.error('Tracking API Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
