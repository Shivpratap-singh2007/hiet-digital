// =============================================================================
// HIET DIGITAL CAMPUS — CAMPUS LIFE & ACCOUNTS MASTER SEED DATA
// Himachal Institute of Engineering & Technology, Shahpur (Kangra)
// =============================================================================

import {
  StudentFeeRecord,
  LibraryBook,
  BorrowedBookRecord,
  BusRoute,
  MessDayMenu,
  MessFeedbackRecord,
  PlacementDrive,
  AlumniProfile,
  CampusEmergencyContact,
  DispensaryVisit,
  HptuInternalScore
} from '../types';

export const INITIAL_FEE_RECORDS: StudentFeeRecord[] = [
  {
    id: 'fee-rec-001',
    receipt_no: 'HIET/REC/2025-26/0418',
    student_id: 'prof-std-cse-001',
    student_roll: '26CSE001',
    student_name: 'Aarav Sharma',
    semester: 6,
    academic_year: '2025-2026',
    total_amount: 52000,
    paid_amount: 52000,
    due_amount: 0,
    payment_status: 'paid',
    payment_mode: 'UPI',
    transaction_ref: 'UPI/524810239412/HDFC',
    payment_date: '2025-08-12',
    breakdown: [
      { head: 'Tuition Fee (Semester 6)', amount: 36000 },
      { head: 'HPTU Examination & University Dues', amount: 3500 },
      { head: 'Laboratory & Internet Infrastructure', amount: 4500 },
      { head: 'Library Resource & Book Bank Fund', amount: 2000 },
      { head: 'Institutional Development & ERP Services', amount: 3500 },
      { head: 'Training, Placement & Industrial Workshop', amount: 2500 }
    ],
    created_at: '2025-08-12T10:30:00Z'
  },
  {
    id: 'fee-rec-002',
    receipt_no: 'HIET/REC/2024-25/0892',
    student_id: 'prof-std-cse-001',
    student_roll: '26CSE001',
    student_name: 'Aarav Sharma',
    semester: 5,
    academic_year: '2024-2025',
    total_amount: 50000,
    paid_amount: 50000,
    due_amount: 0,
    payment_status: 'paid',
    payment_mode: 'Netbanking',
    transaction_ref: 'NEFT/SBI/98314402198',
    payment_date: '2025-01-18',
    breakdown: [
      { head: 'Tuition Fee (Semester 5)', amount: 35000 },
      { head: 'HPTU Examination Fee', amount: 3500 },
      { head: 'Laboratory & Computer Lab Charges', amount: 4500 },
      { head: 'Library Dues', amount: 2000 },
      { head: 'Development Fund', amount: 5000 }
    ],
    created_at: '2025-01-18T14:20:00Z'
  },
  {
    id: 'fee-rec-003',
    receipt_no: 'HIET/REC/2025-26/0425',
    student_id: 'prof-std-ece-001',
    student_roll: '26ECE012',
    student_name: 'Priya Verma',
    semester: 4,
    academic_year: '2025-2026',
    total_amount: 76000,
    paid_amount: 76000,
    due_amount: 0,
    payment_status: 'paid',
    payment_mode: 'UPI',
    transaction_ref: 'UPI/524890112844/ICICI',
    payment_date: '2025-08-14',
    breakdown: [
      { head: 'Tuition Fee (Semester 4)', amount: 36000 },
      { head: 'Hostel Lodging (Block B, Room 204)', amount: 16000 },
      { head: 'Mess Advance Charges (1st Term)', amount: 12000 },
      { head: 'HPTU University & Exam Fee', amount: 3500 },
      { head: 'Electronics Circuit Lab & Kit', amount: 5000 },
      { head: 'Library & Student Welfare Fund', amount: 3500 }
    ],
    created_at: '2025-08-14T11:15:00Z'
  }
];

