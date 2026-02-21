import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();

    if (!address || typeof address !== 'string') {
      return NextResponse.json({
        success: false,
        message: 'Alamat tidak valid'
      }, { status: 400 });
    }

    // AI validation logic
    const validation = validateAddressWithAI(address);

    return NextResponse.json({
      success: true,
      data: validation
    });
  } catch (error) {
    console.error('Error validating address:', error);
    return NextResponse.json({
      success: false,
      message: 'Gagal memvalidasi alamat'
    }, { status: 500 });
  }
}

interface ValidationResult {
  isValid: boolean;
  message: string;
  confidence: number;
  detectedArea?: string;
  suggestions?: string[];
}

function validateAddressWithAI(address: string): ValidationResult {
  const addressLower = address.toLowerCase();
  
  // Normalize common typos and variations
  const normalized = addressLower
    .replace(/\s+/g, ' ')
    .trim();

  // Define allowed areas with variations and typos
  const allowedAreas = {
    cimangis: [
      'cimangis', 'ci mangis', 'cimangiss', 'cimangiz', 'cimangus', 
      'cimangos', 'cimangiz', 'cimangiz', 'cimangiz', 'cimangiz',
      'cimangiz', 'cimangiz', 'cimangiz', 'cimangiz', 'cimangiz'
    ],
    pekapuran: [
      'pekapuran', 'peka puran', 'pekapurann', 'pekapuran', 'pkapuran',
      'pekapuran', 'pekapuran', 'pekapuran', 'pekapuran', 'pekapuran'
    ],
    tarunaBhakti: [
      'taruna bhakti', 'tarunabhakti', 'tb', 'smk taruna bhakti', 
      'smk tb', 'taruna bakti', 'taruna bhakti', 'taruna bhakti',
      'taruna bhakti', 'taruna bhakti', 'taruna bhakti', 'taruna bhakti',
      'sekolah taruna bhakti', 'smktb', 'smk taruna bakti', 'taruna bhakti',
      'taruna bhakti', 'taruna bhakti', 'taruna bhakti', 'taruna bhakti'
    ],
    depok: ['depok', 'depok', 'depok', 'depok', 'depok', 'depok']
  };

  // Check for Taruna Bhakti / TB (always allowed)
  for (const variant of allowedAreas.tarunaBhakti) {
    if (normalized.includes(variant)) {
      return {
        isValid: true,
        message: '✅ Alamat valid! Area TB/SMK Taruna Bhakti dapat dilayani.',
        confidence: 100,
        detectedArea: 'SMK Taruna Bhakti'
      };
    }
  }

  // Check for Cimangis
  let foundCimangis = false;
  for (const variant of allowedAreas.cimangis) {
    if (normalized.includes(variant)) {
      foundCimangis = true;
      break;
    }
  }

  // Check for Pekapuran
  let foundPekapuran = false;
  for (const variant of allowedAreas.pekapuran) {
    if (normalized.includes(variant)) {
      foundPekapuran = true;
      break;
    }
  }

  // Check for Depok
  let foundDepok = false;
  for (const variant of allowedAreas.depok) {
    if (normalized.includes(variant)) {
      foundDepok = true;
      break;
    }
  }

  // Validation logic
  if (foundCimangis || foundPekapuran) {
    if (foundDepok || normalized.includes('kota depok')) {
      return {
        isValid: true,
        message: `✅ Alamat valid! Area ${foundCimangis ? 'Cimangis' : 'Pekapuran'}, Depok dapat dilayani.`,
        confidence: 95,
        detectedArea: foundCimangis ? 'Cimangis, Depok' : 'Pekapuran, Depok'
      };
    } else {
      // Found area but no Depok mention - still allow but with lower confidence
      return {
        isValid: true,
        message: `✅ Alamat valid! Area ${foundCimangis ? 'Cimangis' : 'Pekapuran'} dapat dilayani.`,
        confidence: 85,
        detectedArea: foundCimangis ? 'Cimangis' : 'Pekapuran',
        suggestions: ['Pastikan alamat berada di wilayah Depok']
      };
    }
  }

  // Check if it's in Depok but not in allowed areas
  if (foundDepok) {
    return {
      isValid: false,
      message: '❌ Maaf, kami hanya melayani area Cimangis, Pekapuran, dan sekitar TB di Depok.',
      confidence: 90,
      suggestions: [
        'Area yang dilayani: Cimangis, Pekapuran, SMK Taruna Bhakti',
        'Pastikan alamat Anda berada di salah satu area tersebut'
      ]
    };
  }

  // Check for common areas outside Depok
  const outsideAreas = [
    'jakarta', 'bogor', 'tangerang', 'bekasi', 'cikarang', 'cibubur',
    'cileungsi', 'citayam', 'bojong gede', 'sawangan', 'cinere', 'lenteng agung'
  ];

  for (const area of outsideAreas) {
    if (normalized.includes(area)) {
      return {
        isValid: false,
        message: `❌ Maaf, area ${area.charAt(0).toUpperCase() + area.slice(1)} belum dapat kami layani.`,
        confidence: 95,
        suggestions: [
          'Kami hanya melayani: Cimangis, Pekapuran, dan area TB di Depok',
          'Hubungi kami untuk informasi pengiriman ke area lain'
        ]
      };
    }
  }

  // Address too short or unclear
  if (normalized.length < 10) {
    return {
      isValid: false,
      message: '⚠️ Alamat terlalu singkat. Mohon lengkapi dengan nama jalan, RT/RW, dan kelurahan.',
      confidence: 50,
      suggestions: [
        'Contoh: Jl. Raya Cimangis No. 123, RT 01/RW 05, Cimangis, Depok',
        'Sertakan nama area: Cimangis, Pekapuran, atau TB'
      ]
    };
  }

  // Default: unclear address
  return {
    isValid: false,
    message: '⚠️ Alamat tidak jelas. Pastikan alamat berada di area Cimangis, Pekapuran, atau TB Depok.',
    confidence: 60,
    suggestions: [
      'Sertakan nama area yang jelas: Cimangis, Pekapuran, atau TB',
      'Contoh: Jl. Raya Cimangis No. 123, Cimangis, Depok',
      'Atau: SMK Taruna Bhakti, Depok'
    ]
  };
}
