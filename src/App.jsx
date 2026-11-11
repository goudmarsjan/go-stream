import React, { useEffect, useMemo, useRef, useState } from 'react';
import mpegts from 'mpegts.js';
import { Clapperboard, Tv, Search, Settings, Heart, Play, Film, Radio, X, RefreshCw, Link2, ChevronLeft } from 'lucide-react';

const savedUrl = () => localStorage.getItem('gostream_playlist_url') || '';
function parseM3U(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/);
  const items = [];
  let meta = null;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('#EXTINF')) {
      const name = line.split(',').slice(1).join(',').trim() || 'Onbekende stream';
      const attr = (key) => line.match(new RegExp(key + '="([^"]*)"','i'))?.[1] || '';
      meta = { name, group: attr('group-title') || 'Overig', logo: attr('tvg-logo'), id: attr('tvg-id'), type: /series|serie/i.test(attr('group-title')) ? 'series' : 'live' };
    } else if (!line.startsWith('#') && meta) {
      items.push({ ...meta, url: line, key: line + items.length });
      meta = null;
    }
  }
  return items;
}
function App() {
  const [playlistUrl, setPlaylistUrl] = useState(savedUrl());
  const [draftUrl, setDraftUrl] = useState(savedUrl());
  const [items, setItems] = useState([]);
  const [activeTab, setActiveTab] = useState('home');
  const [category, setCategory] = useState('Alles');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem('gostream_favorites') || '[]'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const videoRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => { localStorage.setItem('gostream_favorites', JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => {
    if (!selected || !videoRef.current) return;
    if (playerRef.current) { playerRef.current.destroy(); playerRef.current = null; }
    const video = videoRef.current;
    if (mpegts.isSupported() && /\.ts(\?|$)|output=ts/i.test(selected.url)) {
      const player = mpegts.createPlayer({ type: 'mpegts', isLive: true, url: selected.url }, { enableWorker: true, enableStashBuffer: true });
      playerRef.current = player; player.attachMediaElement(video); player.load();
      player.play().catch(() => {});
    } else {
      video.src = selected.url;
      video.play().catch(() => {});
    }
    return () => { if (playerRef.current) { playerRef.current.destroy(); playerRef.current = null; } };
  }, [selected]);
  const groups = useMemo(() => ['Alles', ...new Set(items.map(x => x.group))], [items]);
  const filtered = useMemo(() => items.filter(x => {
    const tabMatch = activeTab === 'favorites' ? favorites.includes(x.key) :
      activeTab === 'live' ? x.type === 'live' :
      activeTab === 'series' ? /series|serie/i.test(x.group) :
      activeTab === 'movies' ? /movie|film|vod/i.test(x.group) : true;
    return tabMatch && (category === 'Alles' || x.group === category) && x.name.toLowerCase().includes(query.toLowerCase());
  }), [items, activeTab, favorites, category, query]);
  async function loadPlaylist(url = draftUrl) {
    if (!url.trim()) { setError('Vul eerst je M3U-playlistlink in.'); return; }
    setLoading(true); setError('');
    try {
      // In the native Android app, Capacitor patches fetch to use the device's
      // native HTTP stack. This avoids browser CORS and Vercel-origin restrictions.
      // The hosted website keeps using the small server endpoint as a fallback.
      const nativeApp = Boolean(window.Capacitor?.isNativePlatform?.());
      let text = '';
      if (nativeApp) {
        const response = await fetch(url.trim(), { method: 'GET', cache: 'no-store' });
        if (!response.ok) throw new Error('De IPTV-provider antwoordde met HTTP ' + response.status + '.');
        text = await response.text();
      } else {
        const response = await fetch('/api/playlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playlistUrl: url.trim() })
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || 'De playlist kon niet worden opgehaald (HTTP ' + response.status + ').');
        text = payload.playlist || '';
      }
      const parsed = parseM3U(text);
      if (!parsed.length) throw new Error('Geen streams gevonden. Controleer de link of het M3U-formaat.');
      setItems(parsed); setPlaylistUrl(url.trim()); setDraftUrl(url.trim());
      localStorage.setItem('gostream_playlist_url', url.trim());
      setCategory('Alles'); setActiveTab('home'); setShowSettings(false);
    } catch (e) {
      setError(e.message || 'Er ging iets mis bij het ophalen van de playlist.');
    } finally { setLoading(false); }
  }
  function toggleFavorite(item) {
    setFavorites(old => old.includes(item.key) ? old.filter(k => k !== item.key) : [...old, item.key]);
  }
  const tabs = [
    ['home','Ontdekken',Clapperboard], ['live','Live tv',Tv], ['movies','Films',Film],
    ['series','Series',Play], ['favorites','Mijn lijst',Heart]
  ];
  return <div className="app-shell">
    <header className="topbar">
      <button className="brand" onClick={() => {setActiveTab('home');setSelected(null)}}><span className="brand-mark">G</span><span>GO<span className="brand-light"> STREAM</span></span></button>
      <div className="top-actions"><div className="searchbox"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Zoek films, series of zenders..." /></div><button className="icon-btn" onClick={()=>setShowSettings(true)} aria-label="Instellingen"><Settings/></button></div>
    </header>
    <div className="layout">
      <aside className="sidebar">{tabs.map(([id,label,Icon])=><button key={id} className={'nav-item '+(activeTab===id?'active':'')} onClick={()=>{setActiveTab(id);setSelected(null);setCategory('Alles')}}><Icon size={19}/><span>{label}</span></button>)}<div className="sidebar-bottom"><span className="status-dot"/>{items.length ? items.length+' streams geladen' : 'Geen playlist geladen'}</div></aside>
      <main className="main">
        {selected ? <section className="player-page"><button className="back-btn" onClick={()=>setSelected(null)}><ChevronLeft size={18}/> Terug naar overzicht</button><div className="video-wrap"><video ref={videoRef} controls autoPlay playsInline /></div><div className="player-info"><div><h1>{selected.name}</h1><p>{selected.group}</p></div><button className={'favorite-btn '+(favorites.includes(selected.key)?'chosen':'')} onClick={()=>toggleFavorite(selected)}><Heart size={19}/></button></div></section> :
        <>
          <section className="hero"><div className="hero-copy"><span className="eyebrow">JOUW ENTERTAINMENT. ÉÉN PLEK.</span><h1>Vanavond kijk je<br/><em>iets goeds.</em></h1><p>Je films, series en live-tv overzichtelijk bij elkaar.</p><button className="primary-btn" onClick={()=>items.length?setActiveTab('movies'):setShowSettings(true)}><Play size={17} fill="currentColor"/> {items.length?'Ontdek je aanbod':'Playlist toevoegen'}</button></div><div className="hero-art"><div className="orb orb-one"/><div className="orb orb-two"/><div className="poster-stack"><div className="poster p1">CINEMA</div><div className="poster p2">SERIES</div><div className="poster p3"><Play size={32}/></div></div></div></section>
          {!items.length ? <section className="empty-state"><div className="empty-icon"><Link2 size={27}/></div><h2>Verbind je playlist</h2><p>Voeg je M3U Plus-link toe om je beschikbare streams in GO STREAM te laden.</p><button className="primary-btn" onClick={()=>setShowSettings(true)}>Playlist instellen</button></section> :
          <section className="catalog"><div className="section-heading"><div><span className="eyebrow">JOUW BIBLIOTHEEK</span><h2>{activeTab==='home'?'Ontdek':tabs.find(t=>t[0]===activeTab)?.[1]}</h2></div><button className="subtle-btn" onClick={()=>loadPlaylist(playlistUrl)}><RefreshCw size={15}/> Vernieuwen</button></div>
            <div className="categories">{groups.map(g=><button key={g} className={category===g?'selected':''} onClick={()=>setCategory(g)}>{g}</button>)}</div>
            {filtered.length ? <div className="content-grid">{filtered.slice(0,160).map(item=><article className="content-card" key={item.key}><button className="poster-card" onClick={()=>setSelected(item)}>{item.logo?<img src={item.logo} alt="" loading="lazy" onError={e=>e.currentTarget.style.display='none'}/>:<div className="poster-placeholder"><Film size={30}/><span>GO STREAM</span></div>}<span className="play-overlay"><Play size={22} fill="currentColor"/></span></button><div className="card-meta"><div><h3 title={item.name}>{item.name}</h3><p>{item.group}</p></div><button className={'mini-fav '+(favorites.includes(item.key)?'chosen':'')} onClick={()=>toggleFavorite(item)} aria-label="Favoriet"><Heart size={16}/></button></div></article>)}</div> : <div className="no-results"><Radio size={25}/><p>Geen resultaten in deze selectie.</p></div>}
            {filtered.length>160&&<p className="limit-note">De eerste 160 resultaten worden getoond. Gebruik zoeken of categorieën om verder te filteren.</p>}
          </section>}
        </>}
      </main>
    </div>
    {showSettings&&<div className="modal-backdrop" onClick={()=>setShowSettings(false)}><section className="settings-modal" onClick={e=>e.stopPropagation()}><div className="modal-heading"><div><span className="eyebrow">VERBINDEN</span><h2>Playlist instellen</h2></div><button className="icon-btn" onClick={()=>setShowSettings(false)}><X/></button></div><p className="modal-description">Plak je M3U Plus-link. GO STREAM haalt de playlist via een beveiligde serverfunctie op zodat browser-CORS geen probleem vormt.</p><label htmlFor="playlist">M3U-playlist URL</label><input id="playlist" className="url-input" type="url" value={draftUrl} onChange={e=>setDraftUrl(e.target.value)} placeholder="http://provider/get.php?username=..." autoComplete="off"/>{error&&<p className="error-msg">{error}</p>}<button className="primary-btn full-btn" disabled={loading} onClick={()=>loadPlaylist()}>{loading?'Playlist laden...':'Playlist verbinden'}</button><p className="privacy-note">Je playlistlink wordt op dit toestel bewaard. Hij wordt niet in GitHub-code opgeslagen. Gebruik alleen streams waarvoor je toestemming hebt. Verander je wachtwoord als je het eerder publiek hebt gedeeld.</p></section></div>}
    <footer>GO STREAM <span>•</span> JOUW PERSOONLIJKE STREAMINGPLEK</footer>
  </div>;
}
export default App;