export const INITIAL_LIBRARY_BOOKS: LibraryBook[] = [
  {
    id: 'lib-bk-001',
    accession_no: 'HIET-LIB-CS-1042',
    title: 'Introduction to Algorithms (4th Edition)',
    author: 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein',
    publisher: 'MIT Press',
    edition: '4th Edition (2022)',
    isbn: '978-0262046305',
    department: 'Computer Science & Engineering',
    category: 'Textbook',
    shelf_location: 'Stack Hall 1 • Rack CS-04',
    total_copies: 12,
    available_copies: 5
  },
  {
    id: 'lib-bk-002',
    accession_no: 'HIET-LIB-CS-2089',
    title: 'Operating System Concepts (Silberschatz)',
    author: 'Abraham Silberschatz, Peter B. Galvin, Greg Gagne',
    publisher: 'Wiley Higher Education',
    edition: '10th Edition',
    isbn: '978-1119456339',
    department: 'Computer Science & Engineering',
    category: 'Textbook',
    shelf_location: 'Stack Hall 1 • Rack CS-08',
    total_copies: 15,
    available_copies: 8
  },
  {
    id: 'lib-bk-003',
    accession_no: 'HIET-LIB-CS-3110',
    title: 'Computer Networks: A Top-Down Approach',
    author: 'James Kurose, Keith Ross',
    publisher: 'Pearson',
    edition: '8th Global Edition',
    isbn: '978-0136681557',
    department: 'Computer Science & Engineering',
    category: 'Textbook',
    shelf_location: 'Stack Hall 1 • Rack CS-11',
    total_copies: 10,
    available_copies: 4
  },
  {
    id: 'lib-bk-004',
    accession_no: 'HIET-LIB-EC-4015',
    title: 'Digital Signal Processing: Principles, Algorithms & Applications',
    author: 'John G. Proakis, Dimitris G. Manolakis',
    publisher: 'Pearson India',
    edition: '4th Edition',
    isbn: '978-8131710005',
    department: 'Electronics & Communication',
    category: 'Textbook',
    shelf_location: 'Stack Hall 2 • Rack EC-03',
    total_copies: 8,
    available_copies: 3
  },
  {
    id: 'lib-bk-005',
    accession_no: 'HIET-LIB-AS-5501',
    title: 'Higher Engineering Mathematics',
    author: 'Dr. B.S. Grewal',
    publisher: 'Khanna Publishers',
    edition: '44th Edition',
    isbn: '978-8193328491',
    department: 'Applied Sciences & Humanities',
    category: 'Reference',
    shelf_location: 'Reference Section • Rack M-01',
    total_copies: 25,
    available_copies: 14
  },
  {
    id: 'lib-bk-006',
    accession_no: 'HIET-LIB-AI-6020',
    title: 'Artificial Intelligence: A Modern Approach',
    author: 'Stuart Russell, Peter Norvig',
    publisher: 'Pearson',
    edition: '4th Edition',
    isbn: '978-0134610993',
    department: 'Computer Science & Engineering',
    category: 'Reference',
    shelf_location: 'Stack Hall 1 • Rack AI-01',
    total_copies: 6,
    available_copies: 2
  }
];

export const INITIAL_BORROWED_BOOKS: BorrowedBookRecord[] = [
  {
    id: 'borrow-rec-001',
    book_id: 'lib-bk-001',
    book_title: 'Introduction to Algorithms (4th Edition)',
    accession_no: 'HIET-LIB-CS-1042',
    student_id: 'prof-std-cse-001',
    issue_date: '2026-10-05',
    due_date: '2026-10-26',
    status: 'issued',
    fine_amount: 0,
    renew_count: 0
  },
  {
    id: 'borrow-rec-002',
    book_id: 'lib-bk-002',
    book_title: 'Operating System Concepts (Silberschatz)',
    accession_no: 'HIET-LIB-CS-2089',
    student_id: 'prof-std-cse-001',
    issue_date: '2026-09-20',
    due_date: '2026-10-11',
    status: 'overdue',
    fine_amount: 35,
    renew_count: 1
  }
];

