import { useCallback, useEffect, useRef, useState } from 'react';
import type { CommitteeId, Route } from './types';
import { getCommittee } from './data/committees';
import { useReducedMotion } from './hooks/useMediaQuery';
import { PixelField } from './components/PixelField';
import { Loader } from './components/Loader';
import { EntranceScene } from './scenes/EntranceScene';
import { HallScene } from './scenes/HallScene';
import { CommitteeDetail } from './scenes/CommitteeDetail';

/* Hash routes:  #/  → entrance,  #/committees → hall,  #/committees/<id> → detail.
   Hash routing keeps deep links & the browser back button working on any static host. */
function parseHash(hash: string): Route {
  const m = hash.replace(/^#\/?/, '').split('/');
  if (m[0] !== 'committees') return { scene: 'entrance' };
  if (m[1] && getCommittee(m[1])) return { scene: 'detail', id: m[1] as CommitteeId };
  return { scene: 'hall' };
}
const toHash = (r: Route) =>
  r.scene === 'entrance' ? '' : r.scene === 'hall' ? '#/committees' : `#/committees/${r.id}`;

export default function App() {
  const reduced = useReducedMotion();
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  const [ready, setReady] = useState(false);
  const lastCommittee = useRef<CommitteeId | undefined>(undefined);

  // Wait for the Arabic web fonts (max 1.6s) so headlines never reflow mid-animation.
  useEffect(() => {
    let done = false;
    const finish = () => {
      if (!done) {
        done = true;
        setReady(true);
      }
    };
    document.fonts?.ready.then(finish).catch(finish);
    const t = window.setTimeout(finish, 1600);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const onPop = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((r: Route) => {
    const hash = toHash(r);
    if (window.location.hash !== hash) {
      window.history.pushState(null, '', hash || window.location.pathname + window.location.search);
    }
    if (r.scene === 'detail') lastCommittee.current = r.id;
    setRoute(r);
    window.scrollTo(0, 0);
  }, []);

  const committee = route.scene === 'detail' ? getCommittee(route.id) : undefined;
  if (committee) lastCommittee.current = committee.id;

  const home = () => navigate({ scene: 'entrance' });
  const hall = () => navigate({ scene: 'hall' });
  const open = (id: CommitteeId) => navigate({ scene: 'detail', id });

  return (
    <main className="app">
      <PixelField tint={committee?.accent} reduced={reduced} />

      {!ready && <Loader />}

      {ready && route.scene === 'entrance' && <EntranceScene reduced={reduced} onEnter={hall} />}
      {ready && route.scene === 'hall' && (
        <HallScene reduced={reduced} onSelect={open} onHome={home} initialId={lastCommittee.current} />
      )}
      {ready && committee && (
        <CommitteeDetail
          key={committee.id}
          committee={committee}
          reduced={reduced}
          onBack={hall}
          onSwitch={open}
          onHome={home}
        />
      )}

      {/* Shared light layer used by GSAP for cinematic scene transitions. */}
      <div id="scene-veil" className="veil" aria-hidden="true" />
    </main>
  );
}
