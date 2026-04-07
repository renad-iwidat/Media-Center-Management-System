/**
 * RSS Sources Configuration
 * 
 * يحتوي على قائمة مصادر RSS المختلفة
 * التي سيتم سحب الأخبار منها
 */

export const RSS_SOURCES = [
  {
    name: 'فلسطين إنفو',
    url: 'https://palinfo.com/feed/',
  },
  {
    name: 'عرب 48',
    url: 'https://www.arab48.com/rss',
  },
  {
    name: 'وكالة الصحافة الفلسطينية',
    url: 'https://www.pbc.ps/feed/',
  },
  {
    name: 'شرق الاوسط',
    url: 'https://aawsat.com/feed',
  },
  {
    name: 'BBC عربي',
    url: 'https://feeds.bbci.co.uk/arabic/rss.xml',
  },
  {
    name: 'العالم',
    url: 'https://www.alalam.ir/rss/latest',
  },
];

/**
 * مصادر RSS متنوعة (أخبار متخصصة)
 */
export const RSS_SOURCES_DIVERSE = [
  {
    name: ' الشرق الاوسط - الغذاء',
    url: 'https://aawsat.com/feed/food',
  },
  {
    name: 'الشرق الاوسط - الصحة',
    url: 'https://aawsat.com/feed/health',
  },
  {
    name: 'الشرق الاوسط - العلوم',
    url: 'https://aawsat.com/feed/science',
  },
  
  {
    name: 'BBC عربي - الفن والثقافة',
    url: 'https://www.bbc.com/arabic/artandculture/index.xml',
  },
  {
    name: 'BBC عربي - العلوم والتكنولوجيا',
    url: 'https://www.bbc.com/arabic/scienceandtech/index.xml',
  }

];

export interface RSSSource {
  name: string;
  url: string;
}
