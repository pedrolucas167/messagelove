/**
 * Repository Interface - Interface Segregation Principle
 * Contratos mínimos para cada tipo de operação
 */

export interface IReadRepository<T, ID = string> {
  findById(id: ID): Promise<T | null>;
  findAll(options?: QueryOptions): Promise<T[]>;
  exists(id: ID): Promise<boolean>;
}

export interface IWriteRepository<T, CreateDTO, UpdateDTO = Partial<CreateDTO>, ID = string> {
  create(data: CreateDTO): Promise<T>;
  update(id: ID, data: UpdateDTO): Promise<T | null>;
  delete(id: ID): Promise<boolean>;
}

export interface IRepository<T, CreateDTO, UpdateDTO = Partial<CreateDTO>, ID = string>
  extends IReadRepository<T, ID>,
    IWriteRepository<T, CreateDTO, UpdateDTO, ID> {}

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Filtros específicos podem estender
export interface WithFilters<F> {
  findWithFilters(filters: F, options?: QueryOptions): Promise<PaginatedResult<unknown>>;
}
