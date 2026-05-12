/* =====================================================
   DSA Codex — script.js  (full feature set)
   dark mode · progress · search · problem status
   code copy/run · TOC · scroll memory · reading time
   notes · focus mode · quiz · visualizer panel
   ===================================================== */

/* ── NAV HEIGHT → CSS CUSTOM PROPERTY (fixes sticky progress strip) ── */
(function () {
  function setNavH() {
    var nav = document.querySelector('nav.topbar');
    if (nav) document.documentElement.style.setProperty('--nav-h', nav.offsetHeight + 'px');
  }
  document.addEventListener('DOMContentLoaded', setNavH);
  window.addEventListener('resize', setNavH, { passive: true });
})();

/* ── DARK MODE ── */
(function () {
  var saved = localStorage.getItem('codex-theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;
    updateBtn(saved);
    btn.addEventListener('click', function () {
      var current = document.documentElement.getAttribute('data-theme');
      var next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('codex-theme', next);
      updateBtn(next);
    });
  });

  function updateBtn(theme) {
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;
    btn.textContent = theme === 'dark' ? '☀' : '◑';
    btn.title = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  }
})();

/* ── SCROLL MEMORY ── */
(function () {
  var page    = location.pathname.split('/').pop() || 'index.html';
  var scrollKey = 'codex-scroll-' + page;
  var restored  = false;

  document.addEventListener('DOMContentLoaded', function () {
    var saved = parseInt(localStorage.getItem(scrollKey) || '0', 10);
    if (saved > 100) {
      setTimeout(function () { window.scrollTo(0, saved); restored = true; }, 80);
    }
  });

  var scrollTimer;
  window.addEventListener('scroll', function () {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(function () {
      localStorage.setItem(scrollKey, Math.round(window.scrollY));
    }, 200);
  }, { passive: true });
})();

/* ── READING TIME ── */
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('section.topic[id]').forEach(function (section) {
      var text  = section.innerText || section.textContent || '';
      var words = text.trim().split(/\s+/).length;
      var mins  = Math.max(1, Math.round(words / 200));
      var badge = document.createElement('span');
      badge.className   = 'read-time';
      badge.textContent = '~' + mins + ' min read';
      var title = section.querySelector('h2.topic-title');
      if (title) title.appendChild(badge);
    });
  });
})();

/* ── PROGRESS TRACKING ── */
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var page  = location.pathname.split('/').pop() || 'index.html';
    var key   = 'codex-progress-' + page;
    var saved = JSON.parse(localStorage.getItem(key) || '{}');
    var sections = document.querySelectorAll('section.topic[id]');

    sections.forEach(function (section) {
      var id    = section.id;
      var title = section.querySelector('h2.topic-title');
      if (!title) return;

      var label = document.createElement('label');
      label.className = 'section-done-label';
      label.innerHTML =
        '<input type="checkbox" class="section-done-cb" data-id="' + id + '"' +
        (saved[id] ? ' checked' : '') + '> <span>Mark complete</span>';
      title.after(label);

      label.querySelector('input').addEventListener('change', function (e) {
        saved[id] = e.target.checked;
        localStorage.setItem(key, JSON.stringify(saved));
        refreshToc(); refreshBar();
      });
    });

    refreshToc(); refreshBar();

    function refreshToc() {
      document.querySelectorAll('.toc ol li').forEach(function (li) {
        var a = li.querySelector('a');
        if (!a) return;
        li.classList.toggle('toc-done', !!saved[(a.getAttribute('href') || '').replace('#', '')]);
      });
    }
    function refreshBar() {
      var total = sections.length;
      if (!total) return;
      var done = Array.from(sections).filter(function (s) { return saved[s.id]; }).length;
      var fill = document.getElementById('progress-bar-fill');
      var lbl  = document.getElementById('progress-label');
      if (fill) fill.style.width = (done / total * 100) + '%';
      if (lbl)  lbl.textContent  = done + ' / ' + total + ' sections complete';
    }
  });
})();

/* ── PERSONAL NOTES ── */
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var page = location.pathname.split('/').pop() || 'index.html';

    document.querySelectorAll('section.topic[id]').forEach(function (section) {
      var id  = section.id;
      var key = 'codex-note-' + page + '-' + id;

      var wrap = document.createElement('div');
      wrap.className = 'note-wrap';

      var toggle = document.createElement('button');
      toggle.className = 'note-toggle';
      toggle.innerHTML = '✎ My notes';

      var area = document.createElement('div');
      area.className = 'note-area';

      var ta = document.createElement('textarea');
      ta.className   = 'note-ta';
      ta.placeholder = 'Your notes for this section… (auto-saved)';
      ta.value       = localStorage.getItem(key) || '';
      ta.rows        = 4;

      var saveIndicator = document.createElement('span');
      saveIndicator.className = 'note-saved';
      saveIndicator.textContent = '';

      area.appendChild(ta);
      area.appendChild(saveIndicator);
      wrap.appendChild(toggle);
      wrap.appendChild(area);

      var ref = section.querySelector('.cross-links') || section.querySelector('.problems') || null;
      if (ref) section.insertBefore(wrap, ref);
      else section.appendChild(wrap);

      toggle.addEventListener('click', function () {
        wrap.classList.toggle('note-open');
        if (wrap.classList.contains('note-open')) setTimeout(function () { ta.focus(); }, 50);
      });

      var saveTimer;
      ta.addEventListener('input', function () {
        clearTimeout(saveTimer);
        saveIndicator.textContent = '';
        saveTimer = setTimeout(function () {
          localStorage.setItem(key, ta.value);
          saveIndicator.textContent = 'saved ✓';
          setTimeout(function () { saveIndicator.textContent = ''; }, 1500);
        }, 600);
      });
    });
  });
})();

/* ── FOCUS MODE ── */
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('focus-btn');
    if (!btn) return;
    var active = false;

    /* Standalone floating exit button — lives on <body>, not inside nav,
       so it stays visible even when the nav is hidden. */
    var floatBtn = document.createElement('button');
    floatBtn.id        = 'focus-exit-float';
    floatBtn.textContent = '⊠';
    floatBtn.title     = 'Exit focus mode';
    floatBtn.style.display = 'none';
    document.body.appendChild(floatBtn);

    floatBtn.addEventListener('click', function () { setActive(false); });
    btn.addEventListener('click', function () { setActive(!active); });

    if (localStorage.getItem('codex-focus') === '1') setActive(true);

    function setActive(val) {
      active = val;
      document.body.classList.toggle('focus-mode', active);
      btn.textContent    = active ? '⊠' : '⊡';
      btn.title          = active ? 'Exit focus mode' : 'Distraction-free reading';
      floatBtn.style.display = active ? 'flex' : 'none';
      localStorage.setItem('codex-focus', active ? '1' : '0');
    }
  });
})();

/* ── PROBLEM STATUS TRACKER ── */
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var storeKey = 'codex-problems';
    var saved    = JSON.parse(localStorage.getItem(storeKey) || '{}');

    document.querySelectorAll('.problem-card').forEach(function (card) {
      var href   = card.getAttribute('href') || '';
      var status = saved[href] || 'none';
      var wrap   = document.createElement('div');
      wrap.className = 'pc-status-wrap';
      var btn = document.createElement('button');
      btn.className = 'pc-status-btn';
      btn.title = 'Track: none → attempted → solved → none';
      btn.setAttribute('data-status', status);
      btn.innerHTML = statusIcon(status);
      wrap.appendChild(btn);
      card.appendChild(wrap);
      applyStatus(card, status);

      btn.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        var next = btn.getAttribute('data-status') === 'none' ? 'attempted'
                 : btn.getAttribute('data-status') === 'attempted' ? 'solved' : 'none';
        btn.setAttribute('data-status', next);
        btn.innerHTML = statusIcon(next);
        saved[href] = next;
        localStorage.setItem(storeKey, JSON.stringify(saved));
        applyStatus(card, next);
      });
    });

    function statusIcon(s) {
      if (s === 'solved')    return '<span class="psi-solved">✓</span>';
      if (s === 'attempted') return '<span class="psi-attempted">~</span>';
      return '<span class="psi-none">○</span>';
    }
    function applyStatus(card, s) {
      card.classList.remove('status-solved', 'status-attempted');
      if (s === 'solved')    card.classList.add('status-solved');
      if (s === 'attempted') card.classList.add('status-attempted');
    }
  });
})();