export const INITIAL_BUS_ROUTES: BusRoute[] = [
  {
    id: 'bus-rt-01',
    route_number: 'Route 1',
    route_name: 'Dharamshala — Kangra Bypass — Gaggal — Shahpur',
    origin: 'Dharamshala Kotwali Bazar',
    destination: 'HIET Shahpur Campus',
    bus_number: 'HP-68-A-1240 (Tata Marcopolo 52 Seater)',
    driver_name: 'Sh. Ramesh Kumar',
    driver_phone: '+91 98160 22345',
    conductor_name: 'Sh. Sanjeev Singh',
    conductor_phone: '+91 94180 11982',
    capacity: 52,
    current_status: 'on_route',
    stops: [
      { stop_name: 'Kotwali Bazar, Dharamshala', morning_pickup_time: '07:30 AM', evening_drop_time: '05:40 PM', landmark: 'Near Main Post Office' },
      { stop_name: 'Kachehri Adda, Dharamshala', morning_pickup_time: '07:38 AM', evening_drop_time: '05:32 PM', landmark: 'DC Office Complex' },
      { stop_name: 'Kangra Bypass (Mandi Adda)', morning_pickup_time: '07:55 AM', evening_drop_time: '05:15 PM', landmark: 'Bypass Flyover' },
      { stop_name: 'Gaggal Airport Chowk', morning_pickup_time: '08:12 AM', evening_drop_time: '04:58 PM', landmark: 'Opposite State Bank' },
      { stop_name: 'Ichhi Mod', morning_pickup_time: '08:22 AM', evening_drop_time: '04:48 PM', landmark: 'Near Petrol Pump' },
      { stop_name: 'Shahpur Main Market', morning_pickup_time: '08:35 AM', evening_drop_time: '04:35 PM', landmark: 'Sub-Divisional Hospital' },
      { stop_name: 'HIET Campus Gate 1', morning_pickup_time: '08:45 AM', evening_drop_time: '04:30 PM', landmark: 'Academic Block Porch' }
    ]
  },
  {
    id: 'bus-rt-02',
    route_number: 'Route 2',
    route_name: 'Palampur — Maranda — Nagrota Bagwan — Shahpur',
    origin: 'Palampur ISBT',
    destination: 'HIET Shahpur Campus',
    bus_number: 'HP-68-B-3312 (Ashok Leyland 48 Seater)',
    driver_name: 'Sh. Suresh Sharma',
    driver_phone: '+91 98160 55678',
    capacity: 48,
    current_status: 'scheduled',
    stops: [
      { stop_name: 'Palampur Main Bus Stand', morning_pickup_time: '07:15 AM', evening_drop_time: '05:55 PM', landmark: 'Platform 3' },
      { stop_name: 'Maranda Railway Crossing', morning_pickup_time: '07:25 AM', evening_drop_time: '05:45 PM', landmark: 'Near Shiv Temple' },
      { stop_name: 'Nagrota Bagwan Adda', morning_pickup_time: '07:50 AM', evening_drop_time: '05:20 PM', landmark: 'Near Degree College' },
      { stop_name: 'Malan Chowk', morning_pickup_time: '08:05 AM', evening_drop_time: '05:05 PM', landmark: 'Malan Bridge' },
      { stop_name: 'HIET Shahpur Campus', morning_pickup_time: '08:45 AM', evening_drop_time: '04:30 PM', landmark: 'Main Campus Terminal' }
    ]
  },
  {
    id: 'bus-rt-03',
    route_number: 'Route 3',
    route_name: 'Pathankot — Damtal — Nurpur — Kotla — Shahpur',
    origin: 'Pathankot Maharana Pratap Stand',
    destination: 'HIET Shahpur Campus',
    bus_number: 'HP-68-C-5589 (Eicher Skyline Pro)',
    driver_name: 'Sh. Kuldeep Singh',
    driver_phone: '+91 98160 99123',
    capacity: 42,
    current_status: 'on_route',
    stops: [
      { stop_name: 'Pathankot Bus Stand', morning_pickup_time: '07:10 AM', evening_drop_time: '06:05 PM', landmark: 'Exit Gate' },
      { stop_name: 'Damtal Temple Chowk', morning_pickup_time: '07:22 AM', evening_drop_time: '05:50 PM', landmark: 'NH-154 Junction' },
      { stop_name: 'Nurpur City (Jassur)', morning_pickup_time: '07:45 AM', evening_drop_time: '05:28 PM', landmark: 'Bhadwar Chowk' },
      { stop_name: 'Kotla Bridge Adda', morning_pickup_time: '08:15 AM', evening_drop_time: '04:55 PM', landmark: 'Police Post' },
      { stop_name: 'HIET Shahpur Campus', morning_pickup_time: '08:42 AM', evening_drop_time: '04:30 PM', landmark: 'Gate 2 Security' }
    ]
  },
  {
    id: 'bus-rt-04',
    route_number: 'Route 4',
    route_name: 'Chamba — Sihunta — Shahpur Campus',
    origin: 'Sihunta Chowk',
    destination: 'HIET Shahpur Campus',
    bus_number: 'HP-68-D-8821 (Force Traveller 26 Seater)',
    driver_name: 'Sh. Amar Chand',
    driver_phone: '+91 98160 77441',
    capacity: 26,
    current_status: 'arrived',
    stops: [
      { stop_name: 'Sihunta Main Chowk', morning_pickup_time: '07:35 AM', evening_drop_time: '05:35 PM', landmark: 'Near Bus Stop' },
      { stop_name: 'Lahru Bridge', morning_pickup_time: '07:55 AM', evening_drop_time: '05:15 PM', landmark: 'State Highway Crossing' },
      { stop_name: 'Dhar Kalan Morh', morning_pickup_time: '08:15 AM', evening_drop_time: '04:55 PM', landmark: 'Forest Rest House' },
      { stop_name: 'HIET Shahpur Campus', morning_pickup_time: '08:40 AM', evening_drop_time: '04:30 PM', landmark: 'Campus Parking' }
    ]
  }
];

