export class Result<T, E> {
    // Should only be instantiated with success or error static methods
    private constructor(
        private state: "success" | "error",
        private data: T | null,
        private error: E | null,
    ) { }
    public static success<T, E>(data: T): Result<T, E> {
        return new Result("success", data, null as E);
    }
    public static error<T, E>(error: E): Result<T, E> {
        return new Result("error", null as T, error);
    }

    public isError(): boolean {
        return this.state === "error";
    }
    public isSuccess(): boolean {
        return this.state === "success";
    }

    public getError(): E {
        if (this.isError()) {
            return this.error as E;
        }
        throw new Error("Cannot get error from a success result");
    }
    public getData(): T {
        if (this.isSuccess()) {
            return this.data as T;
        }
        throw new Error(
            "Cannot get data from an error result Error: \n" +
            JSON.stringify(this.error, null, 2),
        );
    }
    public mapErr<EE>(fn: (error: E) => EE): Result<T, EE> {
        if (this.isError()) {
            return Result.error<T, EE>(fn(this.error as E));
        }
        return Result.success<T, EE>(this.data as T);
    }

    public async getDataSafeAsync(errResolver: (e: E) => Promise<T>) {
        if (this.isError()) {
            return await errResolver(this.getError())
        } else {
            return this.getData();
        }
    }
    public getDataSafe(errResolver: (e: E) => T) {
        if (this.isError()) {
            return errResolver(this.getError())
        } else {
            return this.getData();
        }
    }

    public mapData<TE>(fn: (data: T) => TE): Result<TE, E> {
        if (this.isSuccess()) {
            return Result.success<TE, E>(fn(this.data as T));
        }
        return Result.error<TE, E>(this.error as E);
    }

    public map<TE, EE>(dataFn: (data: T) => TE, errorFn: (error: E) => EE): Result<TE, EE> {
        if (this.isSuccess()) {
            return Result.success<TE, EE>(dataFn(this.data as T));
        }
        return Result.error<TE, EE>(errorFn(this.error as E));
    }
}

export function success<const T, E = never>(data: T): Result<T, E> {
    return Result.success<T, E>(data);
}
export function error<const E, T = never>(error: E): Result<T, E> {
    return Result.error<T, E>(error);
}
