import * as fs from 'fs';
import * as tls from 'tls';

export function certificateValuesExported(certificateType: 'PEM' | 'P12' = 'PEM'): boolean {
    const requiredCertificateValues: Record<string, string[]> = {
        PEM: ['DEV_CERT_PEM'],
        P12: ['CERT_LOCATION', 'CERT_PASSPHRASE'],
    };

    let requiredValuesAreSet = true;

    for (const value of requiredCertificateValues[certificateType]) {
        if (!process.env[value]) {
            requiredValuesAreSet = false;
            console.error(`Required value ${value} is not set. Set it with export ${value}="[value]"`);
        }
    }

    return requiredValuesAreSet;
}

export function getCertificateLocation(certificateType: 'PEM' | 'P12' = 'PEM'): string {
    const locationHash: Record<string, string> = {
        PEM: 'DEV_CERT_PEM',
        P12: 'CERT_LOCATION',
    };

    const envVar = locationHash[certificateType];
    const certLocation = process.env[envVar];

    if (!certLocation) {
        throw new Error(`Environment variable ${envVar} is not set.`);
    }

    return certLocation;
}

export const getCertificateAgent = (certLocation: string, certificateType: 'PEM' | 'P12' = 'PEM'): tls.SecureContext => {
    if (certificateType === 'PEM') {
        const certBuffer = fs.readFileSync(certLocation);
        return tls.createSecureContext({
            cert: certBuffer,
        });
    }
    if (certificateType === 'P12') {
        if (!process.env['CERT_PASSPHRASE']) {
            throw new Error('Environment variable CERT_PASSPHRASE is not set.');
        }
        const p12Buffer = fs.readFileSync(certLocation);
        return tls.createSecureContext({    
            pfx: p12Buffer,
            passphrase: process.env['CERT_PASSPHRASE'],
        });
    }
    throw new Error(`Unsupported certificate type: ${certificateType}`);
};

export function buildCombinedCertificate(certLocation: string): tls.SecureContext {
    if (!process.env['CERT_PASSPHRASE']) {
        throw new Error('Environment variable CERT_PASSPHRASE is not set.');
    }

    const p12Buffer = fs.readFileSync(certLocation);
    const secureContext = tls.createSecureContext({
        pfx: p12Buffer,
        passphrase: process.env['CERT_PASSPHRASE'],
    });

    return secureContext;
}