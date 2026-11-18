import { GoogleDocContent, GoogleDocSummary } from '../types/health';
import { clearCachedToken, getAccessToken } from './googleAuth';

interface StructuralElement {
  endIndex?: number;
  paragraph?: {
    elements?: Array<{
      textRun?: { content?: string };
    }>;
  };
  table?: {
    tableRows?: Array<{
      tableCells?: Array<{
        content?: StructuralElement[];
      }>;
    }>;
  };
}

interface DocsApiResponse {
  documentId: string;
  title?: string;
  body?: {
    content?: StructuralElement[];
  };
}

function extractTextFromElements(elements: StructuralElement[] = []): string {
  let out = '';
  for (const el of elements) {
    if (el.paragraph?.elements) {
      for (const pe of el.paragraph.elements) {
        if (pe.textRun?.content) {
          out += pe.textRun.content;
        }
      }
    } else if (el.table?.tableRows) {
      for (const row of el.table.tableRows) {
        const cellTexts: string[] = [];
        for (const cell of row.tableCells || []) {
          cellTexts.push(extractTextFromElements(cell.content || []).trim());
        }
        out += cellTexts.join(' | ') + '\n';
      }
    }
  }
  return out;
}

function requireToken(): string {
  const token = getAccessToken();
  if (!token) {
    throw new Error('AUTH_REQUIRED');
  }
  return token;
}

async function handleApiResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    clearCachedToken();
    throw new Error('AUTH_REQUIRED');
  }
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const msg = errBody?.error?.message || `Google API error (${res.status})`;
    throw new Error(msg);
  }
  return (await res.json()) as T;
}

export function extractDocumentIdFromInput(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) return match[1];
  return trimmed;
}

export async function listAppGoogleDocs(): Promise<GoogleDocSummary[]> {
  const token = requireToken();
  const query = encodeURIComponent(
    "mimeType='application/vnd.google-apps.document' and trashed=false"
  );
  const fields = encodeURIComponent('files(id,name,modifiedTime,webViewLink)');
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&orderBy=modifiedTime desc&pageSize=25`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  const data = await handleApiResponse<{ files?: GoogleDocSummary[] }>(res);
  return data.files || [];
}

export async function createHealthGoogleDoc(
  title: string,
  bodyContent: string
): Promise<{ documentId: string; title: string; url: string }> {
  const token = requireToken();
  const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });
  const doc = await handleApiResponse<DocsApiResponse>(createRes);

  if (bodyContent.trim()) {
    const updateRes = await fetch(
      `https://docs.googleapis.com/v1/documents/${doc.documentId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              insertText: {
                location: { index: 1 },
                text: bodyContent,
              },
            },
          ],
        }),
      }
    );
    await handleApiResponse(updateRes);
  }

  return {
    documentId: doc.documentId,
    title: doc.title || title,
    url: `https://docs.google.com/document/d/${doc.documentId}/edit`,
  };
}

export async function getGoogleDocContent(idOrUrl: string): Promise<GoogleDocContent> {
  const token = requireToken();
  const documentId = extractDocumentIdFromInput(idOrUrl);
  if (!documentId) {
    throw new Error('Please enter a valid Google Doc ID or link.');
  }
  const res = await fetch(`https://docs.googleapis.com/v1/documents/${encodeURIComponent(documentId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const doc = await handleApiResponse<DocsApiResponse>(res);
  const content = doc.body?.content || [];
  const lastEl = content[content.length - 1];
  const endIndex = Math.max(1, (lastEl?.endIndex || 2) - 1);

  return {
    documentId: doc.documentId,
    title: doc.title || 'Untitled Document',
    text: extractTextFromElements(content).trim(),
    endIndex,
  };
}

export async function appendTextToGoogleDoc(
  documentId: string,
  textToAppend: string
): Promise<void> {
  const token = requireToken();
  const doc = await getGoogleDocContent(documentId);
  const formattedText = `\n\n--- Noor Haram Update (${new Date().toLocaleString()}) ---\n${textToAppend}`;

  const res = await fetch(
    `https://docs.googleapis.com/v1/documents/${encodeURIComponent(documentId)}:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            insertText: {
              location: { index: doc.endIndex },
              text: formattedText,
            },
          },
        ],
      }),
    }
  );
  await handleApiResponse(res);
}

export async function trashGoogleDoc(documentId: string): Promise<void> {
  const token = requireToken();
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(documentId)}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ trashed: true }),
    }
  );
  await handleApiResponse(res);
}