export const INITIAL_MESS_MENU: MessDayMenu[] = [
  {
    day: 'Monday',
    breakfast: 'Aloo-Pyaaz Paratha, Fresh Curd, Pickle, Butter, Masala Tea / Coffee',
    lunch: 'Himachali Rajma, Steamed Basmati Rice, Boondi Raita, Chapati, Fresh Green Salad',
    snacks: 'Crispy Veg Pakoras, Green Mint Chutney, Adrak Chai',
    dinner: 'Dal Makhani, Paneer Bhurji, Butter Phulka, Jeera Rice, Gulab Jamun',
    special_item: 'Fresh Kangra Curd & Homemade Pickle'
  },
  {
    day: 'Tuesday',
    breakfast: 'Kanda Poha with Peanuts, Sprouted Moong Salad, Boiled Eggs / Milk, Tea',
    lunch: 'Traditional Kadhi Pakora, Jeera Rice, Seasonal Aloo Gobi, Roti, Salad',
    snacks: 'Vegetable Cutlet with Tomato Dip, Hot Coffee',
    dinner: 'Shahi Paneer, Yellow Dal Tadka, Tawa Roti, Peas Pulao, Fruit Custard',
    special_item: 'Pahari Kadhi Pakora'
  },
  {
    day: 'Wednesday',
    breakfast: 'Poori with Masaledar Aloo Bhaji, Sooji Halwa, Sweet Lassi / Tea',
    lunch: 'Amritsari Chole, Jeera Rice, Bhature / Chapati, Onion-Lemon Salad',
    snacks: 'Hot Samosa with Sweet Tamarind & Green Chutney, Masala Chai',
    dinner: 'Mixed Seasonal Vegetable, Arhar Dal Fry, Phulka, Steamed Rice, Ice Cream',
    special_item: 'Desi Ghee Sooji Halwa'
  },
  {
    day: 'Thursday',
    breakfast: 'Bread Butter / Veg Grilled Sandwich, Boiled Egg / Fruit Bowl, Tea / Milk',
    lunch: 'Dal Fry, Baingan Bharta / Bhindi Masala, Tawa Roti, Rice, Cucumber Raita',
    snacks: 'Nutri-Kulcha / Biscuits, Ginger Tea',
    dinner: 'Kashmiri Dum Aloo, Moong Dal Chilka, Butter Roti, Veg Biryani, Sevian Kheer',
    special_item: 'Rich Badam Sevian Kheer'
  },
  {
    day: 'Friday',
    breakfast: 'Stuffed Gobhi Paratha, Mint Raita, Pickle, Hot Bournvita / Tea',
    lunch: 'Kala Chana Curry, Kadi Chawal, Seasonal Green Sabzi, Roti, Papad',
    snacks: 'Mathri / Namakpara with Kangra Special Tea',
    dinner: 'Matar Paneer, Chana Dal Tadka, Soft Phulka, Jeera Rice, Rasgulla',
    special_item: 'Matar Paneer & Hot Rasgulla'
  },
  {
    day: 'Saturday',
    breakfast: 'Steamed Idli, Medu Vada, Coconut Chutney, Hot Sambar, Filter Coffee',
    lunch: 'Special Kangra Madra (Himachali Dham Special), White Rice, Khatta Dal, Salad',
    snacks: 'Crispy French Fries / Masala Corn, Tea',
    dinner: 'Palak Paneer, Masoor Dal, Butter Roti, Steamed Rice, Moong Dal Halwa',
    special_item: 'Authentic Himachali Dham Madra'
  },
  {
    day: 'Sunday',
    breakfast: 'Paneer Kulcha / Chole Poori, Aloo Sabzi, Sweet Lassi, Coffee',
    lunch: 'Chef Special Dum Biryani (Veg/Paneer), Mint Raita, Papad, Chilled Cold Drink',
    snacks: 'Sweet & Salted Cookies, Tea',
    dinner: 'Special Kadai Paneer / Desi Chicken Curry (Non-veg opt-in), Dal Makhani, Naan, Rice, Shahi Tukda',
    special_item: 'Sunday Special Feast & Shahi Tukda'
  }
];

export const INITIAL_MESS_FEEDBACK: MessFeedbackRecord[] = [
  {
    id: 'mess-fb-001',
    student_id: 'prof-std-cse-001',
    student_name: 'Aarav Sharma',
    meal_type: 'Lunch',
    date: '2026-10-18',
    rating: 5,
    hygiene_rating: 5,
    comment: 'Rajma Chawal taste was outstanding today. Served hot and dining hall was very clean.',
    created_at: '2026-10-18T13:45:00Z'
  },
  {
    id: 'mess-fb-002',
    student_id: 'prof-std-ece-001',
    student_name: 'Priya Verma',
    meal_type: 'Breakfast',
    date: '2026-10-18',
    rating: 4,
    hygiene_rating: 5,
    comment: 'Parathas were fresh and crisp. Please ensure butter packets are kept at room temperature.',
    created_at: '2026-10-18T09:10:00Z'
  }
];

