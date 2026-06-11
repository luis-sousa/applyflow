using backend.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace backend.tests.TestHelpers;

// Creates isolated, in-memory ApplyFlowDbContext instances for unit tests.
// Each call uses a unique database name so tests never share state or leak data between each other.
public static class TestDbContextFactory
{
    public static ApplyFlowDbContext Create()
    {
        var options = new DbContextOptionsBuilder<ApplyFlowDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new ApplyFlowDbContext(options);
    }
}