/* ── CODE COPY + RUN BUTTONS ── */
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.code-block').forEach(function (block) {
      var toolbar = document.createElement('div');
      toolbar.className = 'code-toolbar';
      var copyBtn = document.createElement('button');
      copyBtn.className = 'code-btn'; copyBtn.textContent = 'Copy';
      copyBtn.addEventListener('click', function () {
        var codeEl = block.querySelector('pre code') || block.querySelector('pre');
        navigator.clipboard.writeText(codeEl ? codeEl.innerText : '').then(function () {
          copyBtn.textContent = 'Copied!';
          setTimeout(function () { copyBtn.textContent = 'Copy'; }, 2000);
        });
      });
      var runBtn = document.createElement('button');
      runBtn.className = 'code-btn code-btn-run'; runBtn.textContent = '▶ Run';
      runBtn.title = 'Open in Java playground';
      runBtn.addEventListener('click', function () {
        var codeEl = block.querySelector('pre code') || block.querySelector('pre');
        window.open('https://onecompiler.com/java?code=' + encodeURIComponent(codeEl ? codeEl.innerText : ''), '_blank', 'noopener');
      });
      toolbar.appendChild(copyBtn); toolbar.appendChild(runBtn);
      block.insertBefore(toolbar, block.firstChild);
    });
  });
})();