export const INITIAL_PLACEMENT_DRIVES: PlacementDrive[] = [
  {
    id: 'place-drv-01',
    company_name: 'Tata Consultancy Services (TCS Digital)',
    company_logo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=120&q=80',
    role: 'System Engineer / Digital Specialist',
    package_lpa: '₹7.50 - 9.00 LPA',
    eligible_branches: ['CSE', 'ECE', 'IT'],
    min_cgpa: 6.8,
    drive_date: '2025-11-20',
    registration_deadline: '2025-11-12',
    job_location: 'Noida / Gurgaon / Bengaluru',
    status: 'upcoming',
    selection_rounds: ['Online Cognitive & Coding Test', 'Technical Interview', 'Managerial & HR Discussion'],
    description: 'TCS Digital hiring for upcoming graduates. Candidates with proficiency in Full Stack Development, Cloud and Data Engineering will be preferred.',
    total_applicants: 64
  },
  {
    id: 'place-drv-02',
    company_name: 'Infosys Limited (Specialist Programmer)',
    company_logo: 'https://images.unsplash.com/photo-1554469384-e58fac16e23a?auto=format&fit=crop&w=120&q=80',
    role: 'Specialist Programmer (Power Programmer)',
    package_lpa: '₹9.50 LPA',
    eligible_branches: ['CSE', 'ECE'],
    min_cgpa: 7.0,
    drive_date: '2025-11-28',
    registration_deadline: '2025-11-18',
    job_location: 'Chandigarh / Bengaluru / Pune',
    status: 'upcoming',
    selection_rounds: ['Advanced Competitive Coding', 'Technical System Architecture', 'HR'],
    description: 'High-package Specialist Programmer track. Requires strong data structures, algorithms and system design problem-solving.',
    total_applicants: 42
  },
  {
    id: 'place-drv-03',
    company_name: 'Capgemini Technology Services',
    company_logo: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=120&q=80',
    role: 'Senior Software Analyst',
    package_lpa: '₹5.50 - 6.25 LPA',
    eligible_branches: ['CSE', 'ECE', 'Mechanical', 'Civil'],
    min_cgpa: 6.0,
    drive_date: '2025-12-05',
    registration_deadline: '2025-11-25',
    job_location: 'Noida / Hyderabad',
    status: 'upcoming',
    selection_rounds: ['Game-based Aptitude Assessment', 'Coding Test', 'Technical & HR Combined'],
    description: 'Mass hiring pool drive open to all engineering disciplines with basic programming aptitude.',
    total_applicants: 88
  },
  {
    id: 'place-drv-04',
    company_name: 'L&T Technology Services (LTTS)',
    company_logo: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=120&q=80',
    role: 'Graduate Engineer Trainee (GET)',
    package_lpa: '₹6.00 LPA',
    eligible_branches: ['ECE', 'Mechanical', 'Civil'],
    min_cgpa: 6.5,
    drive_date: '2025-12-12',
    registration_deadline: '2025-12-01',
    job_location: 'Vadodara / Chennai / Delhi NCR',
    status: 'upcoming',
    selection_rounds: ['Core Engineering Aptitude', 'Technical Core Viva', 'HR Round'],
    description: 'Premier engineering design and industrial IoT solutions provider hiring core mechanical, civil and electronics engineers.',
    total_applicants: 35
  }
];

