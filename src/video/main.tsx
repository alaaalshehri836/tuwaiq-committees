import { createRoot } from 'react-dom/client';
import VideoApp from './VideoApp';
import '../styles/index.css';
import './video.css';

// No StrictMode here: the master timeline must be built exactly once.
createRoot(document.getElementById('root')!).render(<VideoApp />);
