import { installNoNetworkGuard } from './harness/no-network';

// Runs before every test file. See tests/harness/no-network.ts.
installNoNetworkGuard();
