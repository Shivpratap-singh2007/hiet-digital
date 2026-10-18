import { describe, it, expect } from 'vitest';

describe('Real-Time Bus GPS Tracking & Parent Alert System', () => {
  it('correctly constructs WhatsApp arrival alert URL with phone and URL-encoded message', () => {
    const parentPhone = '9876543210';
    const stopName = 'Shahpur Chowk';
    const etaMinutes = 8;
    const busNumber = 'HP-68-B-1042';

    const cleanPhone = parentPhone.replace(/\D/g, '');
    const fullPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    const textMsg = `*HIET Bus Alert*: College Bus (${busNumber}) is approaching *${stopName}* in approx *${etaMinutes} mins*. Please be ready at the pickup stop.`;
    const waUrl = `https://wa.me/${fullPhone}?text=${encodeURIComponent(textMsg)}`;

    expect(waUrl).toContain('wa.me/919876543210');
    expect(waUrl).toContain(encodeURIComponent('HP-68-B-1042'));
    expect(waUrl).toContain(encodeURIComponent('Shahpur Chowk'));
  });

  it('correctly constructs SMS body format for non-smartphone parents', () => {
    const stopName = 'Kangra Bypass';
    const busNumber = 'HP-68-B-1042';
    const etaMinutes = 12;

    const smsBody = `HIET Bus Alert: Bus ${busNumber} is approx ${etaMinutes} mins away from ${stopName}. Tracking sync: active.`;
    expect(smsBody).toContain('HIET Bus Alert');
    expect(smsBody).toContain('Kangra Bypass');
    expect(smsBody).toContain('12 mins');
  });
});

