/**
 * Result Pattern - Tratamento funcional de erros
 * Evita throw/catch excessivos e torna o fluxo mais previsível
 */

export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

export const Result = {
  ok<T>(data: T): Result<T, never> {
    return { success: true, data };
  },

  fail<E = Error>(error: E): Result<never, E> {
    return { success: false, error };
  },

  isOk<T, E>(result: Result<T, E>): result is { success: true; data: T } {
    return result.success === true;
  },

  isFail<T, E>(result: Result<T, E>): result is { success: false; error: E } {
    return result.success === false;
  },

  map<T, U, E>(result: Result<T, E>, fn: (data: T) => U): Result<U, E> {
    if (Result.isOk(result)) {
      return Result.ok(fn(result.data));
    }
    return result;
  },

  async mapAsync<T, U, E>(
    result: Result<T, E>,
    fn: (data: T) => Promise<U>
  ): Promise<Result<U, E>> {
    if (Result.isOk(result)) {
      return Result.ok(await fn(result.data));
    }
    return result;
  },

  unwrap<T, E>(result: Result<T, E>): T {
    if (Result.isOk(result)) {
      return result.data;
    }
    throw result.error;
  },

  unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
    if (Result.isOk(result)) {
      return result.data;
    }
    return defaultValue;
  },
};
