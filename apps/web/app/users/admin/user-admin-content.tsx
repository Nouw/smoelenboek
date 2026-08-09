'use client';

import type { CreateManagedUserInput } from '@repo/api';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent, CardTitle } from '@repo/ui/components/card';
import {
  DataTable,
  type DataTableColumnDef,
} from '@repo/ui/components/data-table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@repo/ui/components/dialog';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import {
  Download,
  FileSpreadsheet,
  Loader2,
  MailPlus,
  EllipsisVertical,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  Users,
} from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';

import { trpc } from '@/app/trpc';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useI18n } from '@/lib/i18n';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu';

type ImportField = keyof CreateManagedUserInput;
type ImportPreview = {
  fileHash: string;
  sheets: string[];
  selectedSheet: string;
  headerRow: number;
  headers: string[];
  suggestedMapping: Record<string, ImportField>;
  sampleRows: unknown[][];
  totalRows: number;
  parsedRows: Array<{ rowNumber: number; errors: string[] }>;
};
type ImportResult = {
  total: number;
  created: number;
  invalid: number;
  skipped: number;
  failed: number;
  emailQueued: number;
  rows: Array<{
    rowNumber: number;
    status: string;
    userId?: string;
    errors: string[];
  }>;
};

const importFields: ImportField[] = [
  'email',
  'firstName',
  'lastName',
  'preferredLocale',
  'streetName',
  'houseNumber',
  'postcode',
  'city',
  'phoneNumber',
  'bankAccountNumber',
  'birthDate',
  'bondNumber',
  'backNumber',
  'refereeLicense',
];
const optionalFields: Array<{
  name: keyof CreateManagedUserInput;
  type?: string;
}> = [
  { name: 'streetName' },
  { name: 'houseNumber' },
  { name: 'postcode' },
  { name: 'city' },
  { name: 'phoneNumber', type: 'tel' },
  { name: 'bankAccountNumber' },
  { name: 'birthDate', type: 'date' },
  { name: 'bondNumber' },
  { name: 'backNumber', type: 'number' },
  { name: 'refereeLicense' },
];

