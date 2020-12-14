using System;
using System.IO;
using System.Threading.Tasks;

namespace RunTheGlobe
{
  class Program
  {
    public static readonly string rtg = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), ".rtg");

    static async Task Main(string[] args)
    {
      var activities = await ActivityDownloader.Run();
      Console.Error.WriteLine($"Got {activities.Count} activities. First:");
      Console.Error.WriteLine(activities[0]);
      Console.Error.WriteLine();

      GeoDecoder.GetPoints(activities[0], 2614, 6317, 14, 512);

      using (var combined = Drawer.CombineTiles(2614, 6317, 2617, 6320, 14)) {
        combined.Save(Path.Combine(rtg, "progress.png"));
      }
    }
  }
}
