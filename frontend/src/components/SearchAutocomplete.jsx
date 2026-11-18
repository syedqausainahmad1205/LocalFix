import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Zap,
  Droplets,
  Hammer,
  Wind,
  Sparkles,
  Laptop,
  GraduationCap,
  Scissors,
  Paintbrush,
  Home,
  Wrench,
  BookOpen,
  ArrowRight
} from 'lucide-react';

// Comprehensive local services dictionary with keywords, common typos, and teaching delivery modes
const SERVICE_SUGGESTIONS = [
  {
    id: 'teaching_online_offline',
    title: 'Teaching — Home & Online Tutors',
    subtitle: '1-on-1 Online Classes & Doorstep Home Tuition',
    categorySlug: 'tutors',
    workType: 'Teaching (Online & Offline)',
    icon: GraduationCap,
    keywords: [
      'teaching', 'tutor', 'tutur', 'techar', 'teacher', 'tuition', 'tution', 'online teaching',
      'offline teaching', 'home tuition', 'study', 'education', 'math tutor', 'science tutor',
      'english tutor', 'coding tutor', 'physics', 'chemistry', 'biology', 'boards', 'cbse'
    ]
  },
  {
    id: 'teaching_math_science',
    title: 'Mathematics & Science Teaching',
    subtitle: 'Class 6th to 12th Board Exam Specialists',
    categorySlug: 'tutors',
    workType: 'Teaching',
    icon: BookOpen,
    keywords: [
      'math', 'mathematics', 'maths', 'science', 'physics', 'chemistry', 'biology',
      'calculus', 'algebra', 'stem', 'board exam', '10th', '12th'
    ]
  },
  {
    id: 'teaching_online_classes',
    title: 'Online Video Tutoring (Virtual Classroom)',
    subtitle: 'Interactive live online sessions via Zoom/Meet',
    categorySlug: 'tutors',
    workType: 'Teaching (Online)',
    icon: GraduationCap,
    keywords: [
      'online class', 'online tutor', 'virtual tutor', 'digital class', 'zoom class',
      'web teaching', 'remote tutor', 'computer science tutor', 'coding class'
    ]
  },
  {
    id: 'teaching_home_tuition',
    title: 'Offline Home Tuition (Doorstep)',
    subtitle: 'Verified personal home tutors visiting your home',
    categorySlug: 'tutors',
    workType: 'Teaching (Offline)',
    icon: Home,
    keywords: [
      'offline tutor', 'home tutor', 'doorstep tutor', 'in person tutor', 'home tuition',
      'offline tuition', 'private teacher', 'neighborhood tutor'
    ]
  },
  {
    id: 'electrician',
    title: 'Electrician & Electrical Wiring',
    subtitle: 'Switchboards, MCB repair, wiring & lighting',
    categorySlug: 'electrician',
    workType: 'Electrical Repair',
    icon: Zap,
    keywords: [
      'electrician', 'electrisian', 'electrcian', 'electrishan', 'electric', 'bijli',
      'wiring', 'switchboard', 'mcb', 'fan repair', 'light fitting', 'inverter', 'short circuit'
    ]
  },
  {
    id: 'plumber',
    title: 'Plumber & Sanitary Fitting',
    subtitle: 'Pipe leakage, taps, toilet installation & water tanks',
    categorySlug: 'plumber',
    workType: 'Plumbing Service',
    icon: Droplets,
    keywords: [
      'plumber', 'plamber', 'plambor', 'plumbar', 'plumbing', 'pipe', 'leakage',
      'tap', 'water tank', 'sanitary', 'drainage', 'faucet', 'toilet repair', 'nal'
    ]
  },
  {
    id: 'carpenter',
    title: 'Carpenter & Woodwork',
    subtitle: 'Furniture assembly, lock repair, doors & modular fittings',
    categorySlug: 'carpenter',
    workType: 'Carpentry',
    icon: Hammer,
    keywords: [
      'carpenter', 'carpantar', 'carpentar', 'carpanter', 'wood', 'furniture', 'door lock',
      'bed repair', 'cupboard', 'woodwork', 'modular kitchen', 'table', 'barhai'
    ]
  },
  {
    id: 'ac_repair',
    title: 'AC Repair & Jet Servicing',
    subtitle: 'Deep foam jet wash, gas refill & PCB motherboard fix',
    categorySlug: 'ac-repair',
    workType: 'HVAC & Cooling',
    icon: Wind,
    keywords: [
      'ac repair', 'ac service', 'ac repar', 'air conditioner', 'cooling', 'gas refill',
      'split ac', 'window ac', 'jet cleaning', 'compressor', 'cooling fix', 'ac not cooling'
    ]
  },
  {
    id: 'home_cleaning',
    title: 'Home Deep Cleaning & Maid',
    subtitle: 'Full house sanitization, kitchen & bathroom deep scrub',
    categorySlug: 'cleaning',
    workType: 'Cleaning & Sanitization',
    icon: Sparkles,
    keywords: [
      'cleaning', 'cleening', 'cleenar', 'cleaner', 'maid', 'safai', 'deep cleaning',
      'bathroom cleaning', 'kitchen cleaning', 'floor scrub', 'sofa dry clean'
    ]
  },
  {
    id: 'laptop_repair',
    title: 'Laptop & Computer Repair',
    subtitle: 'Screen replacement, OS installation & hardware upgrade',
    categorySlug: 'laptop-technician',
    workType: 'IT Hardware',
    icon: Laptop,
    keywords: [
      'laptop', 'computer', 'lap top', 'pc repair', 'laptop repair', 'macbook',
      'windows', 'screen replacement', 'hard disk', 'ram upgrade', 'virus removal', 'keyboard'
    ]
  },
  {
    id: 'barber_salon',
    title: 'Barber & Salon at Home',
    subtitle: 'Men haircut, beard grooming, facial & head massage',
    categorySlug: 'barber-salon',
    workType: 'Personal Grooming',
    icon: Scissors,
    keywords: [
      'barber', 'salon', 'barbar', 'haircut', 'hair cut', 'beard', 'grooming',
      'facial', 'massage', 'men grooming', 'shave'
    ]
  },
  {
    id: 'painter',
    title: 'Painter & Waterproofing',
    subtitle: 'Interior/exterior wall painting, putty & crack sealing',
    categorySlug: 'painter-waterproofing',
    workType: 'Painting & Waterproofing',
    icon: Paintbrush,
    keywords: [
      'painter', 'paintr', 'painting', 'rangai', 'waterproofing', 'wall paint',
      'putty', 'seepage', 'texture paint', 'distemper'
    ]
  },
  {
    id: 'appliance_repair',
    title: 'Appliance Repair & Technician',
    subtitle: 'Washing machine, refrigerator, microwave & geyser repair',
    categorySlug: 'electrician',
    workType: 'Appliance Service',
    icon: Wrench,
    keywords: [
      'appliance', 'refrigerator', 'fridge', 'washing machine', 'microwave',
      'geyser', 'water heater', 'ro repair', 'water purifier'
    ]
  }
];

