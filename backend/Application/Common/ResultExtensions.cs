namespace backend.Application.Common;

public static class ResultExtensions
{
    /// <summary>
    /// Maps a failed <see cref="Result{T}"/> to the matching <see cref="IResult"/> HTTP response.
    /// Must only be called when <see cref="Result{T}.IsSuccess"/> is <c>false</c>.
    /// </summary>
    public static IResult ToErrorResult<T>(this Result<T> result) => result.ErrorType switch
    {
        ResultErrorType.Validation => Results.BadRequest(new { error = result.Error }),
        ResultErrorType.NotFound => Results.NotFound(),
        ResultErrorType.Conflict => Results.Conflict(new { error = result.Error }),
        ResultErrorType.Unauthorized => Results.Unauthorized(),
        _ => Results.Problem(result.Error)
    };
}