/* ── QUIZ ── */
(function () {
  var quizData = {
    /* Complexity */
    'why':        [{ q:'What does Big-O measure?', opts:['Exact ms runtime','How runtime grows with n','Memory only','Best-case speed'], ans:1 },
                   { q:'Both algorithms find the answer. Complexity asks:', opts:['Which is shorter','Which grows slower','Which uses less RAM','Which compiles faster'], ans:1 }],
    'bigO':       [{ q:'3n² + 5n + 100 simplifies to:', opts:['O(3n²)','O(5n)','O(n²)','O(100)'], ans:2 },
                   { q:'Big-O describes the:', opts:['Lower bound','Tight bound','Upper bound (worst case)','Average case'], ans:2 }],
    'measuring':  [{ q:'A single loop over n items is:', opts:['O(1)','O(log n)','O(n)','O(n²)'], ans:2 },
                   { q:'Two nested loops over n are:', opts:['O(n)','O(n log n)','O(n²)','O(2n)'], ans:2 },
                   { q:'Binary search (halving) is:', opts:['O(1)','O(log n)','O(n)','O(n/2)'], ans:1 }],
    'growth':     [{ q:'Fastest complexity class:', opts:['O(n log n)','O(log n)','O(n)','O(1)'], ans:3 },
                   { q:'Acceptable for n = 10,000:', opts:['O(n!)','O(2ⁿ)','O(n²)','O(n³)'], ans:2 }],
    'space':      [{ q:'Space complexity counts:', opts:['Total RAM','Auxiliary memory beyond input','Input size','Stack limit'], ans:1 },
                   { q:'Two pointers through an array — space is:', opts:['O(n)','O(log n)','O(1)','O(n²)'], ans:2 }],
    'amortized':  [{ q:'ArrayList.add() is amortized O(1) because:', opts:['It never copies','Rare resize cost averages out','Java optimizes it','Arrays are always O(1)'], ans:1 },
                   { q:'HashMap lookup "O(1)" means:', opts:['Exactly 1 op','Worst-case O(1)','Average case O(1) with good hash','O(log n) amortized'], ans:2 }],
    'table':      [{ q:'LinkedList search is:', opts:['O(1)','O(log n)','O(n)','O(n²)'], ans:2 },
                   { q:'TreeMap lookup is:', opts:['O(1)','O(log n)','O(n)','O(n log n)'], ans:1 }],
    /* Data Structures */
    'array':      [{ q:'Array index access is:', opts:['O(log n)','O(n)','O(1)','O(n²)'], ans:2 },
                   { q:'Insert at middle of array is:', opts:['O(1)','O(log n)','O(n)','O(n²)'], ans:2 },
                   { q:'Java array length uses:', opts:['arr.length()','arr.size()','arr.length','len(arr)'], ans:2 }],
    'string':     [{ q:'Java Strings are:', opts:['Mutable','Immutable','Primitive','Thread-unsafe'], ans:1 },
                   { q:'Compare String content with:', opts:['==','.equals()','.compareTo()','Both B&C'], ans:1 },
                   { q:'Repeated string building → use:', opts:['+ operator','StringBuffer','StringBuilder','char[]'], ans:2 }],
    'arraylist':  [{ q:'ArrayList add to end is:', opts:['O(n)','O(log n)','Amortized O(1)','O(n²)'], ans:2 },
                   { q:'ArrayList vs Array — choose ArrayList when:', opts:['Size is fixed','Need fast index','Size unknown / grows','Need primitives'], ans:2 }],
    'linkedlist': [{ q:'LinkedList head insert is:', opts:['O(n)','O(log n)','O(1)','O(n²)'], ans:2 },
                   { q:'LinkedList index access is:', opts:['O(1)','O(log n)','O(n)','O(n²)'], ans:2 }],
    'stack':      [{ q:'Stack follows:', opts:['FIFO','LIFO','Sorted','Random'], ans:1 },
                   { q:'Best Java Stack impl for DSA:', opts:['Stack class','ArrayDeque','LinkedList','PriorityQueue'], ans:1 },
                   { q:'peek() does:', opts:['Removes top','Returns top without removing','Returns size','Clears stack'], ans:1 }],
    'queue':      [{ q:'Queue follows:', opts:['LIFO','FIFO','Sorted','Random'], ans:1 },
                   { q:'Which algorithm needs a queue?', opts:['DFS','Binary search','BFS','Backtracking'], ans:2 },
                   { q:'offer() vs add():', opts:['Both throw','offer() returns false; add() throws','add() returns false; offer() throws','Identical'], ans:1 }],
    'hashmap':    [{ q:'HashMap average lookup:', opts:['O(log n)','O(n)','O(1)','O(n log n)'], ans:2 },
                   { q:'Worst-case HashMap lookup:', opts:['O(1)','O(log n)','O(n)','O(n²)'], ans:2 },
                   { q:'getOrDefault(key, 0) when key missing:', opts:['Returns null','Returns 0','Throws exception','Returns false'], ans:1 }],
    'treemap':    [{ q:'TreeMap keeps keys:', opts:['Insertion order','Hash order','Sorted order','Random'], ans:2 },
                   { q:'TreeMap operations are:', opts:['O(1)','O(log n)','O(n)','O(n log n)'], ans:1 }],
    'heap':       [{ q:"Java's PriorityQueue is:", opts:['Max-heap','Min-heap','Balanced BST','Sorted array'], ans:1 },
                   { q:'Heap insert complexity:', opts:['O(1)','O(log n)','O(n)','O(n log n)'], ans:1 },
                   { q:'Max-heap in Java:', opts:['new PriorityQueue<>()','Comparator.reverseOrder()','new MaxHeap<>()','Collections.reverse()'], ans:1 }],
    'tree':       [{ q:'Binary tree: max children per node:', opts:['1','2','3','Unlimited'], ans:1 },
                   { q:'Inorder traversal of BST gives:', opts:['Random','Reverse','Sorted ascending','Level order'], ans:2 }],
    'bst':        [{ q:'BST average search:', opts:['O(1)','O(log n)','O(n)','O(n²)'], ans:1 },
                   { q:'Skewed BST worst-case search:', opts:['O(log n)','O(n)','O(1)','O(n log n)'], ans:1 }],
    'trie':       [{ q:'Trie search time (key length m):', opts:['O(n)','O(log n)','O(m)','O(1)'], ans:2 },
                   { q:'Trie is best for:', opts:['Numeric range queries','Prefix/word search','Shortest path','Sorting numbers'], ans:1 }],
    'graph':      [{ q:'Best representation for sparse graphs:', opts:['Adjacency matrix','Adjacency list','2D array','Linked matrix'], ans:1 },
                   { q:'Adjacency matrix space for n nodes:', opts:['O(n)','O(n+e)','O(n²)','O(e)'], ans:2 }],
    'unionfind':  [{ q:'Union-Find answers:', opts:['Shortest path','Are X & Y connected?','Min spanning tree','Topological order'], ans:1 },
                   { q:'Union-Find with path compression is near:', opts:['O(n)','O(log n)','O(1)','O(n log n)'], ans:2 }],
    /* Algorithms */
    'two-pointers':  [{ q:'Two pointers usually requires input to be:', opts:['Unsorted','Sorted or structured','A tree','A graph'], ans:1 },
                      { q:'Two pointers reduces O(n²) to:', opts:['O(n log n)','O(n)','O(log n)','O(1)'], ans:1 }],
    'sliding-window':[{ q:'Sliding window solves problems involving:', opts:['Trees','Contiguous subarrays/substrings','Graphs','Sorting'], ans:1 },
                      { q:'Variable window expands when:', opts:['Condition satisfied','Condition violated','Window at end','Left>right'], ans:0 }],
    'prefix-sum':    [{ q:'Prefix sum enables range queries in:', opts:['O(n)','O(log n)','O(1)','O(n²)'], ans:2 },
                      { q:'prefix[i] = prefix[i-1] + arr[i] lets you compute sum(l,r) as:', opts:['prefix[r]-prefix[l]','prefix[r]-prefix[l-1]','prefix[l]+prefix[r]','arr[r]-arr[l]'], ans:1 }],
    'binary-search': [{ q:'Binary search requires input to be:', opts:['Unsorted','Sorted','No duplicates','Integers only'], ans:1 },
                      { q:'Binary search complexity:', opts:['O(n)','O(log n)','O(1)','O(n log n)'], ans:1 },
                      { q:'mid = lo+(hi-lo)/2 instead of (lo+hi)/2 avoids:', opts:['Off-by-one','Integer overflow','Infinite loop','Stack overflow'], ans:1 }],
    'sorting':       [{ q:'Merge sort time complexity:', opts:['O(n)','O(n log n)','O(n²)','O(log n)'], ans:1 },
                      { q:'Java Arrays.sort() on objects uses:', opts:['Quicksort','Bubble sort','TimSort','Heap sort'], ans:2 }],
    'recursion':     [{ q:'Every recursive function must have:', opts:['A loop','A base case','Multiple returns','A global var'], ans:1 },
                      { q:'Naïve recursive Fibonacci is:', opts:['O(n)','O(log n)','O(2ⁿ)','O(n²)'], ans:2 }],
    'backtracking':  [{ q:'Backtracking = DFS +', opts:['Greedy choice','Pruning invalid branches','Memoization','Queue'], ans:1 },
                      { q:'Backtracking generates:', opts:['Only one solution','All valid solutions','Shortest path','Minimum cost'], ans:1 }],
    'bfs':           [{ q:'BFS guarantees shortest path on:', opts:['Weighted graphs','Unweighted graphs','DAGs only','Trees only'], ans:1 },
                      { q:'BFS uses internally:', opts:['Stack','Queue','Heap','Array'], ans:1 }],
    'dfs':           [{ q:'DFS can be implemented with:', opts:['Queue or array','Stack or recursion','Heap','Hash set'], ans:1 },
                      { q:'DFS is the basis of:', opts:['Dijkstra','BFS','Backtracking','Kahn\'s'], ans:2 }],
    'topo':          [{ q:'Topological sort applies to:', opts:['Undirected graphs','DAGs (directed acyclic graphs)','Trees only','Weighted only'], ans:1 },
                      { q:'Kahn\'s algorithm uses:', opts:['DFS + visited set','BFS + in-degree tracking','Heap + weights','Union-Find'], ans:1 }],
    'dijkstra':      [{ q:"Dijkstra works with:", opts:['Negative weights','Non-negative weights only','Unweighted only','Directed only'], ans:1 },
                      { q:'Dijkstra uses a __ to pick next node:', opts:['Queue','Stack','Priority queue (min-heap)','Hash set'], ans:2 }],
    'greedy':        [{ q:'Greedy makes:', opts:['Global optimal choices upfront','Locally optimal choices at each step','Random choices','Exhaustive choices'], ans:1 },
                      { q:'Greedy does NOT always work unless problem has:', opts:['Sorted input','Optimal substructure + greedy-choice property','Overlapping subproblems','Negative weights'], ans:1 }],
    'dp':            [{ q:'DP applies when problem has:', opts:['No repeated subproblems','Overlapping subproblems + optimal substructure','Only greedy choices','Sorted input'], ans:1 },
                      { q:'Memoization stores results to avoid:', opts:['Extra memory','Recomputing same subproblem','Recursion depth','Stack overflow'], ans:1 },
                      { q:'Bottom-up DP (tabulation) vs top-down:', opts:['Top-down is always faster','Bottom-up avoids recursion overhead','Same space always','Memoization is O(1)'], ans:1 }],
    'bits':          [{ q:'XOR of a number with itself:', opts:['Gives the number','Gives 0','Gives 1','Doubles it'], ans:1 },
                      { q:'Check if n is a power of 2:', opts:['n % 2 == 0','n & (n-1) == 0','n >> 1 == 0','n | 1 == n'], ans:1 }],
    'monotonic':     [{ q:'Monotonic stack maintains elements in:', opts:['Random order','Strictly sorted order (asc or desc)','Insertion order','Hash order'], ans:1 },
                      { q:'Next Greater Element is solved with:', opts:['Min-heap','BFS','Monotonic stack','Two pointers'], ans:2 }],
    /* Java */
    'essentials':    [{ q:'Java is:', opts:['Interpreted only','Compiled to native','Compiled to bytecode (JVM)','Scripted'], ans:2 },
                      { q:'Java\'s main method signature:', opts:['void main()','static void main(String[] args)','public main(args)','int main()'], ans:1 }],
    'primitives':    [{ q:'int vs Integer — Integer can be:', opts:['Faster','null','Used in arrays','Compared with =='], ans:1 },
                      { q:'Integer.MAX_VALUE is approx:', opts:['~65K','~2 billion','~9 quintillion','~1 million'], ans:1 }],
    'collections':   [{ q:'Which is LIFO?', opts:['Queue','ArrayList','Deque as Stack','LinkedList'], ans:2 },
                      { q:'Which maintains sorted order?', opts:['HashMap','ArrayList','TreeMap','LinkedList'], ans:2 }],
    'comparator':    [{ q:'(a,b)->b-a sorts:', opts:['Ascending','Descending','Random','Natural'], ans:1 },
                      { q:'b-a comparator fails when:', opts:['n is large','b very negative, a very positive (overflow)','Strings used','nulls present'], ans:1 }],
    'strings':       [{ q:'String.substring(1,4) on "hello":', opts:['"ello"','"ell"','"hell"','"hel"'], ans:1 },
                      { q:'char to int index (lowercase a-z):', opts:["c - '0'","c - 'a'","(int) c","c + 97"], ans:1 }],
    'pitfalls':      [{ q:'s1 == s2 for Strings compares:', opts:['Content','References','Length','Hash codes'], ans:1 },
                      { q:'int overflow when adding two large ints — use:', opts:['double','float','long','BigDecimal always'], ans:2 }]
  };

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('section.topic[id]').forEach(function (section) {
      var id = section.id;
      var qs = quizData[id];
      if (!qs || !qs.length) return;

      var wrap = document.createElement('div');
      wrap.className = 'quiz-wrap';

      var toggle = document.createElement('button');
      toggle.className = 'quiz-toggle';
      toggle.innerHTML = '⚡ Test yourself <span class="quiz-count">(' + qs.length + ' questions)</span>';

      var body = document.createElement('div');
      body.className = 'quiz-body';

      var score = { correct: 0, answered: 0, total: qs.length };

      qs.forEach(function (item, qi) {
        var qEl = document.createElement('div');
        qEl.className = 'quiz-q';
        qEl.innerHTML = '<div class="quiz-qtext"><span class="quiz-num">Q' + (qi + 1) + '</span> ' + item.q + '</div>';

        var opts = document.createElement('div');
        opts.className = 'quiz-opts';

        item.opts.forEach(function (opt, oi) {
          var btn = document.createElement('button');
          btn.className = 'quiz-opt';
          btn.textContent = opt;
          btn.addEventListener('click', function () {
            if (qEl.classList.contains('answered')) return;
            qEl.classList.add('answered');
            score.answered++;
            if (oi === item.ans) {
              btn.classList.add('correct');
              score.correct++;
            } else {
              btn.classList.add('wrong');
              opts.querySelectorAll('.quiz-opt')[item.ans].classList.add('correct');
            }
            if (score.answered === score.total) {
              var pct = Math.round(score.correct / score.total * 100);
              var fb = body.querySelector('.quiz-feedback');
              if (fb) {
                fb.textContent = score.correct + '/' + score.total + ' correct (' + pct + '%) ' +
                  (pct === 100 ? '🎉 Perfect!' : pct >= 66 ? '👍 Good!' : '📖 Review this section');
                fb.className = 'quiz-feedback quiz-fb-show';
              }
            }
          });
          opts.appendChild(btn);
        });

        qEl.appendChild(opts);
        body.appendChild(qEl);
      });

      var feedback = document.createElement('div');
      feedback.className = 'quiz-feedback';
      body.appendChild(feedback);

      var reset = document.createElement('button');
      reset.className = 'quiz-reset';
      reset.textContent = 'Reset quiz';
      reset.addEventListener('click', function () {
        score.correct = 0; score.answered = 0;
        body.querySelectorAll('.quiz-q').forEach(function (q) { q.classList.remove('answered'); });
        body.querySelectorAll('.quiz-opt').forEach(function (b) { b.classList.remove('correct','wrong'); });
        feedback.className = 'quiz-feedback'; feedback.textContent = '';
      });
      body.appendChild(reset);

      wrap.appendChild(toggle);
      wrap.appendChild(body);

      toggle.addEventListener('click', function () { wrap.classList.toggle('quiz-open'); });

      var noteWrap = section.querySelector('.note-wrap');
      if (noteWrap) section.insertBefore(wrap, noteWrap);
      else section.appendChild(wrap);
    });
  });
})();

