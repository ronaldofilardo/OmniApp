import { networkInterfaces } from 'os';

export default function getLocalIp(): string {
  const nets = networkInterfaces();
  const results: string[] = [];

  for (const name of Object.keys(nets)) {
    const net = nets[name];
    if (net) {
      for (const netInfo of net) {
        // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
        if (netInfo.family === 'IPv4' && !netInfo.internal) {
          results.push(netInfo.address);
        }
      }
    }
  }

  // Return first external IPv4 address, or localhost as fallback
  return results[0] || 'localhost';
}