export const INITIAL_ALUMNI_PROFILES: AlumniProfile[] = [
  {
    id: 'alum-001',
    name: 'Er. Rohit Katoch',
    batch_year: 'Batch of 2021',
    branch: 'Computer Science & Engineering',
    current_company: 'Microsoft Corporation',
    designation: 'Senior Software Engineer (Azure Core)',
    location: 'Noida, India / Redmond, WA',
    linkedin_url: 'https://linkedin.com/in/example-rohit',
    available_for_mentorship: true,
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'alum-002',
    name: 'Er. Ankita Sharma',
    batch_year: 'Batch of 2022',
    branch: 'Electronics & Communication',
    current_company: 'Qualcomm India',
    designation: 'Senior Silicon Validation Engineer',
    location: 'Bengaluru, Karnataka',
    linkedin_url: 'https://linkedin.com/in/example-ankita',
    available_for_mentorship: true,
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'alum-003',
    name: 'Er. Sahil Guleria',
    batch_year: 'Batch of 2020',
    branch: 'Civil Engineering',
    current_company: 'HP Public Works Department (HPPWD)',
    designation: 'Assistant Engineer (Civil)',
    location: 'Dharamshala, H.P.',
    linkedin_url: 'https://linkedin.com/in/example-sahil',
    available_for_mentorship: true,
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'alum-004',
    name: 'Er. Vikas Dhiman',
    batch_year: 'Batch of 2023',
    branch: 'Computer Science & Engineering',
    current_company: 'Amazon Web Services (AWS)',
    designation: 'Software Development Engineer II',
    location: 'Hyderabad, Telangana',
    linkedin_url: 'https://linkedin.com/in/example-vikas',
    available_for_mentorship: true,
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'alum-005',
    name: 'Er. Meenakshi Thakur',
    batch_year: 'Batch of 2022',
    branch: 'Computer Science & Engineering',
    current_company: 'Google Cloud Platform',
    designation: 'Data Solutions Engineer',
    location: 'Bengaluru, Karnataka',
    linkedin_url: 'https://linkedin.com/in/example-meenakshi',
    available_for_mentorship: true,
    avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80'
  }
];

// Helper storage keys for persistence
const STORAGE_PREFIX = 'hiet_campus_life_';

export const campusLifeStore = {
  getFeeRecords: (studentRoll?: string): StudentFeeRecord[] => {
    try {
      const stored = localStorage.getItem(`${STORAGE_PREFIX}fees`);
      const all: StudentFeeRecord[] = stored ? JSON.parse(stored) : INITIAL_FEE_RECORDS;
      if (studentRoll) {
        return all.filter(f => f.student_roll.toLowerCase() === studentRoll.toLowerCase());
      }
      return all;
    } catch {
      return INITIAL_FEE_RECORDS;
    }
  },

  addFeePayment: (record: StudentFeeRecord): void => {
    try {
      const all = campusLifeStore.getFeeRecords();
      const updated = [record, ...all];
      localStorage.setItem(`${STORAGE_PREFIX}fees`, JSON.stringify(updated));
    } catch (e) {
      console.warn('Fee payment save error:', e);
    }
  },

  getLibraryBooks: (): LibraryBook[] => {
    try {
      const stored = localStorage.getItem(`${STORAGE_PREFIX}lib_books`);
      return stored ? JSON.parse(stored) : INITIAL_LIBRARY_BOOKS;
    } catch {
      return INITIAL_LIBRARY_BOOKS;
    }
  },

  getBorrowedBooks: (studentId?: string): BorrowedBookRecord[] => {
    try {
      const stored = localStorage.getItem(`${STORAGE_PREFIX}borrowed_books`);
      const all: BorrowedBookRecord[] = stored ? JSON.parse(stored) : INITIAL_BORROWED_BOOKS;
      if (studentId) {
        return all.filter(b => b.student_id === studentId);
      }
      return all;
    } catch {
      return INITIAL_BORROWED_BOOKS;
    }
  },

  borrowBook: (record: BorrowedBookRecord): void => {
    try {
      const all = campusLifeStore.getBorrowedBooks();
      const updated = [record, ...all];
      localStorage.setItem(`${STORAGE_PREFIX}borrowed_books`, JSON.stringify(updated));
    } catch (e) {
      console.warn('Book issue error:', e);
    }
  },

  renewBook: (recordId: string): void => {
    try {
      const all = campusLifeStore.getBorrowedBooks();
      const updated = all.map(b => {
        if (b.id === recordId) {
          const due = new Date(b.due_date);
          due.setDate(due.getDate() + 14);
          return {
            ...b,
            due_date: due.toISOString().split('T')[0],
            renew_count: b.renew_count + 1,
            status: 'issued' as const,
            fine_amount: 0
          };
        }
        return b;
      });
      localStorage.setItem(`${STORAGE_PREFIX}borrowed_books`, JSON.stringify(updated));
    } catch (e) {
      console.warn('Renew book error:', e);
    }
  },

  getBusRoutes: (): BusRoute[] => {
    try {
      const stored = localStorage.getItem(`${STORAGE_PREFIX}bus_routes`);
      return stored ? JSON.parse(stored) : INITIAL_BUS_ROUTES;
    } catch {
      return INITIAL_BUS_ROUTES;
    }
  },

  getMessMenu: (): MessDayMenu[] => {
    return INITIAL_MESS_MENU;
  },

  getMessFeedback: (): MessFeedbackRecord[] => {
    try {
      const stored = localStorage.getItem(`${STORAGE_PREFIX}mess_feedback`);
      return stored ? JSON.parse(stored) : INITIAL_MESS_FEEDBACK;
    } catch {
      return INITIAL_MESS_FEEDBACK;
    }
  },

  addMessFeedback: (record: MessFeedbackRecord): void => {
    try {
      const all = campusLifeStore.getMessFeedback();
      const updated = [record, ...all];
      localStorage.setItem(`${STORAGE_PREFIX}mess_feedback`, JSON.stringify(updated));
    } catch (e) {
      console.warn('Mess feedback save error:', e);
    }
  },

  getPlacementDrives: (): PlacementDrive[] => {
    return INITIAL_PLACEMENT_DRIVES;
  },

  getAlumniProfiles: (): AlumniProfile[] => {
    return INITIAL_ALUMNI_PROFILES;
  },

  getEmergencyContacts: (): CampusEmergencyContact[] => {
    return INITIAL_EMERGENCY_CONTACTS;
  },

  getDispensaryVisits: (studentRoll?: string): DispensaryVisit[] => {
    try {
      const stored = localStorage.getItem(`${STORAGE_PREFIX}dispensary_visits`);
      const all: DispensaryVisit[] = stored ? JSON.parse(stored) : INITIAL_DISPENSARY_VISITS;
      if (!studentRoll) return all;
      return all.filter(v => v.student_roll.toLowerCase() === studentRoll.toLowerCase());
    } catch {
      return INITIAL_DISPENSARY_VISITS;
    }
  },

  addDispensaryVisit: (visit: DispensaryVisit): void => {
    try {
      const all = campusLifeStore.getDispensaryVisits();
      const updated = [visit, ...all];
      localStorage.setItem(`${STORAGE_PREFIX}dispensary_visits`, JSON.stringify(updated));
    } catch (e) {
      console.warn('Dispensary visit save error:', e);
    }
  },

  getHptuInternalScores: (_studentRoll?: string): HptuInternalScore[] => {
    try {
      const stored = localStorage.getItem(`${STORAGE_PREFIX}hptu_internals`);
      return stored ? JSON.parse(stored) : INITIAL_HPTU_INTERNAL_SCORES;
    } catch {
      return INITIAL_HPTU_INTERNAL_SCORES;
    }
  },

  calculateHptuInternal: (
    mst1: number,
    mst2: number,
    assignment: number,
    attendancePct: number
  ): { attendanceMarks: number; totalInternal: number; minPassingTheory: number } => {
    let attendanceMarks = 0;
    if (attendancePct >= 85) attendanceMarks = 5;
    else if (attendancePct >= 80) attendanceMarks = 4;
    else if (attendancePct >= 75) attendanceMarks = 3;
    else attendanceMarks = 0;

    const totalInternal = Math.min(50, Math.round(mst1 + mst2 + assignment + attendanceMarks));
    // HPTU requirement: 40% aggregate in subject (Internal + External >= 40)
    // AND minimum 35% in external theory (out of 60 marks, 35% = 21 marks)
    const neededFor40Aggregate = Math.max(0, 40 - totalInternal);
    const minPassingTheory = Math.max(21, neededFor40Aggregate);

    return {
      attendanceMarks,
      totalInternal,
      minPassingTheory
    };
  }
};