export function UserAdminContent() {
  const { locale } = useI18n();
  const text = copy[locale];
  const currentUser = useCurrentUser();
  const [query, setQuery] = useState('');
  const users = trpc.user.admin.list.useQuery(
    { query, limit: 100, offset: 0 },
    { enabled: currentUser.isAdmin, retry: false },
  );
  const utils = trpc.useUtils();
  const resend = trpc.user.admin.resendInvitation.useMutation({
    onSuccess: () => utils.user.admin.list.invalidate(),
  });
  const userRows = users.data ?? [];
  const userColumns: DataTableColumnDef<(typeof userRows)[number]>[] = [
    {
      accessorKey: 'name',
      header: text.name,
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
      meta: {
        headerClassName: 'md:w-[28%]',
        cellClassName: 'md:w-[28%]',
      },
    },
    {
      accessorKey: 'email',
      header: text.email,
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.email}</span>
      ),
      meta: {
        headerClassName: 'md:w-[28%]',
        cellClassName: 'md:w-[28%]',
      },
    },
    {
      accessorKey: 'preferredLocale',
      header: text.language,
      cell: ({ row }) => row.original.preferredLocale.toUpperCase(),
      meta: {
        headerClassName: 'md:w-[12%]',
        cellClassName: 'md:w-[12%]',
      },
    },
    {
      accessorKey: 'invitationStatus',
      header: text.status,
      cell: ({ row }) => (
        <span className="inline-block rounded-full bg-muted px-2.5 py-1 text-xs">
          {statusLabel(row.original.invitationStatus, text)}
        </span>
      ),
      meta: {
        headerClassName: 'md:w-[16%]',
        cellClassName: 'md:w-[16%]',
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="outline" size="icon">
              <EllipsisVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              <Trash2 />
              Delete
            </DropdownMenuItem>
            {row.original.accountActivatedAt === null && (
              <DropdownMenuItem
                  disabled={resend.isPending}
                  onClick={() => resend.mutate({ userId: row.original.id })}
              >
                <MailPlus />
                {text.resend}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      // row.original.accountActivatedAt === null ? (
      //   <Button
      //     size="sm"
      //     variant="outline"

      //   >
      //     <MailPlus />
      //     {text.resend}
      //   </Button>
      // ) : null,
      meta: {
        headerClassName: 'md:w-[16%]',
        cellClassName: 'empty:hidden md:w-[16%] md:text-right',
      },
    },
  ];

  if (currentUser.isLoading)
    return <State icon={Loader2} spin title={text.loading} />;
  if (!currentUser.isAdmin)
    return (
      <State
        icon={ShieldAlert}
        title={text.forbidden}
        detail={text.forbiddenDetail}
      />
    );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {text.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {text.description}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ImportDialog afterImport={() => users.refetch()} />
          <CreateUserDialog afterCreate={() => users.refetch()} />
        </div>
      </header>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
        <Input
          aria-label={text.search}
          className="pl-9"
          placeholder={text.search}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      {users.isLoading ? (
        <State icon={Loader2} spin title={text.loading} />
      ) : users.isError ? (
        <State
          icon={ShieldAlert}
          title={text.loadFailed}
          detail={users.error.message}
        />
      ) : userRows.length === 0 ? (
        <p className="rounded-xl border p-8 text-center text-sm text-muted-foreground">
          {text.empty}
        </p>
      ) : (
        <DataTable
          caption={text.title}
          columns={userColumns}
          data={userRows}
          getRowId={(user) => user.id}
          presentation="stacked"
        />
      )}
    </div>
  );
}

function CreateUserDialog({ afterCreate }: { afterCreate: () => void }) {
  const { locale } = useI18n();
  const text = copy[locale];
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const create = trpc.user.admin.create.useMutation({
    onSuccess: () => {
      setOpen(false);
      setError(null);
      afterCreate();
    },
    onError: (cause) => setError(cause.message),
  });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const value = (name: string) => String(data.get(name) ?? '').trim();
    const input: CreateManagedUserInput = {
      email: value('email'),
      firstName: value('firstName'),
      lastName: value('lastName'),
      preferredLocale: data.get('preferredLocale') === 'en' ? 'en' : 'nl',
      bondNumber: null,
    };
    for (const field of optionalFields) {
      const raw = value(field.name);
      if (raw)
        (input as Record<string, unknown>)[field.name] =
          field.type === 'number' ? Number(raw) : raw;
    }
    create.mutate(input);
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          {text.newUser}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <form className="space-y-5" onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{text.createTitle}</DialogTitle>
            <DialogDescription>{text.createDetail}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="email" label={text.email} type="email" required />
            <Field name="firstName" label={text.firstName} required />
            <Field name="lastName" label={text.lastName} required />
            <div className="space-y-2">
              <Label htmlFor="preferredLocale">{text.language}</Label>
              <select
                id="preferredLocale"
                name="preferredLocale"
                defaultValue="nl"
                className={selectClass}
              >
                <option value="nl">Nederlands</option>
                <option value="en">English</option>
              </select>
            </div>
            {optionalFields.map((field) => (
              <Field
                key={field.name}
                name={field.name}
                type={field.type}
                label={fieldLabel(field.name, text)}
              />
            ))}
          </div>
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              {text.cancel}
            </Button>
            <Button disabled={create.isPending} type="submit">
              {create.isPending && <Loader2 className="animate-spin" />}
              {text.create}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ImportDialog({ afterImport }: { afterImport: () => void }) {
  const { locale } = useI18n();
  const text = copy[locale];
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [headerRow, setHeaderRow] = useState(1);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [mapping, setMapping] = useState<Record<string, ImportField>>({});
  const [result, setResult] = useState<ImportResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!open) {
      setFile(null);
      setPreview(null);
      setMapping({});
      setResult(null);
      setError(null);
    }
  }, [open]);
  async function requestPreview(sheetName?: string, validate = false) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const data = await postImport<ImportPreview>('preview', file, {
        headerRow: String(headerRow),
        ...(sheetName ? { sheetName } : {}),
        ...(validate ? { mapping: JSON.stringify(mapping) } : {}),
      });
      setPreview(data);
      if (!validate) setMapping(data.suggestedMapping);
    } catch (cause) {
      setError(message(cause));
    } finally {
      setBusy(false);
    }
  }
  async function execute() {
    if (!file || !preview) return;
    setBusy(true);
    setError(null);
    try {
      const data = await postImport<ImportResult>('execute', file, {
        fileHash: preview.fileHash,
        sheetName: preview.selectedSheet,
        headerRow: String(headerRow),
        mapping: JSON.stringify(mapping),
      });
      setResult(data);
      afterImport();
    } catch (cause) {
      setError(message(cause));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileSpreadsheet />
          {text.import}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{text.importTitle}</DialogTitle>
          <DialogDescription>{text.importDetail}</DialogDescription>
        </DialogHeader>
        {!result ? (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-[1fr_120px_auto] sm:items-end">
              <Field
                name="workbook"
                label={text.workbook}
                type="file"
                accept=".xlsx"
                onChange={(event) => {
                  setFile(event.target.files?.[0] ?? null);
                  setPreview(null);
                }}
              />
              <Field
                name="headerRow"
                label={text.headerRow}
                type="number"
                value={headerRow}
                min={1}
                onChange={(event) => setHeaderRow(Number(event.target.value))}
              />
              <Button
                type="button"
                disabled={!file || busy}
                onClick={() => requestPreview()}
              >
                {busy && <Loader2 className="animate-spin" />}
                {text.preview}
              </Button>
            </div>
            {preview ? (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <Label htmlFor="sheet">{text.sheet}</Label>
                  <select
                    id="sheet"
                    className={selectClass}
                    value={preview.selectedSheet}
                    onChange={(event) => requestPreview(event.target.value)}
                  >
                    {preview.sheets.map((sheet) => (
                      <option key={sheet}>{sheet}</option>
                    ))}
                  </select>
                  <span className="text-sm text-muted-foreground">
                    {preview.totalRows} {text.rows}
                  </span>
                </div>
                <div className="overflow-hidden rounded-lg border">
                  {preview.headers.map((header) => (
                    <div
                      className="grid grid-cols-2 items-center gap-4 border-t p-3 first:border-t-0"
                      key={header}
                    >
                      <span className="truncate text-sm font-medium">
                        {header}
                      </span>
                      <select
                        aria-label={`${text.map} ${header}`}
                        className={selectClass}
                        value={mapping[header] ?? ''}
                        onChange={(event) =>
                          setMapping((current) => {
                            const next = { ...current };
                            if (event.target.value)
                              next[header] = event.target.value as ImportField;
                            else delete next[header];
                            return next;
                          })
                        }
                      >
                        <option value="">{text.ignore}</option>
                        {importFields.map((field) => (
                          <option key={field} value={field}>
                            {field}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
                {preview.parsedRows.some((row) => row.errors.length) ? (
                  <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm">
                    <strong>{text.validationErrors}</strong>
                    {preview.parsedRows
                      .filter((row) => row.errors.length)
                      .slice(0, 10)
                      .map((row) => (
                        <p key={row.rowNumber}>
                          {text.row} {row.rowNumber}: {row.errors.join('; ')}
                        </p>
                      ))}
                  </div>
                ) : null}
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => requestPreview(preview.selectedSheet, true)}
                  >
                    {text.validate}
                  </Button>
                  <Button type="button" disabled={busy} onClick={execute}>
                    {text.execute}
                  </Button>
                </div>
              </>
            ) : null}
          </div>
        ) : (
          <ImportSummary result={result} text={text} />
        )}
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ImportSummary({ result, text }: { result: ImportResult; text: Text }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-5">
        {(
          ['created', 'invalid', 'skipped', 'failed', 'emailQueued'] as const
        ).map((key) => (
          <Card key={key}>
            <CardContent className="pt-5">
              <CardTitle className="text-2xl">{result[key]}</CardTitle>
              <p className="text-xs text-muted-foreground">{text[key]}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Button variant="outline" onClick={() => downloadResults(result)}>
        <Download />
        {text.download}
      </Button>
    </div>
  );
}

function Field(
  props: React.ComponentProps<typeof Input> & { label: string; name: string },
) {
  const { label, ...input } = props;
  return (
    <div className="space-y-2">
      <Label htmlFor={input.name}>{label}</Label>
      <Input id={input.name} {...input} />
    </div>
  );
}
function State({
  icon: Icon,
  title,
  detail,
  spin,
}: {
  icon: typeof Users;
  title: string;
  detail?: string;
  spin?: boolean;
}) {
  return (
    <div className="flex min-h-60 flex-col items-center justify-center gap-3 text-center">
      <Icon
        className={`size-8 text-muted-foreground ${spin ? 'animate-spin' : ''}`}
      />
      <h2 className="font-semibold">{title}</h2>
      {detail && (
        <p className="max-w-md text-sm text-muted-foreground">{detail}</p>
      )}
    </div>
  );
}
function message(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
function rpcBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_TRPC_URL ?? 'http://localhost:3002/trpc'
  ).replace(/\/trpc\/?$/, '');
}
async function postImport<T>(
  action: string,
  file: File,
  fields: Record<string, string>,
): Promise<T> {
  const body = new FormData();
  body.set('file', file);
  Object.entries(fields).forEach(([key, value]) => body.set(key, value));
  const response = await fetch(`${rpcBaseUrl()}/users/admin/import/${action}`, {
    method: 'POST',
    credentials: 'include',
    body,
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    throw new Error(payload?.message ?? `Import failed (${response.status}).`);
  }
  return response.json() as Promise<T>;
}
function downloadResults(result: ImportResult) {
  const quote = (value: unknown) =>
    `"${String(value ?? '').replaceAll('"', '""')}"`;
  const csv = [
    'row,status,userId,errors',
    ...result.rows.map((row) =>
      [row.rowNumber, row.status, row.userId ?? '', row.errors.join('; ')]
        .map(quote)
        .join(','),
    ),
  ].join('\r\n');
  const url = URL.createObjectURL(
    new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }),
  );
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'user-import-results.csv';
  anchor.click();
  URL.revokeObjectURL(url);
}
const selectClass =
  'h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50';

const copy = {
  nl: {
    title: 'Gebruikers beheren',
    description:
      'Maak leden aan, importeer een Excel-bestand en volg uitnodigingen.',
    search: 'Zoek op naam of e-mail',
    loading: 'Gebruikers laden…',
    forbidden: 'Geen toegang',
    forbiddenDetail: 'Alleen beheerders kunnen gebruikers beheren.',
    loadFailed: 'Gebruikers laden is mislukt',
    empty: 'Geen gebruikers gevonden.',
    name: 'Naam',
    email: 'E-mail',
    language: 'Taal',
    status: 'Status',
    resend: 'Opnieuw uitnodigen',
    newUser: 'Gebruiker toevoegen',
    createTitle: 'Nieuwe gebruiker',
    createDetail:
      'Na het aanmaken ontvangt het lid automatisch een uitnodiging.',
    firstName: 'Voornaam',
    lastName: 'Achternaam',
    cancel: 'Annuleren',
    create: 'Aanmaken en uitnodigen',
    import: 'Excel importeren',
    importTitle: 'Gebruikers importeren',
    importDetail:
      'Controleer het werkblad en de veldkoppeling voordat gebruikers worden aangemaakt.',
    workbook: 'Excel-bestand (.xlsx)',
    headerRow: 'Kopregel',
    preview: 'Voorbeeld laden',
    sheet: 'Werkblad',
    rows: 'rijen',
    map: 'Koppel',
    ignore: 'Niet importeren',
    validationErrors: 'Validatiefouten',
    row: 'Rij',
    validate: 'Koppeling controleren',
    execute: 'Gebruikers aanmaken',
    created: 'Aangemaakt',
    invalid: 'Ongeldig',
    skipped: 'Overgeslagen',
    failed: 'Mislukt',
    emailQueued: 'E-mails klaar',
    download: 'Resultaten als CSV',
    active: 'Actief',
    pending: 'In wachtrij',
    sent: 'Verstuurd',
    sending: 'Wordt verstuurd',
    not_queued: 'Niet ingepland',
  },
  en: {
    title: 'Manage users',
    description:
      'Create members, import an Excel workbook, and track invitations.',
    search: 'Search by name or email',
    loading: 'Loading users…',
    forbidden: 'No access',
    forbiddenDetail: 'Only administrators can manage users.',
    loadFailed: 'Could not load users',
    empty: 'No users found.',
    name: 'Name',
    email: 'Email',
    language: 'Language',
    status: 'Status',
    resend: 'Resend invitation',
    newUser: 'Add user',
    createTitle: 'New user',
    createDetail:
      'The member automatically receives an invitation after creation.',
    firstName: 'First name',
    lastName: 'Last name',
    cancel: 'Cancel',
    create: 'Create and invite',
    import: 'Import Excel',
    importTitle: 'Import users',
    importDetail:
      'Review the worksheet and field mapping before creating users.',
    workbook: 'Excel workbook (.xlsx)',
    headerRow: 'Header row',
    preview: 'Load preview',
    sheet: 'Worksheet',
    rows: 'rows',
    map: 'Map',
    ignore: 'Do not import',
    validationErrors: 'Validation errors',
    row: 'Row',
    validate: 'Validate mapping',
    execute: 'Create users',
    created: 'Created',
    invalid: 'Invalid',
    skipped: 'Skipped',
    failed: 'Failed',
    emailQueued: 'Emails queued',
    download: 'Download results CSV',
    active: 'Active',
    pending: 'Queued',
    sent: 'Sent',
    sending: 'Sending',
    not_queued: 'Not queued',
  },
} as const;
type Text = (typeof copy)[keyof typeof copy];
function statusLabel(status: string, text: Text) {
  return text[status as keyof Text] ?? status;
}
function fieldLabel(name: keyof CreateManagedUserInput, text: Text) {
  const labels: Partial<Record<keyof CreateManagedUserInput, string>> = {
    streetName: 'Street / Straat',
    houseNumber: 'House no. / Huisnr.',
    postcode: 'Postcode',
    city: 'City / Plaats',
    phoneNumber: 'Phone / Telefoon',
    bankAccountNumber: 'IBAN',
    birthDate: 'Birth date / Geboortedatum',
    bondNumber: 'Bond number / Bondsnummer',
    backNumber: 'Back number / Rugnummer',
    refereeLicense: 'Referee licence / Scheidsrechterslicentie',
  };
  return labels[name] ?? text.name;
}
