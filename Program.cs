using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;

namespace RunTheGlobe
{
  class Program
  {
    public static HttpClient client = new HttpClient();
    public static readonly string rtg = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), ".rtg");

    static async Task Main(string[] args)
    {
      if (args.FirstOrDefault() == "gpx") {
        await GpxCopier.Run();
        return;
      }

      const int zoom = 14;

      await ActivityDownloader.Run(new DateTime(2021, 1, 1));

      var activities = FileDatabase.GetPolylines().Select(FileDatabase.GetPolyline).Cast<string>().ToList();
      Console.Error.WriteLine($"Got {activities.Count} activities.");

      await new HeatmapDownloader(new ConsoleCookies()).LoadAround(2615, 6318, zoom);

      using var combined = Drawer.CombineTiles(2614, 6317, 2617, 6320, zoom);
      combined.Save(Path.Combine(rtg, "combinedTiles.png"));

      using Graphics gfx = Graphics.FromImage(combined);
      gfx.Clear(Color.Transparent);

      foreach (var a in activities) {
        var points = GeoDecoder.GetPoints(a, 2614, 6317, zoom, 512);
        if (points.Any()) {
          Drawer.DrawPath(combined, points);
        }
      }

      combined.Save(Path.Combine(rtg, "progressMask.png"));

      Console.WriteLine($"Wrote PNGs to {rtg}");

      using var gsutil = Process.Start(new ProcessStartInfo{
        FileName = @"C:\Users\cwalsh\scoop\shims\gsutil.cmd",
        Arguments = $"cp {Path.Combine(rtg, "*.png")} gs://webfiles-rtg-carlwa",
        UseShellExecute = false,
      })  ?? throw new ArgumentNullException();
      await gsutil.WaitForExitAsync();
    }
  }

  class ConsoleCookies : IStravaCloudFrontCookies
  {
    public Task<IDictionary<string, string>> GetCookies()
    {
      var path = Path.Combine(Program.rtg, "stravacookie.txt");
      var info = new FileInfo(path);
      string cookie;
      if (!info.Exists || info.LastWriteTime < DateTime.Now.Subtract(TimeSpan.FromHours(1))) {
        Console.WriteLine("Go to https://www.strava.com/heatmap#15.19/-122.53029/38.01453/hot/run and paste 6718.png HTTP cookie here");
        cookie = Console.ReadLine() ?? throw new ArgumentNullException("No text entered!!");
        File.WriteAllText(path, cookie);
      } else {
        cookie = File.ReadAllText(path);
      }

      IDictionary<string, string> dict = cookie.Split("; ")
        .Where(p => p.StartsWith("CloudFront-"))
        .Select(p => p.Substring("CloudFront-".Length).Split("="))
        .ToDictionary(p => p[0], p => p[1]);

      return Task.FromResult(dict);
    }
  }
}