export const INITIAL_EMERGENCY_CONTACTS: CampusEmergencyContact[] = [
  {
    id: 'em-001',
    title: 'Campus 24x7 Ambulance & Emergency First-Aid',
    department: 'Medical Services',
    phone: '+919816054101',
    whatsapp: '+919816054101',
    location: 'Dispensary Block, Ground Floor Admin',
    is_24x7: true,
    priority_level: 'Immediate',
    description: 'Equipped ambulance with oxygen cylinder, stretcher, and on-duty paramedical attendant.'
  },
  {
    id: 'em-002',
    title: 'Main Security Gate & Control Room',
    department: 'Campus Security',
    phone: '+919816054102',
    whatsapp: '+919816054102',
    location: 'Main Gate No. 1 (NH-154 Entry)',
    is_24x7: true,
    priority_level: 'Immediate',
    description: 'Chief security officer desk for campus trespass, fire alarm, or perimeter security.'
  },
  {
    id: 'em-003',
    title: 'Chief Hostel Warden (Hostel Emergencies)',
    department: 'Hostel Affairs',
    phone: '+919816054103',
    whatsapp: '+919816054103',
    location: 'Boys & Girls Hostel Office, Block A',
    is_24x7: true,
    priority_level: 'Urgent',
    description: 'Immediate warden support for hostel illness, power failure, or outpass issues.'
  },
  {
    id: 'em-004',
    title: "Women's Safety & Anti-Harassment Cell",
    department: 'Student Grievance',
    phone: '+919816054104',
    whatsapp: '+919816054104',
    location: 'Academic Block 1, Room 108',
    is_24x7: true,
    priority_level: 'Immediate',
    description: 'Confidential assistance for female students and staff.'
  },
  {
    id: 'em-005',
    title: 'National Anti-Ragging Helpline (UGC/HPTU)',
    department: 'Statutory Body',
    phone: '18001805522',
    location: 'New Delhi / HPTU Hamirpur',
    is_24x7: true,
    priority_level: 'Immediate',
    description: 'Toll-free 24-hour national helpline for anti-ragging complaints.'
  },
  {
    id: 'em-006',
    title: 'Police Station Shahpur',
    department: 'HP Police',
    phone: '01892238120',
    location: 'Shahpur Chowk, Kangra, HP',
    is_24x7: true,
    priority_level: 'Immediate',
    description: 'Jurisdictional police station for emergency civil protection.'
  },
  {
    id: 'em-007',
    title: 'Civil Hospital Shahpur (Emergency & Trauma)',
    department: 'State Health Dept',
    phone: '01892238144',
    location: 'Kangra-Chamba Road, Shahpur',
    is_24x7: true,
    priority_level: 'Immediate',
    description: 'Nearest government trauma and secondary medical care hospital.'
  }
];

