/**
 * Voyage AI HTTP client.
 *
 * Currently used by:
 * - /api/voyage/smoke-test (B-pe-2 verification)
 *
 * Will be used by:
 * - lib/policy-extraction/chunk-and-embed.ts (B-pe-6)
 *
 * Pricing context (May 2026):
 * - voyage-3.5-lite: $0.02/MTok, 200M free tier per account
 * - 1024 dimensions, cosine similarity
 * - Up to 32K input tokens per request
 * - Contextualized embeddings: chunks understand their position in document
 *
 * Docs: https://docs.voyageai.com/reference/embeddings-api
 */

const VOYAGE_API_URL = 'https://api.voyageai.com/v1/embeddings';
const DEFAULT_MODEL = 'voyage-3.5-lite';

export type VoyageInputType = 'document' | 'query';

export interface VoyageEmbeddingRequest {
  /** One or more strings to embed. Voyage accepts up to 128 inputs per request. */
  input: string | string[];
  /** Defaults to voyage-3.5-lite. */
  model?: string;
  /** Optimization hint: 'document' for indexed corpus, 'query' for search-time. */
  inputType?: VoyageInputType;
  /** Optional output dimension override (some Voyage models support this). */
  outputDimension?: number;
}

export interface VoyageEmbedding {
  embedding: number[];
  index: number;
}

export interface VoyageUsage {
  total_tokens: number;
}

export interface VoyageEmbeddingResponse {
  object: string;
  data: VoyageEmbedding[];
  model: string;
  usage: VoyageUsage;
}

export class VoyageError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'VoyageError';
  }
}

/**
 * Generate embeddings for one or more strings.
 *
 * Throws VoyageError on non-2xx responses or missing API key.
 *
 * Token cost is returned in the response.usage.total_tokens field;
 * callers should log this for cost tracking.
 */
export async function embedTexts(
  request: VoyageEmbeddingRequest,
): Promise<VoyageEmbeddingResponse> {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) {
    throw new VoyageError('VOYAGE_API_KEY is not set in environment');
  }

  const body: Record<string, unknown> = {
    input: request.input,
    model: request.model ?? DEFAULT_MODEL,
  };
  if (request.inputType) body.input_type = request.inputType;
  if (request.outputDimension) body.output_dimension = request.outputDimension;

  const startedAt = Date.now();
  const response = await fetch(VOYAGE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const elapsedMs = Date.now() - startedAt;

  if (!response.ok) {
    let errorBody: unknown;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = await response.text().catch(() => 'unparseable');
    }
    throw new VoyageError(
      `Voyage API ${response.status} ${response.statusText} (after ${elapsedMs}ms)`,
      response.status,
      errorBody,
    );
  }

  const json = (await response.json()) as VoyageEmbeddingResponse;

  // Sanity check: voyage-3.5-lite always returns 1024-dim vectors.
  // Catch silent dimension drift early.
  if (json.data?.[0]?.embedding && json.data[0].embedding.length !== 1024) {
    throw new VoyageError(
      `Unexpected embedding dimension ${json.data[0].embedding.length}; expected 1024`,
      undefined,
      { receivedDim: json.data[0].embedding.length, model: json.model },
    );
  }

  return json;
}

/**
 * Convenience wrapper for the common single-string case.
 */
export async function embedSingle(
  text: string,
  inputType: VoyageInputType = 'document',
): Promise<{ embedding: number[]; tokens: number }> {
  const response = await embedTexts({ input: text, inputType });
  return {
    embedding: response.data[0].embedding,
    tokens: response.usage.total_tokens,
  };
}

export const VOYAGE_DEFAULTS = {
  model: DEFAULT_MODEL,
  dimensions: 1024,
} as const;
