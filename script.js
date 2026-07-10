// ─── Theme ───
function toggleTheme() {
    document.body.classList.toggle('dark');
    localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
}
if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark');

// ─── Search ───
let searchIndex = null;
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
let selectedIndex = -1;

function loadSearchIndex() {
    if (searchIndex !== null) return;
    searchIndex = [];
    fetch('search-index.json?v=20260710b')
        .then(r => r.json())
        .then(data => { searchIndex = data; })
        .catch(() => { searchIndex = []; });
}

// 懒加载：首次聚焦时才请求
searchInput.addEventListener('focus', loadSearchIndex, { once: true });

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function highlightMatch(text, query) {
    if (!query) return escapeHtml(text);
    const escaped = escapeHtml(text);
    const idx = escaped.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return escaped;
    return escaped.substring(0, idx) +
        '<mark>' + escaped.substring(idx, idx + query.length) + '</mark>' +
        escaped.substring(idx + query.length);
}

searchInput.addEventListener('input', function() {
    const q = this.value.trim().toLowerCase();
    selectedIndex = -1;
    if (q.length < 2 || !searchIndex) { searchResults.classList.remove('visible'); return; }
    const matches = searchIndex.filter(e =>
        e.title.toLowerCase().includes(q) || e.excerpt.toLowerCase().includes(q)
    ).slice(0, 15);
    if (matches.length === 0) { searchResults.classList.remove('visible'); return; }
    searchResults.innerHTML = matches.map((m, i) => {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        item.dataset.index = i;
        item.dataset.href = m.path;
        item.innerHTML =
            '<div class="sr-title">' + highlightMatch(m.title, q) + '</div>' +
            '<div class="sr-excerpt">' + highlightMatch(m.excerpt.substring(0, 80), q) + '\u2026</div>';
        return item.outerHTML;
    }).join('');

    searchResults.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', function() {
            window.location = this.dataset.href;
        });
    });
    searchResults.classList.add('visible');
});

// 键盘导航
searchInput.addEventListener('keydown', function(e) {
    const items = searchResults.querySelectorAll('.search-result-item');
    if (!items.length || !searchResults.classList.contains('visible')) return;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
        updateSelected(items);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
        updateSelected(items);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        window.location = items[selectedIndex].dataset.href;
    } else if (e.key === 'Escape') {
        searchResults.classList.remove('visible');
        selectedIndex = -1;
    }
});

function updateSelected(items) {
    items.forEach((item, i) => {
        item.classList.toggle('selected', i === selectedIndex);
        if (i === selectedIndex) item.scrollIntoView({ block: 'nearest' });
    });
}

document.addEventListener('click', e => {
    if (!e.target.closest('.search-box')) {
        searchResults.classList.remove('visible');
        selectedIndex = -1;
    }
});

// ─── Sidebar toggle on mobile ───
document.addEventListener('click', e => {
    const sidebar = document.getElementById('sidebar');
    if (sidebar.classList.contains('open') && !e.target.closest('.sidebar') && !e.target.closest('.menu-toggle')) {
        sidebar.classList.remove('open');
    }
});

// ─── Sidebar collapse with aria ───
document.querySelectorAll('.nav-section-title').forEach(title => {
    const list = title.nextElementSibling;
    if (list) {
        title.setAttribute('role', 'button');
        title.setAttribute('aria-expanded', !list.classList.contains('collapsed'));
        title.addEventListener('click', function() {
            list.classList.toggle('collapsed');
            this.setAttribute('aria-expanded', !list.classList.contains('collapsed'));
        });
    }
});

// ─── Back to top ───
(function() {
    const btn = document.createElement('button');
    btn.className = 'back-to-top';
    btn.setAttribute('aria-label', '回到顶部');
    btn.innerHTML = '\u2191';
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    document.body.appendChild(btn);

    window.addEventListener('scroll', () => {
        btn.classList.toggle('visible', window.scrollY > 300);
    }, { passive: true });
})();

// ─── Page navigation (prev/next volume) ───
(function() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    const allLinks = Array.from(sidebar.querySelectorAll('.nav-items li a'));
    const activeLink = allLinks.find(a => a.classList.contains('active'));
    if (!activeLink) return;

    const activeIndex = allLinks.indexOf(activeLink);
    const prev = activeIndex > 0 ? allLinks[activeIndex - 1] : null;
    const next = activeIndex < allLinks.length - 1 ? allLinks[activeIndex + 1] : null;

    if (!prev && !next) return;

    const nav = document.createElement('div');
    nav.className = 'page-nav';

    if (prev) {
        const a = document.createElement('a');
        a.href = prev.href;
        a.textContent = '\u2190 ' + prev.textContent;
        nav.appendChild(a);
    } else {
        const span = document.createElement('span');
        span.className = 'placeholder';
        span.textContent = '-';
        nav.appendChild(span);
    }

    if (next) {
        const a = document.createElement('a');
        a.href = next.href;
        a.textContent = next.textContent + ' \u2192';
        nav.appendChild(a);
    } else {
        const span = document.createElement('span');
        span.className = 'placeholder';
        span.textContent = '-';
        nav.appendChild(span);
    }

    const content = document.querySelector('.content');
    if (content) content.appendChild(nav);
})();