export const INITIAL_DISPENSARY_VISITS: DispensaryVisit[] = [
  {
    id: 'disp-001',
    student_id: 'prof-std-cse-001',
    student_roll: '26CSE001',
    student_name: 'Aarav Sharma',
    visit_date: '2026-03-22',
    symptoms: 'High fever (101.4°F), shivering, acute dehydration',
    diagnosis: 'Acute Viral Febrile Illness',
    prescribed_medicines: ['Paracetamol 650mg TDS x 3 days', 'ORS Electral solution', 'Levocetirizine 5mg BD'],
    rest_advised_hours: 24,
    medical_exemption_issued: true,
    attending_doctor: 'Dr. R. K. Sharma (Campus Medical Officer)'
  },
  {
    id: 'disp-002',
    student_id: 'prof-std-cse-001',
    student_roll: '26CSE001',
    student_name: 'Aarav Sharma',
    visit_date: '2026-02-14',
    symptoms: 'Pain and swelling in right ankle after basketball practice',
    diagnosis: 'Grade 1 Lateral Ankle Ligament Strain',
    prescribed_medicines: ['Aceclofenac + Paracetamol BD', 'Thrombophob Gel local application', 'Crepe Bandage support'],
    rest_advised_hours: 48,
    medical_exemption_issued: true,
    attending_doctor: 'Dr. R. K. Sharma (Campus Medical Officer)'
  }
];

export const INITIAL_HPTU_INTERNAL_SCORES: HptuInternalScore[] = [
  {
    subject_code: 'CS-601',
    subject_name: 'Compiler Design & Automata',
    credits: 4,
    mst1_marks: 13,
    mst2_marks: 14,
    assignments_marks: 9,
    attendance_percentage: 86,
    attendance_marks: 5,
    total_internal: 41,
    max_internal: 50,
    min_theory_passing_marks: 21
  },
  {
    subject_code: 'CS-602',
    subject_name: 'Machine Learning & Predictive Modeling',
    credits: 4,
    mst1_marks: 14,
    mst2_marks: 15,
    assignments_marks: 10,
    attendance_percentage: 92,
    attendance_marks: 5,
    total_internal: 44,
    max_internal: 50,
    min_theory_passing_marks: 21
  },
  {
    subject_code: 'CS-603',
    subject_name: 'Cloud Computing & Microservices',
    credits: 3,
    mst1_marks: 12,
    mst2_marks: 13,
    assignments_marks: 8,
    attendance_percentage: 79,
    attendance_marks: 3,
    total_internal: 36,
    max_internal: 50,
    min_theory_passing_marks: 21
  },
  {
    subject_code: 'CS-604',
    subject_name: 'Full Stack Web & Distributed Systems',
    credits: 4,
    mst1_marks: 15,
    mst2_marks: 14,
    assignments_marks: 10,
    attendance_percentage: 94,
    attendance_marks: 5,
    total_internal: 44,
    max_internal: 50,
    min_theory_passing_marks: 21
  },
  {
    subject_code: 'CS-605',
    subject_name: 'Software Testing & Quality Assurance',
    credits: 3,
    mst1_marks: 11,
    mst2_marks: 12,
    assignments_marks: 9,
    attendance_percentage: 82,
    attendance_marks: 4,
    total_internal: 36,
    max_internal: 50,
    min_theory_passing_marks: 21
  }
];

