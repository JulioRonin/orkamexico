import { parse } from 'csv-parse/sync';
import fs from 'fs';

export function readCsv<T = Record<string, string>>(filePath: string): T[] {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return parse(raw, {
        columns: true,
        skip_empty_lines: true,
        bom: true,
        relax_quotes: true,
        relax_column_count: true,
        trim: true,
    }) as T[];
}

export function parseCurrency(s: string | undefined | null): number {
    if (!s) return 0;
    const cleaned = String(s).replace(/[$,\s"]/g, '').replace(/^-?\(/, '-').replace(/\)$/, '');
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
}

export function parseNumber(s: string | undefined | null): number | null {
    if (!s || s === '') return null;
    const cleaned = String(s).replace(/[,\s"]/g, '');
    const n = parseFloat(cleaned);
    return isNaN(n) ? null : n;
}

export function parseDate(s: string | undefined | null): string | null {
    if (!s || s === '') return null;
    // Try YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0, 10);
    // Try MM/DD/YYYY
    const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (m) {
        const [, mo, d, y] = m;
        return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    // Try Spanish "9 de marzo de 2022"
    const months: Record<string, string> = {
        enero: '01', febrero: '02', marzo: '03', abril: '04', mayo: '05', junio: '06',
        julio: '07', agosto: '08', septiembre: '09', octubre: '10', noviembre: '11', diciembre: '12',
    };
    const sp = s.toLowerCase().match(/(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/);
    if (sp && months[sp[2]]) {
        return `${sp[3]}-${months[sp[2]]}-${sp[1].padStart(2, '0')}`;
    }
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d.toISOString().substring(0, 10);
    return null;
}

export function cleanString(s: string | undefined | null): string | null {
    if (!s) return null;
    const t = String(s).trim();
    return t === '' ? null : t;
}
