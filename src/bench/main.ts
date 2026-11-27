import './bench.css';
import { startBench } from './boot';

// The page's one entry. Everything it does is in boot.ts, where a test can
// reach it without a page around it.
const container = document.getElementById('bench');
if (container) void startBench({ container });
