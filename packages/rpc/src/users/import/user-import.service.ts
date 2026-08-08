import { createManagedUserSchema, type CreateManagedUserInput } from '@repo/api';
import { BadRequestException, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import readXlsxFile, { type CellValue as Cell, type Row } from 'read-excel-file/node';
import { UserProvisioningService } from '../services/user-provisioning.service';

export const IMPORT_FIELDS = ['email', 'name', 'firstName', 'lastName', 'preferredLocale', 'streetName', 'houseNumber', 'postcode', 'city', 'phoneNumber', 'bankAccountNumber', 'birthDate', 'bondNumber', 'leaveDate', 'backNumber', 'refereeLicense'] as const;
export type ImportField = (typeof IMPORT_FIELDS)[number];
export type ImportMapping = Record<string, ImportField>;

const aliases: Record<ImportField, string[]> = {
  email: ['email', 'e-mail', 'emailadres', 'e-mailadres'], name: ['name', 'naam', 'volledige naam'],
  firstName: ['firstname', 'first name', 'voornaam'], lastName: ['lastname', 'last name', 'achternaam'],
  preferredLocale: ['language', 'language preference', 'taal', 'voorkeurstaal'], streetName: ['street', 'street name', 'straat', 'straatnaam'],
  houseNumber: ['house number', 'housenumber', 'huisnummer'], postcode: ['postcode', 'postal code'], city: ['city', 'plaats', 'woonplaats'],
  phoneNumber: ['phone', 'phone number', 'telephone', 'telefoon', 'telefoonnummer'], bankAccountNumber: ['iban', 'bank account', 'rekeningnummer'],
  birthDate: ['birth date', 'date of birth', 'geboortedatum'], bondNumber: ['bond number', 'bondsnummer', 'knkv nummer', 'knkv-nummer'],
  leaveDate: ['leave date', 'left', 'afmelddatum', 'lid tot'],
  backNumber: ['back number', 'rugnummer'], refereeLicense: ['referee license', 'scheidsrechterslicentie'],
};

export type ParsedImportRow = { rowNumber: number; input?: CreateManagedUserInput; errors: string[] };

@Injectable()
export class UserImportService {
  constructor(private readonly provisioning: UserProvisioningService) {}

  hash(file: Buffer): string { return createHash('sha256').update(file).digest('hex'); }

  async preview(file: Buffer, sheetName?: string, headerRow = 1, mapping?: ImportMapping) {
    assertWorkbook(file, headerRow);
    const workbook = await readXlsxFile(file);
    const sheets = workbook.map((sheet) => sheet.sheet);
    const selectedSheet = sheetName || sheets[0];
    if (!selectedSheet || !sheets.includes(selectedSheet)) throw new BadRequestException('Worksheet not found.');
    const rows = workbook.find((sheet) => sheet.sheet === selectedSheet)!.data;
    const { headers, dataRows } = extractRows(rows, headerRow);
    const suggestedMapping = suggestMapping(headers);
    const parsedRows = mapping ? mapRows(headers, dataRows, headerRow, mapping) : [];
    return { fileHash: this.hash(file), sheets, selectedSheet, headerRow, headers, suggestedMapping, sampleRows: dataRows.slice(0, 10), totalRows: dataRows.length, parsedRows: parsedRows.slice(0, 50) };
  }

  async execute(file: Buffer, expectedHash: string, sheetName: string, headerRow: number, mapping: ImportMapping, actorUserId: string) {
    assertWorkbook(file, headerRow);
    if (this.hash(file) !== expectedHash) throw new BadRequestException('The workbook differs from the previewed file.');
    const workbook = await readXlsxFile(file);
    const rows = workbook.find((sheet) => sheet.sheet === sheetName)?.data;
    if (!rows) throw new BadRequestException('Worksheet not found.');
    const { headers, dataRows } = extractRows(rows, headerRow);
    const parsed = mapRows(headers, dataRows, headerRow, mapping);
    const duplicateKeys = new Set<string>();
    const seenEmails = new Set<string>();
    const seenBonds = new Set<string>();
    for (const row of parsed) {
      if (!row.input) continue;
      const email = row.input.email;
      if (seenEmails.has(email)) duplicateKeys.add(`email:${email}`); else seenEmails.add(email);
      const bond = row.input.bondNumber;
      if (bond && seenBonds.has(bond)) duplicateKeys.add(`bond:${bond}`); else if (bond) seenBonds.add(bond);
    }
    const results: Array<{ rowNumber: number; status: 'created' | 'invalid' | 'skipped' | 'failed'; userId?: string; errors: string[] }> = [];
    for (let index = 0; index < parsed.length; index += 5) {
      const chunk = parsed.slice(index, index + 5);
      results.push(...await Promise.all(chunk.map(async (row) => {
        if (!row.input) return { rowNumber: row.rowNumber, status: 'invalid' as const, errors: row.errors };
        if (duplicateKeys.has(`email:${row.input.email}`) || (row.input.bondNumber && duplicateKeys.has(`bond:${row.input.bondNumber}`))) {
          return { rowNumber: row.rowNumber, status: 'skipped' as const, errors: ['Duplicate email or bond number in workbook.'] };
        }
        try {
          const user = await this.provisioning.create(row.input, actorUserId);
          return { rowNumber: row.rowNumber, status: 'created' as const, userId: user.id, errors: [] };
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          const duplicate = /duplicate|already exists|unique/i.test(message);
          return { rowNumber: row.rowNumber, status: duplicate ? 'skipped' as const : 'failed' as const, errors: [duplicate ? 'Email or bond number already exists.' : 'Creation failed.'] };
        }
      })));
    }
    const count = (status: string) => results.filter((result) => result.status === status).length;
    console.info(JSON.stringify({ event: 'users.import_completed', total: results.length, created: count('created'), invalid: count('invalid'), skipped: count('skipped'), failed: count('failed') }));
    return { total: results.length, created: count('created'), invalid: count('invalid'), skipped: count('skipped'), failed: count('failed'), emailQueued: count('created'), rows: results };
  }
}

export function mapRows(headers: string[], rows: Row[], headerRow: number, mapping: ImportMapping): ParsedImportRow[] {
  validateMapping(headers, mapping);
  return rows.map((row, index) => {
    const raw: Record<string, unknown> = {};
    headers.forEach((header, column) => { const field = mapping[header]; if (field) raw[field] = normalizeCell(field, row[column] ?? null); });
    const parsed = createManagedUserSchema.safeParse(raw);
    return parsed.success ? { rowNumber: headerRow + index + 1, input: parsed.data, errors: [] } : { rowNumber: headerRow + index + 1, errors: parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`) };
  });
}

export function suggestMapping(headers: string[]): ImportMapping {
  const result: ImportMapping = {};
  for (const header of headers) {
    const normalized = normalizeHeader(header);
    const target = IMPORT_FIELDS.find((field) => aliases[field].some((alias) => normalizeHeader(alias) === normalized));
    if (target && !Object.values(result).includes(target)) result[header] = target;
  }
  return result;
}

function validateMapping(headers: string[], mapping: ImportMapping): void {
  const targets = Object.values(mapping);
  if (!targets.includes('email')) throw new BadRequestException('Email must be mapped.');
  if (!targets.some((target) => ['name', 'firstName', 'lastName'].includes(target))) throw new BadRequestException('A name field must be mapped.');
  if (new Set(targets).size !== targets.length) throw new BadRequestException('A database field can only be mapped once.');
  if (Object.keys(mapping).some((header) => !headers.includes(header))) throw new BadRequestException('Mapping contains an unknown header.');
}

function extractRows(rows: Row[], headerRow: number): { headers: string[]; dataRows: Row[] } {
  const header = rows[headerRow - 1];
  if (!header) throw new BadRequestException('Header row is outside the worksheet.');
  const headers = header.map((cell) => String(cell ?? '').trim());
  if (headers.some((value) => !value)) throw new BadRequestException('Header cells cannot be empty.');
  if (new Set(headers.map(normalizeHeader)).size !== headers.length) throw new BadRequestException('Headers must be unique.');
  const dataRows = rows.slice(headerRow).filter((row) => row.some((cell) => cell !== null && cell !== ''));
  if (dataRows.length > 1000) throw new BadRequestException('A workbook can contain at most 1,000 data rows.');
  return { headers, dataRows };
}

function normalizeCell(field: ImportField, value: Cell | null): unknown {
  if (value === null || value === '') return null;
  if (field === 'preferredLocale') {
    const normalized = String(value).trim().toLowerCase();
    if (['nl', 'nederlands', 'dutch'].includes(normalized)) return 'nl';
    if (['en', 'engels', 'english'].includes(normalized)) return 'en';
    return normalized;
  }
  if (['birthDate', 'leaveDate'].includes(field)) return parseDate(value);
  if (field === 'backNumber') return typeof value === 'number' ? value : Number(value);
  return String(value).trim();
}

function parseDate(value: Cell): unknown {
  if (value instanceof Date && !Number.isNaN(value.valueOf())) return value.toISOString().slice(0, 10);
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const dutch = /^(\d{2})-(\d{2})-(\d{4})$/.exec(text);
  if (dutch) return `${dutch[3]}-${dutch[2]}-${dutch[1]}`;
  return text;
}

function normalizeHeader(value: string): string { return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' '); }
function assertWorkbook(file: Buffer, headerRow: number): void {
  if (!file.length || file.length > 5 * 1024 * 1024) throw new BadRequestException('Workbook must be between 1 byte and 5 MB.');
  if (headerRow < 1 || !Number.isInteger(headerRow)) throw new BadRequestException('Header row must be a positive integer.');
}
