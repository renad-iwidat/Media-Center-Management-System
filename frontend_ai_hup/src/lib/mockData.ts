export interface NewsItem {
  id: string;
  title: string;
  content: string;
}

export interface MediaItem {
  id: string;
  title: string;
  type: 'AUDIO' | 'VIDEO';
  url: string;
}

export interface ProgramItem {
  id: string;
  name: string;
  genre: string;
  description: string;
}

export interface GuestItem {
  id: string;
  name: string;
  specialty: string;
  bio: string;
}

export const MOCK_NEWS: NewsItem[] = [
  { id: '1', title: 'ارتفاع أسعار الذهب', content: 'سجلت أسعار الذهب ارتفاعاً ملحوظاً اليوم في الأسواق العالمية بنسبة 2%.' },
  { id: '2', title: 'تطورات الذكاء الاصطناعي', content: 'أعلنت شركات التكنولوجيا عن نماذج جديدة قادرة على فهم اللغات البشرية بدقة غير مسبوقة.' },
  { id: '3', title: 'نتائج دوري الأبطال', content: 'فوز مستحق لنادي ريال مدريد على مانشستر سيتي في ربع نهائي البطولة.' }
];

export const MOCK_MEDIA: MediaItem[] = [
  { id: 'm1', title: 'مقابلة وزير التعليم', type: 'AUDIO', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 'm2', title: 'تغطية مؤتمر المناخ', type: 'VIDEO', url: '#' },
  { id: 'm3', title: 'بودكاست الصباح - الحلقة 5', type: 'AUDIO', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' }
];

export const MOCK_PROGRAMS: ProgramItem[] = [
  { id: 'p1', name: 'نبض الشارع', genre: 'حوار اجتماعي', description: 'برنامج يناقش قضايا المجتمع اليومية.' },
  { id: 'p2', name: 'أفق التكنولوجيا', genre: 'تقني', description: 'استعراض لأحدث الابتكارات في عالم الرقمنة.' },
  { id: 'p3', name: 'ملاعبنا', genre: 'رياضي', description: 'تحليل أسبوعي للدوريات العربية والعالمية.' }
];

export const MOCK_GUESTS: GuestItem[] = [
  { id: 'g1', name: 'د. خليل إبراهيم', specialty: 'اقتصاد كلي', bio: 'خبير اقتصادي ومستشار سابق في البنك الدولي.' },
  { id: 'g2', name: 'م. سارة أحمد', specialty: 'أمن سيبراني', bio: 'باحثة في شؤون الحماية الرقمية والخصوصية.' },
  { id: 'g3', name: 'أ. سامي يوسف', specialty: 'ناقد رياضي', bio: 'صحفي متخصص في تحليل تكتيكات كرة القدم.' }
];