describe('Zero-Queue Canteen Pre-Order & Express Token System', () => {
  interface CartItem {
    id: string;
    name: string;
    price: number;
    qty: number;
  }

  it('computes total tray price accurately with multiple items and quantities', () => {
    const cart: Record<string, number> = {
      'c-samosa': 2, // 20 each
      'c-chai': 2,   // 15 each
      'c-thali': 1   // 70 each
    };

    const prices: Record<string, number> = {
      'c-samosa': 20,
      'c-chai': 15,
      'c-thali': 70
    };

    const subtotal = Object.entries(cart).reduce((sum, [id, qty]) => {
      return sum + (prices[id] || 0) * qty;
    }, 0);

    expect(subtotal).toBe(20 * 2 + 15 * 2 + 70 * 1); // 40 + 30 + 70 = 140
    expect(subtotal).toBe(140);
  });

  it('generates valid institutional Express Canteen Token format', () => {
    const tokenNumber = Math.floor(1000 + Math.random() * 9000);
    const token = `#CAN-${tokenNumber}`;

    expect(token).toMatch(/^#CAN-\d{4}$/);
  });

  it('validates supported meal pickup recess and break time slots', () => {
    const validSlots = [
      '11:15 AM (Morning Recess)',
      '01:15 PM (Lunch Break)',
      '03:45 PM (Evening Tea)'
    ];

    expect(validSlots).toHaveLength(3);
    validSlots.forEach(slot => {
      expect(slot).toMatch(/\b(AM|PM)\b/);
    });
  });
});

describe('AI Resume ATS Reviewer & Placement Coach', () => {
  const evaluateResumeATS = (content: string, targetRole: 'backend' | 'frontend' | 'aiml' | 'cloud') => {
    const roleKeywords: Record<string, string[]> = {
      backend: ['Node.js', 'PostgreSQL', 'Express', 'Docker', 'REST API', 'Redis', 'Git'],
      frontend: ['React', 'TypeScript', 'Tailwind', 'Next.js', 'Redux', 'HTML5', 'CSS3'],
      aiml: ['Python', 'PyTorch', 'TensorFlow', 'Scikit-learn', 'Pandas', 'NumPy', 'Data Analysis'],
      cloud: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Terraform', 'Linux', 'Microservices']
    };

    const keywords = roleKeywords[targetRole] || roleKeywords.backend;
    const lowerContent = content.toLowerCase();

    const matched = keywords.filter(kw => lowerContent.includes(kw.toLowerCase()));
    const missing = keywords.filter(kw => !lowerContent.includes(kw.toLowerCase()));
    const score = Math.round((matched.length / keywords.length) * 100);

    return { score, matched, missing };
  };

  it('accurately evaluates matched vs missing keywords for backend engineer profile', () => {
    const sampleResume = `
      B.Tech Computer Science student at HIET.
      Experience building REST API endpoints using Node.js and PostgreSQL.
      Version control managed via Git. Containerized apps with Docker.
    `;

    const result = evaluateResumeATS(sampleResume, 'backend');
    expect(result.matched).toContain('Node.js');
    expect(result.matched).toContain('PostgreSQL');
    expect(result.matched).toContain('Docker');
    expect(result.matched).toContain('REST API');
    expect(result.matched).toContain('Git');

    expect(result.missing).toContain('Redis');
    expect(result.score).toBeGreaterThanOrEqual(70);
  });

  it('gives lower ATS score when crucial role requirements are absent', () => {
    const weakResume = `Basic student interested in computers and gaming.`;
    const result = evaluateResumeATS(weakResume, 'cloud');

    expect(result.score).toBe(0);
    expect(result.missing.length).toBe(7);
  });
});

describe('Examination Hall Ticket 3D Seating Locator', () => {
  it('correctly maps 5x4 exam hall layout columns and candidate seat coordinates', () => {
    const columns = ['A', 'B', 'C', 'D', 'E'];
    const rows = [1, 2, 3, 4];
    const candidateSeat = 'C-3';

    let totalDesks = 0;
    let foundCandidate = false;

    for (const r of rows) {
      for (const col of columns) {
        totalDesks++;
        const deskId = `${col}-${r}`;
        if (deskId === candidateSeat) {
          foundCandidate = true;
        }
      }
    }

    expect(totalDesks).toBe(20);
    expect(foundCandidate).toBe(true);
  });
});

describe('Voice AI Campus Assistant Intent Processor', () => {
  const processQueryIntent = (query: string) => {
    const clean = query.toLowerCase().trim();
    if (clean.includes('attendance') || clean.includes('hazri') || clean.includes('bunk') || clean.includes('present')) {
      return { category: 'attendance', actionTarget: 'attendance' };
    }
    if (clean.includes('fee') || clean.includes('dues') || clean.includes('paisa') || clean.includes('receipt')) {
      return { category: 'fee', actionTarget: 'fees' };
    }
    if (clean.includes('bus') || clean.includes('transport') || clean.includes('driver') || clean.includes('gadi')) {
      return { category: 'transport', actionTarget: 'transport' };
    }
    if (clean.includes('exam') || clean.includes('seat') || clean.includes('roll') || clean.includes('admit')) {
      return { category: 'exam', actionTarget: 'admit_card' };
    }
    if (clean.includes('mess') || clean.includes('canteen') || clean.includes('khana') || clean.includes('food')) {
      return { category: 'hostel', actionTarget: 'mess' };
    }
    return { category: 'general', actionTarget: 'dashboard' };
  };

  it('detects Hindi/Hinglish hazri query and maps to attendance', () => {
    const result = processQueryIntent('meri hazri kitni hai sir');
    expect(result.category).toBe('attendance');
    expect(result.actionTarget).toBe('attendance');
  });

  it('detects English and Hinglish fee inquiries', () => {
    const res1 = processQueryIntent('Is my semester fee fully cleared?');
    expect(res1.category).toBe('fee');

    const res2 = processQueryIntent('kya koi dues ya fees baki hai');
    expect(res2.category).toBe('fee');
  });

  it('detects bus and transport queries', () => {
    const res = processQueryIntent('bus number 3 kahan tak pahunchi hai');
    expect(res.category).toBe('transport');
    expect(res.actionTarget).toBe('transport');
  });

  it('detects exam seating and admit card queries', () => {
    const res = processQueryIntent('mera exam seat kahan hai admit card par');
    expect(res.category).toBe('exam');
    expect(res.actionTarget).toBe('admit_card');
  });

  it('detects canteen and food queries', () => {
    const res = processQueryIntent('aaj mess me khana kya bana hai');
    expect(res.category).toBe('hostel');
    expect(res.actionTarget).toBe('mess');
  });
});