/* ── SEARCH ── */
(function () {
  var searchIndex = [
    { page:'index.html',          id:'why',          title:'Why complexity matters',          tags:'big-o complexity time space growth' },
    { page:'index.html',          id:'bigO',         title:'What Big-O really is',            tags:'big-o notation upper bound dominant term' },
    { page:'index.html',          id:'measuring',    title:'Reading code for complexity',     tags:'loops nested recursion log n rules' },
    { page:'index.html',          id:'growth',       title:'Growth-rate hierarchy',           tags:'O(1) O(n) O(log n) constant linear quadratic exponential' },
    { page:'index.html',          id:'space',        title:'Space complexity',                tags:'memory auxiliary space stack heap' },
    { page:'index.html',          id:'amortized',    title:'Amortized & average case',        tags:'amortized arraylist hashmap average' },
    { page:'index.html',          id:'table',        title:'Cheat-sheet: all structures',     tags:'cheat sheet table all operations summary' },
    { page:'index.html',          id:'practice',     title:'Practice — Complexity',           tags:'leetcode easy medium practice problems' },
    { page:'data-structures.html',id:'array',        title:'Array',                           tags:'array fixed index O(1) access java nums' },
    { page:'data-structures.html',id:'string',       title:'String',                          tags:'string immutable stringbuilder charAt equals java' },
    { page:'data-structures.html',id:'arraylist',    title:'ArrayList',                       tags:'arraylist dynamic list add remove size java' },
    { page:'data-structures.html',id:'linkedlist',   title:'Linked List',                     tags:'linkedlist node next prev pointer java' },
    { page:'data-structures.html',id:'stack',        title:'Stack',                           tags:'stack LIFO push pop peek deque java' },
    { page:'data-structures.html',id:'queue',        title:'Queue & Deque',                   tags:'queue deque FIFO offer poll BFS java' },
    { page:'data-structures.html',id:'hashmap',      title:'HashMap & HashSet',               tags:'hashmap hashset key value O(1) lookup java' },
    { page:'data-structures.html',id:'treemap',      title:'TreeMap & TreeSet',               tags:'treemap treeset sorted O(log n) ordered java' },
    { page:'data-structures.html',id:'heap',         title:'Heap / PriorityQueue',            tags:'heap priority queue min max O(log n) dijkstra java' },
    { page:'data-structures.html',id:'tree',         title:'Binary Tree',                     tags:'binary tree node traversal inorder preorder postorder java' },
    { page:'data-structures.html',id:'bst',          title:'Binary Search Tree',              tags:'BST binary search tree ordered O(log n) java' },
    { page:'data-structures.html',id:'trie',         title:'Trie',                            tags:'trie prefix tree string dictionary java' },
    { page:'data-structures.html',id:'graph',        title:'Graph',                           tags:'graph vertices edges adjacency list BFS DFS java' },
    { page:'data-structures.html',id:'unionfind',    title:'Union-Find',                      tags:'union find disjoint set connected components java' },
    { page:'algorithms.html',     id:'two-pointers', title:'Two Pointers',                    tags:'two pointers left right sorted array palindrome' },
    { page:'algorithms.html',     id:'sliding-window',title:'Sliding Window',                 tags:'sliding window subarray substring fixed variable' },
    { page:'algorithms.html',     id:'prefix-sum',   title:'Prefix Sum',                      tags:'prefix sum cumulative range query subarray' },
    { page:'algorithms.html',     id:'binary-search',title:'Binary Search',                   tags:'binary search sorted halving O(log n) lo hi mid' },
    { page:'algorithms.html',     id:'sorting',      title:'Sorting',                         tags:'sort merge sort quick sort comparator O(n log n) java' },
    { page:'algorithms.html',     id:'recursion',    title:'Recursion',                       tags:'recursion base case call stack fibonacci memoization' },
    { page:'algorithms.html',     id:'backtracking', title:'Backtracking',                    tags:'backtracking permutations combinations subsets prune' },
    { page:'algorithms.html',     id:'bfs',          title:'BFS — Breadth-First Search',      tags:'breadth first search queue level order graph tree shortest' },
    { page:'algorithms.html',     id:'dfs',          title:'DFS — Depth-First Search',        tags:'depth first search stack recursion graph tree path' },
    { page:'algorithms.html',     id:'topo',         title:'Topological Sort',                tags:'topological sort DAG dependency ordering Kahn BFS DFS' },
    { page:'algorithms.html',     id:'dijkstra',     title:"Dijkstra's Algorithm",            tags:'dijkstra shortest path weighted graph priority queue heap' },
    { page:'algorithms.html',     id:'greedy',       title:'Greedy',                          tags:'greedy local optimal interval scheduling activity' },
    { page:'algorithms.html',     id:'dp',           title:'Dynamic Programming',             tags:'dynamic programming memoization tabulation DP knapsack fibonacci' },
    { page:'algorithms.html',     id:'bits',         title:'Bit Manipulation',                tags:'bit manipulation XOR AND OR shift bitwise mask' },
    { page:'algorithms.html',     id:'monotonic',    title:'Monotonic Stack',                 tags:'monotonic stack next greater element histogram' },
    { page:'algorithms.html',     id:'playbook',     title:'The recognition playbook',        tags:'pattern recognition which algorithm to use cheat sheet' },
    { page:'java.html',           id:'essentials',   title:'Java in 5 minutes',               tags:'java basics syntax class method return' },
    { page:'java.html',           id:'io',           title:'LeetCode signatures & I/O',       tags:'leetcode method signature return type void java' },
    { page:'java.html',           id:'primitives',   title:'Primitives vs wrappers',          tags:'int Integer autoboxing null primitive wrapper java' },
    { page:'java.html',           id:'collections',  title:'Collections cheat-sheet',         tags:'collections list set map queue deque all java' },
    { page:'java.html',           id:'comparator',   title:'Comparator & sorting',            tags:'comparator comparable sort lambda java custom order' },
    { page:'java.html',           id:'strings',      title:'Strings & StringBuilder',         tags:'string stringbuilder immutable java append' },
    { page:'java.html',           id:'generics',     title:'Generics',                        tags:'generics type parameter T K V wildcard java' },
    { page:'java.html',           id:'lambdas',      title:'Lambdas & functional',            tags:'lambda stream functional interface predicate java' },
    { page:'java.html',           id:'math',         title:'Math & numeric edges',            tags:'math integer overflow min max abs power java' },
    { page:'java.html',           id:'pitfalls',     title:'Top 10 Java pitfalls',            tags:'pitfalls gotchas common mistakes java bugs' },
    { page:'java.html',           id:'snippets',     title:'The snippet vault',               tags:'code snippets templates boilerplate java patterns' }
  ];

  document.addEventListener('DOMContentLoaded', function () {
    var overlay = document.getElementById('search-overlay');
    var input   = document.getElementById('search-input');
    var results = document.getElementById('search-results');
    var btn     = document.getElementById('search-btn');
    if (!overlay || !input || !results) return;
    if (btn) btn.addEventListener('click', openSearch);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeSearch(); });
    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); openSearch(); }
      if (e.key === 'Escape') closeSearch();
    });
    input.addEventListener('input', function () {
      var q = input.value.trim().toLowerCase();
      if (!q) { showHint('Type to search across all chapters…'); return; }
      var words = q.split(/\s+/);
      var hits  = searchIndex.filter(function (item) {
        var hay = (item.title + ' ' + item.tags).toLowerCase();
        return words.every(function (w) { return hay.includes(w); });
      }).slice(0, 10);
      if (!hits.length) { showHint('No results — try a different keyword.'); return; }
      results.innerHTML = hits.map(function (r) {
        var chap = r.page.replace('.html','').replace(/-/g,' ');
        chap = chap.charAt(0).toUpperCase() + chap.slice(1);
        return '<a class="sri" href="' + r.page + '#' + r.id + '">' +
               '<span class="sri-chap">' + chap + '</span>' +
               '<span class="sri-title">' + r.title + '</span></a>';
      }).join('');
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { var f = results.querySelector('.sri'); if(f){e.preventDefault();f.focus();} }
    });
    results.addEventListener('keydown', function (e) {
      var items = Array.from(results.querySelectorAll('.sri'));
      var idx   = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown' && idx < items.length-1) { e.preventDefault(); items[idx+1].focus(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); if(idx>0) items[idx-1].focus(); else input.focus(); }
    });
    function showHint(msg) { results.innerHTML = '<p class="search-hint">' + msg + '</p>'; }
    function openSearch()  { overlay.classList.add('open'); input.value=''; showHint('Type to search across all chapters…'); setTimeout(function(){input.focus();},40); }
    function closeSearch() { overlay.classList.remove('open'); }
  });
})();