// Levenshtein distance algorithm for spelling error tolerance
function getLevenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1) // insertion / deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Calculate fuzzy matching score between user query and suggestions
function matchScore(query, item) {
  const q = query.toLowerCase().trim();
  if (!q) return 0;

  // 1. Direct title or workType startsWith
  if (item.title.toLowerCase().startsWith(q)) return 100;
  if (item.title.toLowerCase().includes(q)) return 80;

  // 2. Keyword exact startsWith or includes
  for (const kw of item.keywords) {
    if (kw === q) return 95;
    if (kw.startsWith(q)) return 85;
    if (kw.includes(q)) return 70;
  }

  // 3. Spelling tolerance / fuzzy matching on query tokens
  const queryTokens = q.split(/\s+/);
  for (const token of queryTokens) {
    if (token.length >= 3) {
      for (const kw of item.keywords) {
        // Compare with individual keyword tokens
        const kwTokens = kw.split(/\s+/);
        for (const kwToken of kwTokens) {
          if (kwToken.length >= 3) {
            const dist = getLevenshteinDistance(token, kwToken);
            const maxAllowedDist = token.length <= 4 ? 1 : token.length <= 7 ? 2 : 3;
            if (dist <= maxAllowedDist) {
              return 60 - dist * 10;
            }
          }
        }
      }
    }
  }

  return 0;
}

export default function SearchAutocomplete({
  value = '',
  onChange = () => {},
  onSelect = null,
  placeholder = 'Electrician, Teaching, Plumber, AC Repair...',
  className = '',
  inputClassName = '',
  selectedCity = 'All Cities',
  userCoords = null
}) {
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (!query || query.trim().length === 0) {
      setFilteredSuggestions([]);
      setIsOpen(false);
      return;
    }

    const scored = SERVICE_SUGGESTIONS.map((item) => ({
      item,
      score: matchScore(query, item)
    }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score);

    setFilteredSuggestions(scored.map((entry) => entry.item).slice(0, 5));
    setIsOpen(scored.length > 0);
    setSelectedIndex(-1);
  }, [query]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);
  };

  const handleSelectSuggestion = (suggestion) => {
    setQuery(suggestion.title);
    onChange(suggestion.title);
    setIsOpen(false);

    if (onSelect) {
      onSelect(suggestion);
      return;
    }

    // Default navigation behavior: navigate to /search with matching category and query
    const params = new URLSearchParams();
    if (suggestion.categorySlug) {
      params.append('category', suggestion.categorySlug);
    }
    params.append('q', suggestion.title);
    if (selectedCity && selectedCity !== 'All Cities') {
      params.append('city', selectedCity);
    }
    if (userCoords?.lat && userCoords?.lon) {
      params.append('latitude', userCoords.lat.toString());
      params.append('longitude', userCoords.lon.toString());
    }
    navigate(`/search?${params.toString()}`);
  };

  const handleKeyDown = (e) => {
    if (!isOpen || filteredSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredSuggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredSuggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && selectedIndex < filteredSuggestions.length) {
        e.preventDefault();
        handleSelectSuggestion(filteredSuggestions[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="flex items-center gap-2.5 w-full">
        <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (filteredSuggestions.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className={`w-full text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-transparent outline-none ${inputClassName}`}
        />
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && filteredSuggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2.5 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 divide-y divide-slate-100 dark:divide-slate-800">
          <div className="p-2.5 bg-slate-50/80 dark:bg-slate-800/40 text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Matching Services & Verified Specialists</span>
            <span className="text-[10px] text-blue-600 dark:text-blue-400">Spelling-tolerant</span>
          </div>

          <div className="p-1 space-y-0.5">
            {filteredSuggestions.map((s, index) => {
              const IconComp = s.icon || Search;
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSelectSuggestion(s)}
                  className={`w-full text-left p-2.5 rounded-xl transition flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-800'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {s.title}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {s.workType}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {s.subtitle}
                      </p>
                    </div>
                  </div>

                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
