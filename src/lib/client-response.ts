export async function readJsonResponse<T extends Record<string, unknown> = Record<string, unknown>>(
  response: Response
): Promise<T> {
  const text = await response.text();
  if (!text.trim()) return {} as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    return { message: "O servidor retornou uma resposta inválida. Confira o terminal e tente novamente." } as unknown as T;
  }
}