/* ── VISUALIZER PANEL ── */
(function () {
  /* VisualAlgo URL map */
  var vizUrl = {
    'linkedlist':'https://visualgo.net/en/list','stack':'https://visualgo.net/en/list',
    'queue':'https://visualgo.net/en/list','heap':'https://visualgo.net/en/heap',
    'tree':'https://visualgo.net/en/bst','bst':'https://visualgo.net/en/bst',
    'hashmap':'https://visualgo.net/en/hashtable','trie':'https://visualgo.net/en/trie',
    'graph':'https://visualgo.net/en/dfsbfs','bfs':'https://visualgo.net/en/dfsbfs',
    'dfs':'https://visualgo.net/en/dfsbfs','topo':'https://visualgo.net/en/dfsbfs',
    'sorting':'https://visualgo.net/en/sorting','unionfind':'https://visualgo.net/en/ufds'
  };

  /* Custom visualizer builders */
  var vizBuilders = {
    'array':         buildArrayViz,
    'linkedlist':    buildLinkedListViz,
    'stack':         buildStackViz,
    'queue':         buildQueueViz,
    'binary-search': buildBinarySearchViz,
    'two-pointers':  buildTwoPointersViz,
    'sliding-window':buildSlidingWindowViz,
    'sorting':       buildSortingViz,
    'bfs':           buildBFSViz,
    'dfs':           buildDFSViz,
    'heap':          buildHeapViz,
    'tree':          buildTreeViz
  };

  document.addEventListener('DOMContentLoaded', function () {
    /* Create panel */
    var panel = document.createElement('div');
    panel.id  = 'viz-panel';
    panel.innerHTML =
      '<div id="viz-header">' +
        '<span id="viz-title">Visualizer</span>' +
        '<div style="display:flex;gap:0.5rem;align-items:center">' +
          '<a id="viz-ext-link" href="#" target="_blank" rel="noopener" class="viz-ext-btn" style="display:none">Open in VisuAlgo ↗</a>' +
          '<button id="viz-close">✕</button>' +
        '</div>' +
      '</div>' +
      '<div id="viz-body"></div>';
    document.body.appendChild(panel);

    document.getElementById('viz-close').addEventListener('click', function () {
      panel.classList.remove('viz-open');
    });

    /* Inject Visualize buttons into sections */
    document.querySelectorAll('section.topic[id]').forEach(function (section) {
      var id = section.id;
      if (!vizBuilders[id] && !vizUrl[id]) return;

      var btn = document.createElement('button');
      btn.className   = 'viz-trigger';
      btn.textContent = '◈ Visualize';
      btn.title       = 'Open interactive visualizer';
      btn.addEventListener('click', function () {
        openViz(id, section.querySelector('h2.topic-title') ?
          section.querySelector('h2.topic-title').textContent.replace(/~.*/, '').trim() : id);
      });

      var title = section.querySelector('h2.topic-title');
      if (title) title.after(btn);
    });

    function openViz(id, title) {
      document.getElementById('viz-title').textContent = title;
      var body    = document.getElementById('viz-body');
      var extLink = document.getElementById('viz-ext-link');
      body.innerHTML = '';

      if (vizUrl[id]) {
        extLink.href  = vizUrl[id];
        extLink.style.display = 'inline-flex';
      } else {
        extLink.style.display = 'none';
      }

      if (vizBuilders[id]) {
        vizBuilders[id](body);
      } else {
        body.innerHTML = '<p class="viz-placeholder">Use the VisuAlgo link above for an interactive animation of this concept.</p>';
      }
      panel.classList.add('viz-open');
    }
  });

  /* ───── ARRAY ───── */
  function buildArrayViz(body) {
    var vals = [3, 7, 1, 9, 4, 6, 2, 8];
    body.innerHTML = '<p class="viz-desc">Linear search — watch the pointer scan left to right.</p>' +
      '<div class="viz-array-row" id="va-row"></div>' +
      '<div class="viz-controls">' +
        '<input id="va-input" type="number" placeholder="Search value" min="1" max="9" class="viz-input"/>' +
        '<button class="viz-btn" id="va-go">Search</button>' +
        '<button class="viz-btn viz-btn-sec" id="va-reset">Reset</button>' +
      '</div>' +
      '<div class="viz-status" id="va-status"></div>';
    renderArr();
    document.getElementById('va-go').onclick = runSearch;
    document.getElementById('va-reset').onclick = function () {
      renderArr(); document.getElementById('va-status').textContent = '';
    };
    function renderArr(active, found) {
      var row = document.getElementById('va-row'); if(!row) return;
      row.innerHTML = vals.map(function (v, i) {
        var cls = 'viz-cell';
        if (i === active) cls += found ? ' viz-found' : ' viz-active';
        return '<div class="' + cls + '"><div class="viz-val">' + v + '</div><div class="viz-idx">' + i + '</div></div>';
      }).join('');
    }
    function runSearch() {
      var target = parseInt(document.getElementById('va-input').value, 10);
      if (isNaN(target)) return;
      var i = 0, status = document.getElementById('va-status');
      status.textContent = 'Searching…';
      var t = setInterval(function () {
        if (i >= vals.length) { clearInterval(t); status.textContent = 'Not found. O(n) — checked all ' + vals.length + ' cells.'; renderArr(); return; }
        renderArr(i, vals[i] === target);
        if (vals[i] === target) { clearInterval(t); status.textContent = 'Found ' + target + ' at index ' + i + ' ✓'; return; }
        i++;
      }, 400);
    }
  }

  /* ───── LINKED LIST ───── */
  function buildLinkedListViz(body) {
    var vals = [12, 37, 5, 22, 9];
    body.innerHTML = '<p class="viz-desc">Traverse each node by following the next pointer.</p>' +
      '<div class="viz-ll-row" id="vll-row"></div>' +
      '<div class="viz-controls"><button class="viz-btn" id="vll-go">▶ Traverse</button><button class="viz-btn viz-btn-sec" id="vll-reset">Reset</button></div>' +
      '<div class="viz-status" id="vll-status"></div>';
    renderLL(-1);
    document.getElementById('vll-reset').onclick = function () { renderLL(-1); document.getElementById('vll-status').textContent = ''; };
    document.getElementById('vll-go').onclick = function () {
      var i = 0, status = document.getElementById('vll-status');
      document.getElementById('vll-go').disabled = true;
      var t = setInterval(function () {
        renderLL(i);
        status.textContent = i < vals.length ? 'Visiting node ' + i + ' → value: ' + vals[i] : 'Reached null — traversal complete ✓';
        if (i >= vals.length) { clearInterval(t); document.getElementById('vll-go').disabled = false; return; }
        i++;
      }, 500);
    };
    function renderLL(active) {
      var row = document.getElementById('vll-row'); if(!row) return;
      row.innerHTML = vals.map(function (v, i) {
        return '<div class="viz-ll-node' + (i===active?' viz-active':'') + '">' +
          '<div class="viz-ll-val">' + v + '</div></div>' +
          (i < vals.length-1 ? '<div class="viz-ll-arrow' + (i<active?' viz-traversed':'') + '">→</div>' : '<div class="viz-ll-arrow">∅</div>');
      }).join('');
    }
  }

  /* ───── STACK ───── */
  function buildStackViz(body) {
    var stack = [3, 7];
    body.innerHTML = '<p class="viz-desc">LIFO — last in, first out. Push adds to top; pop removes from top.</p>' +
      '<div class="viz-stack-container"><div class="viz-stack-inner" id="vs-inner"></div><div class="viz-stack-base">⬛ base</div></div>' +
      '<div class="viz-controls">' +
        '<input id="vs-input" type="number" placeholder="Value" class="viz-input" style="width:80px"/>' +
        '<button class="viz-btn" id="vs-push">Push</button>' +
        '<button class="viz-btn viz-btn-sec" id="vs-pop">Pop</button>' +
      '</div>' +
      '<div class="viz-status" id="vs-status"></div>';
    renderStack();
    document.getElementById('vs-push').onclick = function () {
      var v = parseInt(document.getElementById('vs-input').value, 10);
      if (isNaN(v)) return;
      if (stack.length >= 6) { document.getElementById('vs-status').textContent = 'Stack full (max 6)'; return; }
      stack.push(v); renderStack(); document.getElementById('vs-status').textContent = 'Pushed ' + v + ' → top of stack';
    };
    document.getElementById('vs-pop').onclick = function () {
      if (!stack.length) { document.getElementById('vs-status').textContent = 'Stack is empty!'; return; }
      var v = stack.pop(); renderStack(); document.getElementById('vs-status').textContent = 'Popped ' + v + ' ← was top';
    };
    function renderStack() {
      var inner = document.getElementById('vs-inner'); if(!inner) return;
      inner.innerHTML = stack.slice().reverse().map(function (v, i) {
        return '<div class="viz-stack-item' + (i===0?' viz-top':'') + '">' + v + (i===0?' ← top':'') + '</div>';
      }).join('');
    }
  }

  /* ───── QUEUE ───── */
  function buildQueueViz(body) {
    var queue = [5, 2, 8];
    body.innerHTML = '<p class="viz-desc">FIFO — first in, first out. Enqueue adds to back; dequeue removes from front.</p>' +
      '<div class="viz-queue-row" id="vq-row"></div>' +
      '<div class="viz-controls">' +
        '<input id="vq-input" type="number" placeholder="Value" class="viz-input" style="width:80px"/>' +
        '<button class="viz-btn" id="vq-enq">Enqueue</button>' +
        '<button class="viz-btn viz-btn-sec" id="vq-deq">Dequeue</button>' +
      '</div>' +
      '<div class="viz-status" id="vq-status"></div>';
    renderQueue();
    document.getElementById('vq-enq').onclick = function () {
      var v = parseInt(document.getElementById('vq-input').value, 10);
      if (isNaN(v)) return;
      if (queue.length >= 7) { document.getElementById('vq-status').textContent = 'Queue full'; return; }
      queue.push(v); renderQueue(); document.getElementById('vq-status').textContent = 'Enqueued ' + v + ' → back';
    };
    document.getElementById('vq-deq').onclick = function () {
      if (!queue.length) { document.getElementById('vq-status').textContent = 'Queue empty!'; return; }
      var v = queue.shift(); renderQueue(); document.getElementById('vq-status').textContent = 'Dequeued ' + v + ' ← was front';
    };
    function renderQueue() {
      var row = document.getElementById('vq-row'); if(!row) return;
      if (!queue.length) { row.innerHTML = '<span class="viz-empty">empty</span>'; return; }
      row.innerHTML = queue.map(function (v, i) {
        return '<div class="viz-cell' + (i===0?' viz-front':'') + (i===queue.length-1?' viz-back':'') + '">' +
          '<div class="viz-val">' + v + '</div>' +
          '<div class="viz-idx">' + (i===0?'front':i===queue.length-1?'back':'') + '</div></div>';
      }).join('<div class="viz-q-arr">→</div>');
    }
  }

  /* ───── BINARY SEARCH ───── */
  function buildBinarySearchViz(body) {
    var arr = [1,3,5,7,9,11,13,15,17,19];
    var lo=0, hi=arr.length-1, target=null, found=-1, steps=0;
    body.innerHTML = '<p class="viz-desc">Step through — lo/mid/hi pointers converge on the target.</p>' +
      '<div class="viz-array-row" id="vbs-row"></div>' +
      '<div class="viz-legend"><span class="vl-lo">lo</span> <span class="vl-mid">mid</span> <span class="vl-hi">hi</span></div>' +
      '<div class="viz-controls">' +
        '<input id="vbs-input" type="number" placeholder="Find…" class="viz-input" style="width:80px"/>' +
        '<button class="viz-btn" id="vbs-step">Step</button>' +
        '<button class="viz-btn viz-btn-sec" id="vbs-reset">Reset</button>' +
      '</div><div class="viz-status" id="vbs-status"></div>';
    renderBS(-1,-1,-1);
    document.getElementById('vbs-reset').onclick = function () { lo=0; hi=arr.length-1; target=null; found=-1; steps=0; renderBS(-1,-1,-1); document.getElementById('vbs-status').textContent=''; };
    document.getElementById('vbs-step').onclick = function () {
      if (target === null) { target = parseInt(document.getElementById('vbs-input').value, 10); if (isNaN(target)) return; }
      if (found >= 0 || lo > hi) return;
      var mid = Math.floor((lo + hi) / 2);
      steps++;
      if (arr[mid] === target) { found = mid; renderBS(lo, mid, hi); document.getElementById('vbs-status').textContent = 'Found ' + target + ' at index ' + mid + ' after ' + steps + ' step(s) ✓'; }
      else if (arr[mid] < target) { document.getElementById('vbs-status').textContent = 'arr[' + mid + ']=' + arr[mid] + ' < ' + target + ' → move lo right'; renderBS(lo, mid, hi); lo = mid+1; }
      else { document.getElementById('vbs-status').textContent = 'arr[' + mid + ']=' + arr[mid] + ' > ' + target + ' → move hi left'; renderBS(lo, mid, hi); hi = mid-1; }
      if (lo > hi && found < 0) { document.getElementById('vbs-status').textContent = target + ' not in array. Took ' + steps + ' steps.'; }
    };
    function renderBS(l, m, h) {
      var row = document.getElementById('vbs-row'); if(!row) return;
      row.innerHTML = arr.map(function (v, i) {
        var cls = 'viz-cell';
        if (found >= 0 && i === found) cls += ' viz-found';
        else if (i === m) cls += ' viz-mid';
        else if (i === l) cls += ' viz-lo';
        else if (i === h && h !== m) cls += ' viz-hi';
        else if (l >= 0 && (i < l || i > h)) cls += ' viz-excluded';
        return '<div class="' + cls + '"><div class="viz-val">' + v + '</div>' +
          '<div class="viz-idx">' + (i===l&&l===m?'lo/mid':i===m&&m===h?'mid/hi':i===l?'lo':i===m?'mid':i===h?'hi':i) + '</div></div>';
      }).join('');
    }
  }

  /* ───── TWO POINTERS ───── */
  function buildTwoPointersViz(body) {
    var arr = [1,4,6,7,10,11,15,18];
    var L=0, H=arr.length-1, tgt=21, found=false;
    body.innerHTML = '<p class="viz-desc">Target sum = <strong>' + tgt + '</strong>. Left + Right converge.</p>' +
      '<div class="viz-array-row" id="vtp-row"></div>' +
      '<div class="viz-controls"><button class="viz-btn" id="vtp-step">Step</button><button class="viz-btn viz-btn-sec" id="vtp-reset">Reset</button></div>' +
      '<div class="viz-status" id="vtp-status"></div>';
    renderTP();
    document.getElementById('vtp-reset').onclick = function () { L=0; H=arr.length-1; found=false; renderTP(); document.getElementById('vtp-status').textContent=''; };
    document.getElementById('vtp-step').onclick = function () {
      if (found || L >= H) return;
      var sum = arr[L] + arr[H];
      if (sum === tgt) { found=true; document.getElementById('vtp-status').textContent='Found! arr['+L+']+arr['+H+']='+arr[L]+'+'+arr[H]+'='+tgt+' ✓'; }
      else if (sum < tgt) { document.getElementById('vtp-status').textContent='Sum='+sum+' < '+tgt+' → move L right'; L++; }
      else { document.getElementById('vtp-status').textContent='Sum='+sum+' > '+tgt+' → move R left'; H--; }
      renderTP();
    };
    function renderTP() {
      var row = document.getElementById('vtp-row'); if(!row) return;
      row.innerHTML = arr.map(function (v, i) {
        var cls = 'viz-cell';
        if (found && (i===L||i===H)) cls += ' viz-found';
        else if (i===L && i===H) cls += ' viz-mid';
        else if (i===L) cls += ' viz-lo';
        else if (i===H) cls += ' viz-hi';
        return '<div class="'+cls+'"><div class="viz-val">'+v+'</div><div class="viz-idx">'+(i===L&&i===H?'L/R':i===L?'L':i===H?'R':i)+'</div></div>';
      }).join('');
    }
  }

  /* ───── SLIDING WINDOW ───── */
  function buildSlidingWindowViz(body) {
    var arr=[3,1,4,1,5,9,2,6], k=3, pos=0, maxSum=0, maxPos=0;
    var curSum = arr[0]+arr[1]+arr[2];
    maxSum=curSum; maxPos=0;
    body.innerHTML = '<p class="viz-desc">Find max sum subarray of size k=<strong>'+k+'</strong>.</p>' +
      '<div class="viz-array-row" id="vsw-row"></div>' +
      '<div class="viz-controls"><button class="viz-btn" id="vsw-step">Slide →</button><button class="viz-btn viz-btn-sec" id="vsw-reset">Reset</button></div>' +
      '<div class="viz-status" id="vsw-status"></div>';
    renderSW();
    document.getElementById('vsw-reset').onclick = function () {
      pos=0; curSum=arr[0]+arr[1]+arr[2]; maxSum=curSum; maxPos=0; renderSW(); document.getElementById('vsw-status').textContent='';
    };
    document.getElementById('vsw-step').onclick = function () {
      if (pos+k >= arr.length) { document.getElementById('vsw-status').textContent='Done! Max sum='+maxSum+' at index ['+maxPos+','+(maxPos+k-1)+'] ✓'; return; }
      pos++;
      curSum = curSum - arr[pos-1] + arr[pos+k-1];
      if (curSum > maxSum) { maxSum=curSum; maxPos=pos; }
      renderSW();
      document.getElementById('vsw-status').textContent='Window ['+pos+','+(pos+k-1)+']: sum='+curSum+(curSum>=maxSum?' ← new max':'');
    };
    function renderSW() {
      var row = document.getElementById('vsw-row'); if(!row) return;
      row.innerHTML = arr.map(function (v, i) {
        var inWin = i>=pos && i<pos+k;
        var cls = 'viz-cell' + (inWin?' viz-window':'') + (i===pos+k-1&&inWin?' viz-win-end':i===pos&&inWin?' viz-win-start':'');
        return '<div class="'+cls+'"><div class="viz-val">'+v+'</div><div class="viz-idx">'+i+'</div></div>';
      }).join('');
    }
  }

  /* ───── SORTING (Bubble Sort) ───── */
  function buildSortingViz(body) {
    var orig=[6,3,8,1,7,2,9,4], arr=orig.slice(), running=false;
    body.innerHTML = '<p class="viz-desc">Bubble sort — largest bubbles to the right each pass.</p>' +
      '<div class="viz-bars" id="vsort-bars"></div>' +
      '<div class="viz-controls"><button class="viz-btn" id="vsort-go">▶ Sort</button><button class="viz-btn viz-btn-sec" id="vsort-reset">Shuffle</button></div>' +
      '<div class="viz-status" id="vsort-status"></div>';
    renderBars(arr,[],[]);
    document.getElementById('vsort-reset').onclick = function () {
      if(running)return; arr=orig.slice(); for(var i=arr.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=arr[i];arr[i]=arr[j];arr[j]=t;}
      renderBars(arr,[],[]); document.getElementById('vsort-status').textContent='';
    };
    document.getElementById('vsort-go').onclick = function () {
      if(running)return; running=true;
      var sorted=[]; var pass=0;
      function doPass() {
        var i=0; var swapped=false;
        function step() {
          if(i>=arr.length-1-pass){
            sorted.unshift(arr.length-1-pass);
            if(!swapped||pass>=arr.length-1){renderBars(arr,[],arr.map(function(_,k){return k;})); document.getElementById('vsort-status').textContent='Sorted! ✓'; running=false; return;}
            pass++; setTimeout(doPass,200); return;
          }
          var comparing=[i,i+1];
          if(arr[i]>arr[i+1]){var t=arr[i];arr[i]=arr[i+1];arr[i+1]=t; swapped=true;}
          renderBars(arr,comparing,sorted);
          document.getElementById('vsort-status').textContent='Pass '+(pass+1)+': comparing indices '+i+'&'+(i+1);
          i++; setTimeout(step,300);
        }
        step();
      }
      doPass();
    };
    function renderBars(a,active,sorted) {
      var b=document.getElementById('vsort-bars'); if(!b) return;
      var max=Math.max.apply(null,a);
      b.innerHTML=a.map(function(v,i){
        var h=Math.round(v/max*90);
        var cls='viz-bar'+(active.indexOf(i)>=0?' viz-bar-active':'')+(sorted.indexOf(i)>=0?' viz-bar-sorted':'');
        return '<div class="'+cls+'" style="height:'+h+'%"><span>'+v+'</span></div>';
      }).join('');
    }
  }

  /* ───── BFS ───── */
  function buildBFSViz(body) {
    var R=5,C=6, walls=new Set([7,8,14,20]);
    var visited=[], queue=[], current=-1, done=false;
    body.innerHTML='<p class="viz-desc">BFS from top-left — explores level by level (shortest path).</p>' +
      '<div class="viz-grid" id="vbfs-grid" style="--gc:'+C+'"></div>' +
      '<div class="viz-controls"><button class="viz-btn" id="vbfs-step">Step</button><button class="viz-btn" id="vbfs-auto">Auto</button><button class="viz-btn viz-btn-sec" id="vbfs-reset">Reset</button></div>' +
      '<div class="viz-status" id="vbfs-status"></div>';
    resetBFS();
    document.getElementById('vbfs-reset').onclick = resetBFS;
    document.getElementById('vbfs-step').onclick = stepBFS;
    var autoT; document.getElementById('vbfs-auto').onclick = function () {
      clearInterval(autoT); autoT = setInterval(function () { if(done){clearInterval(autoT);} else stepBFS(); }, 220);
    };
    function resetBFS(){visited=[]; queue=[0]; current=-1; done=false; renderGrid(); document.getElementById('vbfs-status').textContent='Queue: [0]';}
    function stepBFS(){
      if(!queue.length){done=true;document.getElementById('vbfs-status').textContent='BFS complete ✓';return;}
      current=queue.shift(); if(visited.indexOf(current)>=0){stepBFS();return;}
      visited.push(current);
      var r=Math.floor(current/C), c=current%C;
      var nbrs=[[r-1,c],[r+1,c],[r,c-1],[r,c+1]];
      nbrs.forEach(function(n){
        var nr=n[0],nc=n[1],ni=nr*C+nc;
        if(nr>=0&&nr<R&&nc>=0&&nc<C&&visited.indexOf(ni)<0&&queue.indexOf(ni)<0&&!walls.has(ni)) queue.push(ni);
      });
      renderGrid();
      document.getElementById('vbfs-status').textContent=current===R*C-1?'Reached goal! ✓':'Visiting cell '+current+' | Queue: ['+queue.slice(0,5).join(',')+']';
      if(current===R*C-1) done=true;
    }
    function renderGrid(){
      var g=document.getElementById('vbfs-grid'); if(!g) return;
      g.innerHTML='';
      for(var i=0;i<R*C;i++){
        var cell=document.createElement('div');
        cell.className='viz-gcell'+(walls.has(i)?' viz-wall':visited.indexOf(i)>=0&&i!==current?' viz-visited':i===current?' viz-current':queue.indexOf(i)>=0?' viz-queued':i===0?' viz-start':i===R*C-1?' viz-goal':'');
        cell.textContent=i===0?'S':i===R*C-1?'G':walls.has(i)?'█':'';
        g.appendChild(cell);
      }
    }
  }

  /* ───── DFS ───── */
  function buildDFSViz(body) {
    var R=5,C=6, walls=new Set([7,8,14,20]);
    var visited=[], stack=[], current=-1, done=false;
    body.innerHTML='<p class="viz-desc">DFS from top-left — goes deep first (not necessarily shortest path).</p>' +
      '<div class="viz-grid" id="vdfs-grid" style="--gc:'+C+'"></div>' +
      '<div class="viz-controls"><button class="viz-btn" id="vdfs-step">Step</button><button class="viz-btn" id="vdfs-auto">Auto</button><button class="viz-btn viz-btn-sec" id="vdfs-reset">Reset</button></div>' +
      '<div class="viz-status" id="vdfs-status"></div>';
    resetDFS();
    document.getElementById('vdfs-reset').onclick=resetDFS;
    document.getElementById('vdfs-step').onclick=stepDFS;
    var autoT; document.getElementById('vdfs-auto').onclick=function(){clearInterval(autoT);autoT=setInterval(function(){if(done)clearInterval(autoT);else stepDFS();},220);};
    function resetDFS(){visited=[];stack=[0];current=-1;done=false;renderGrid();document.getElementById('vdfs-status').textContent='Stack: [0]';}
    function stepDFS(){
      if(!stack.length){done=true;document.getElementById('vdfs-status').textContent='DFS complete ✓';return;}
      current=stack.pop();if(visited.indexOf(current)>=0){stepDFS();return;}
      visited.push(current);
      var r=Math.floor(current/C),c=current%C;
      var nbrs=[[r,c+1],[r+1,c],[r,c-1],[r-1,c]];
      nbrs.forEach(function(n){var nr=n[0],nc=n[1],ni=nr*C+nc;if(nr>=0&&nr<R&&nc>=0&&nc<C&&visited.indexOf(ni)<0&&!walls.has(ni))stack.push(ni);});
      renderGrid();
      document.getElementById('vdfs-status').textContent=current===R*C-1?'Reached goal! ✓':'Visiting '+current+' | Stack depth: '+stack.length;
      if(current===R*C-1)done=true;
    }
    function renderGrid(){
      var g=document.getElementById('vdfs-grid');if(!g)return;g.innerHTML='';
      for(var i=0;i<R*C;i++){
        var cell=document.createElement('div');
        cell.className='viz-gcell'+(walls.has(i)?' viz-wall':visited.indexOf(i)>=0&&i!==current?' viz-visited':i===current?' viz-current':stack.indexOf(i)>=0?' viz-queued':i===0?' viz-start':i===R*C-1?' viz-goal':'');
        cell.textContent=i===0?'S':i===R*C-1?'G':walls.has(i)?'█':'';
        g.appendChild(cell);
      }
    }
  }

  /* ───── HEAP ───── */
  function buildHeapViz(body) {
    var heap=[1,4,3,9,7,8];
    body.innerHTML='<p class="viz-desc">Min-heap — parent always ≤ children. Insert bubbles up; extract-min bubbles down.</p>' +
      '<div class="viz-heap-tree" id="vh-tree"></div>' +
      '<div class="viz-controls">' +
        '<input id="vh-input" type="number" placeholder="Insert" class="viz-input" style="width:80px"/>' +
        '<button class="viz-btn" id="vh-ins">Insert</button>' +
        '<button class="viz-btn viz-btn-sec" id="vh-ext">Extract Min</button>' +
      '</div><div class="viz-status" id="vh-status"></div>';
    renderHeap([]);
    document.getElementById('vh-ins').onclick=function(){
      var v=parseInt(document.getElementById('vh-input').value,10);if(isNaN(v))return;
      if(heap.length>=15){document.getElementById('vh-status').textContent='Heap full';return;}
      heap.push(v);
      var i=heap.length-1;
      var highlight=[];
      function bubbleUp(){
        if(i<=0){renderHeap(highlight);document.getElementById('vh-status').textContent='Inserted '+v+' ✓';return;}
        var p=Math.floor((i-1)/2);
        highlight=[i,p];renderHeap(highlight);
        if(heap[i]<heap[p]){var t=heap[i];heap[i]=heap[p];heap[p]=t;i=p;setTimeout(bubbleUp,400);}
        else{renderHeap([i]);document.getElementById('vh-status').textContent='Inserted '+v+' ✓';}
      }
      bubbleUp();
    };
    document.getElementById('vh-ext').onclick=function(){
      if(!heap.length){document.getElementById('vh-status').textContent='Empty heap!';return;}
      var min=heap[0];heap[0]=heap.pop();
      var i=0,highlight=[];
      function siftDown(){
        var l=2*i+1,r=2*i+2,sm=i;
        if(l<heap.length&&heap[l]<heap[sm])sm=l;
        if(r<heap.length&&heap[r]<heap[sm])sm=r;
        if(sm!==i){var t=heap[i];heap[i]=heap[sm];heap[sm]=t;highlight=[i,sm];renderHeap(highlight);i=sm;setTimeout(siftDown,400);}
        else{renderHeap([]);document.getElementById('vh-status').textContent='Extracted min='+min+' ✓';}
      }
      siftDown();
    };
    function renderHeap(hi){
      var t=document.getElementById('vh-tree');if(!t)return;
      if(!heap.length){t.innerHTML='<span class="viz-empty">empty</span>';return;}
      var levels=[]; var i=0,lev=0;
      while(i<heap.length){var cnt=Math.pow(2,lev);levels.push(heap.slice(i,i+cnt));i+=cnt;lev++;}
      t.innerHTML=levels.map(function(row,li){
        return '<div class="viz-heap-level">'+row.map(function(v,ri){
          var idx=Math.pow(2,li)-1+ri;
          return '<div class="viz-heap-node'+(hi.indexOf(idx)>=0?' viz-active':'')+(idx===0?' viz-min':'')+'">'+v+'</div>';
        }).join('')+'</div>';
      }).join('');
    }
  }

  /* ───── BINARY TREE TRAVERSAL ───── */
  function buildTreeViz(body) {
    var tree=[4,2,6,1,3,5,7];
    var highlight=[];
    body.innerHTML='<p class="viz-desc">7-node BST. Watch the traversal order highlight each node.</p>' +
      '<div class="viz-heap-tree" id="vtr-tree"></div>' +
      '<div class="viz-controls">' +
        '<button class="viz-btn" id="vtr-in">Inorder</button>' +
        '<button class="viz-btn viz-btn-sec" id="vtr-pre">Preorder</button>' +
        '<button class="viz-btn viz-btn-sec" id="vtr-post">Postorder</button>' +
        '<button class="viz-btn viz-btn-sec" id="vtr-reset">Reset</button>' +
      '</div><div class="viz-status" id="vtr-status"></div>';
    renderTree([]);
    document.getElementById('vtr-reset').onclick=function(){highlight=[];renderTree([]);document.getElementById('vtr-status').textContent='';};
    document.getElementById('vtr-in').onclick=function(){runOrder('inorder');};
    document.getElementById('vtr-pre').onclick=function(){runOrder('preorder');};
    document.getElementById('vtr-post').onclick=function(){runOrder('postorder');};
    function order(root,type,out){
      if(root>=tree.length)return;
      var l=2*root+1,r=2*root+2;
      if(type==='preorder') out.push(root);
      order(l,type,out);
      if(type==='inorder') out.push(root);
      order(r,type,out);
      if(type==='postorder') out.push(root);
    }
    function runOrder(type){
      var seq=[];order(0,type,seq);highlight=[];renderTree([]);
      var i=0;
      var t=setInterval(function(){
        if(i>=seq.length){clearInterval(t);document.getElementById('vtr-status').textContent=type+': ['+seq.map(function(x){return tree[x];}).join(', ')+'] ✓';return;}
        highlight.push(seq[i]);renderTree(highlight);
        document.getElementById('vtr-status').textContent='Visiting: '+tree[seq[i]];
        i++;
      },500);
    }
    function renderTree(hi){
      var t=document.getElementById('vtr-tree');if(!t)return;
      var levels=[[0],[1,2],[3,4,5,6]];
      t.innerHTML=levels.map(function(row){
        return '<div class="viz-heap-level">'+row.map(function(idx){
          return '<div class="viz-heap-node'+(hi.indexOf(idx)>=0?' viz-active':'')+'">'+tree[idx]+'</div>';
        }).join('')+'</div>';
      }).join('');
    }
  }
})();

