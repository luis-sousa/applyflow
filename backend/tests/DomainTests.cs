// Backend domain tests for ApplyFlow.
// These tests validate the value parsing logic used by application status handling.
using System;
using backend.Domain.Entities;
using Xunit;

namespace backend.tests;

public class DomainTests
{
    // Verifies that a valid string value can be parsed into the ApplicationStatus enum.
    [Fact]
    public void ApplicationStatus_ParseValidValue_ReturnsEnum()
    {
        // Arrange
        var value = "Applied";

        // Act
        var parsed = Enum.TryParse<ApplicationStatus>(value, out var status);

        // Assert
        Assert.True(parsed);
        Assert.Equal(ApplicationStatus.Applied, status);
    }

    // Verifies that an invalid string value does not parse and returns the default enum value.
    [Fact]
    public void ApplicationStatus_ParseInvalidValue_ReturnsFalse()
    {
        // Arrange
        var value = "UnknownStatus";

        // Act
        var parsed = Enum.TryParse<ApplicationStatus>(value, out var status);

        // Assert
        Assert.False(parsed);
        Assert.Equal(default(ApplicationStatus), status);
    }
}
