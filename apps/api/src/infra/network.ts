import os from 'os';

function isVirtualIface(name: string, addr: string) {
  const lname = name.toLowerCase();
  // common virtual adapter names or addresses
  if (lname.includes('virtual') || lname.includes('vm') || lname.includes('vbox') || lname.includes('docker') || lname.includes('host-only')) return true;
  // ranges commonly used by virtual adapters we want to avoid selecting by default
  if (addr.startsWith('192.168.56.') || addr.startsWith('10.0.75.') || addr.startsWith('169.254.')) return true;
  return false;
}

export function getLocalIp(): string {
  const interfaces = os.networkInterfaces();
  const candidates: { name: string; addr: string }[] = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        candidates.push({ name, addr: iface.address });
      }
    }
  }

  if (candidates.length === 0) return 'localhost';

  // Prefer addresses on Wi‑Fi / wireless / ethernet interfaces
  const preferred = candidates.find(c => {
    const n = c.name.toLowerCase();
    return (n.includes('wi') || n.includes('wireless') || n.includes('wlan') || n.includes('eth') || n.includes('en')) && !isVirtualIface(c.name, c.addr);
  });
  if (preferred) return preferred.addr;

  // Otherwise, pick the first candidate that doesn't look virtual
  const nonVirtual = candidates.find(c => !isVirtualIface(c.name, c.addr));
  if (nonVirtual) return nonVirtual.addr;

  // Fallback to first candidate
  return candidates[0].addr;
}

export default getLocalIp;
