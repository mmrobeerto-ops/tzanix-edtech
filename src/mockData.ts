export interface ServerTraffic {
    ip: string;
    target_ip: string;
    latency_ms: number;
    packets_sec: number;
    estado_coherencia: number; // 0.0 (anomalous) to 1.0 (normal)
    is_anomaly: boolean;
}

export function generateCyberData(timeSec: number): ServerTraffic[] {
    const data: ServerTraffic[] = [];
    const numServers = 50;
    const targetCore = "10.0.0.1";
    
    // Simulate a DDoS attack that peaks between time 10 and 20
    const isDdosActive = timeSec > 10 && timeSec < 20;

    for (let i = 0; i < numServers; i++) {
        const ip = `192.168.1.${10 + i}`;
        
        // Base normal traffic
        let latency = 12 + Math.random() * 5;
        let packets = 2000 + Math.random() * 1000;
        let coherencia = 0.95 + Math.random() * 0.05;
        let anomaly = false;

        // If DDoS is active, compromise some servers
        if (isDdosActive && i % 3 === 0) {
            latency = 400 + Math.random() * 200; // High latency
            packets = 15000 + Math.random() * 5000; // Massive traffic
            coherencia = 0.05 + Math.random() * 0.1; // Chaotic phase
            anomaly = true;
        }

        data.push({
            ip: ip,
            target_ip: targetCore,
            latency_ms: latency,
            packets_sec: packets,
            estado_coherencia: coherencia,
            is_anomaly: anomaly,
        });
    }

    return data;
}

export function ipToFrequencies(ip: string): {fx: number, fy: number, fz: number} {
    // Hash IP string to stable frequencies between 0.5 and 2.5
    let hash = 0;
    for (let i = 0; i < ip.length; i++) {
        hash = (hash << 5) - hash + ip.charCodeAt(i);
        hash |= 0;
    }
    const seed = Math.abs(hash);
    return {
        fx: 0.8 + ((seed % 100) / 50.0),
        fy: 0.8 + (((seed >> 4) % 100) / 50.0),
        fz: 0.8 + (((seed >> 8) % 100) / 50.0)
    };
}
