const revealItems = document.querySelectorAll('.reveal');
const navLinks = document.querySelectorAll('.main-nav a');
const today = document.getElementById('today');
const hero = document.querySelector('.hero');
const articleList = document.getElementById('article-list');
const newsMeta = document.getElementById('news-meta');

const ARTICLE_CACHE_KEY = 'fujiki_articles_cache_v1';
const ARTICLE_CACHE_TTL_MS = 60 * 60 * 1000;
const MAX_ARTICLES = 5;
const RSS_FEEDS = [
  'https://news.google.com/rss/search?q=藤木選手+ミラノ・コルティナ&hl=ja&gl=JP&ceid=JP:ja',
  'https://news.google.com/rss/search?q=藤木選手+松岡修造&hl=ja&gl=JP&ceid=JP:ja',
  'https://news.google.com/rss/search?q=藤木選手+阪南市&hl=ja&gl=JP&ceid=JP:ja'
];

const now = new Date();
if (today) {
  today.textContent = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 更新`;
}

const formatDate = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '日付不明';
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
};

const getSource = (item) => {
  if (item.author && item.author.trim()) return item.author;
  const maybeSource = item.title?.split(' - ').pop();
  return maybeSource || 'ニュースソース';
};

const renderArticles = (items, updatedAt) => {
  if (!articleList || !newsMeta) return;

  if (!items.length) {
    articleList.innerHTML = '<li class="article-loading">関連ニュースが見つかりませんでした。</li>';
    newsMeta.textContent = '更新情報を取得できませんでした。';
    return;
  }

  articleList.innerHTML = items
    .map(
      (item) => `
        <li>
          <a href="${item.link}" target="_blank" rel="noopener noreferrer">${item.title}</a>
          <div class="article-meta">${item.source} | ${formatDate(item.pubDate)}</div>
        </li>
      `
    )
    .join('');

  const updatedText = formatDate(updatedAt);
  newsMeta.textContent = `最終更新: ${updatedText}（約1時間ごとに更新）`;
};

const loadCache = () => {
  try {
    const raw = localStorage.getItem(ARTICLE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed.fetchedAt || !Array.isArray(parsed.items)) return null;
    if (Date.now() - parsed.fetchedAt > ARTICLE_CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
};

const saveCache = (items) => {
  try {
    localStorage.setItem(
      ARTICLE_CACHE_KEY,
      JSON.stringify({
        fetchedAt: Date.now(),
        items
      })
    );
  } catch {
    // Ignore localStorage write failures.
  }
};

const fetchFeed = async (rssUrl) => {
  const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
  const response = await fetch(apiUrl);
  if (!response.ok) return [];
  const data = await response.json();
  if (data.status !== 'ok' || !Array.isArray(data.items)) return [];

  return data.items.map((item) => ({
    title: item.title || 'タイトル不明',
    link: item.link || '#',
    pubDate: item.pubDate || '',
    source: getSource(item)
  }));
};

const fetchArticles = async () => {
  const results = await Promise.allSettled(RSS_FEEDS.map((feed) => fetchFeed(feed)));
  const merged = [];
  const seen = new Set();

  results.forEach((result) => {
    if (result.status !== 'fulfilled') return;
    result.value.forEach((item) => {
      if (!item.link || seen.has(item.link)) return;
      seen.add(item.link);
      merged.push(item);
    });
  });

  return merged
    .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
    .slice(0, MAX_ARTICLES);
};

const refreshArticles = async () => {
  const cached = loadCache();
  if (cached) {
    renderArticles(cached.items, cached.fetchedAt);
    return;
  }

  const articles = await fetchArticles();
  renderArticles(articles, Date.now());
  if (articles.length) {
    saveCache(articles);
  }
};

refreshArticles();
window.setInterval(refreshArticles, ARTICLE_CACHE_TTL_MS);

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('show');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16 }
);

revealItems.forEach((item, i) => {
  item.style.transitionDelay = `${i * 80}ms`;
  revealObserver.observe(item);
});

const sectionMap = [...navLinks]
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

const activeObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = `#${entry.target.id}`;
      navLinks.forEach((link) => {
        link.classList.toggle('active', link.getAttribute('href') === id);
      });
    });
  },
  { threshold: 0.4 }
);

sectionMap.forEach((section) => activeObserver.observe(section));

if (hero) {
  window.addEventListener('mousemove', (event) => {
    const x = (event.clientX / window.innerWidth - 0.5) * 8;
    const y = (event.clientY / window.innerHeight - 0.5) * 8;
    hero.style.transform = `translate(${x * 0.18}px, ${y * 0.18}px)`;
  });
}
