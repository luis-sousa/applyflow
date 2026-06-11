namespace backend.Application.Common;

public enum ResultErrorType
{
    None,
    Validation,
    NotFound,
    Conflict,
    Unauthorized
}

public sealed class Result<T>
{
    public bool IsSuccess { get; }
    public T? Value { get; }
    public ResultErrorType ErrorType { get; }
    public string? Error { get; }

    private Result(bool isSuccess, T? value, ResultErrorType errorType, string? error)
    {
        IsSuccess = isSuccess;
        Value = value;
        ErrorType = errorType;
        Error = error;
    }

    public static Result<T> Success(T value) => new(true, value, ResultErrorType.None, null);

    public static Result<T> Failure(ResultErrorType errorType, string error) =>
        new(false, default, errorType, error);
}