/* ── TOC ACTIVE HIGHLIGHT ON SCROLL ── */
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var tocLinks = document.querySelectorAll('aside.toc a');
    if (!tocLinks.length) return;
    var sections = Array.from(tocLinks).map(function (a) {
      var href = a.getAttribute('href') || '';
      return href.startsWith('#') ? document.getElementById(href.slice(1)) : null;
    }).filter(Boolean);
    function update() {
      var scrollY = window.scrollY + 130, current = sections[0];
      sections.forEach(function (s) { if (s && s.offsetTop <= scrollY) current = s; });
      if (!current) return;
      tocLinks.forEach(function (a) { a.classList.toggle('active-toc', a.getAttribute('href') === '#' + current.id); });
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  });
})();

/* ── COLLAPSIBLE TOC ── */
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var tocTitle = document.querySelector('.toc-title');
    var toc      = document.querySelector('aside.toc');
    if (!tocTitle || !toc) return;
    var colKey = 'codex-toc-' + (location.pathname.split('/').pop() || 'index');
    if (localStorage.getItem(colKey) === '1') toc.classList.add('toc-collapsed');
    setArrow();
    tocTitle.style.cursor = 'pointer';
    tocTitle.addEventListener('click', function () {
      toc.classList.toggle('toc-collapsed');
      localStorage.setItem(colKey, toc.classList.contains('toc-collapsed') ? '1' : '0');
      setArrow();
    });
    function setArrow() {
      var arrow = tocTitle.querySelector('.toc-arrow');
      if (!arrow) { arrow = document.createElement('span'); arrow.className = 'toc-arrow'; tocTitle.appendChild(arrow); }
      arrow.textContent = toc.classList.contains('toc-collapsed') ? ' ▸' : ' ▾';
    }
  });
})();
