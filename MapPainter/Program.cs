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

    // View these from https://tools.geofabrik.de/map/#14/38.0286/-122.5240&type=Geofabrik_Standard&grid=1
    const int ZOOM = 14;
    const int CENTER_X = 2615;
    const int CENTER_Y = 6318;

    static async Task Main(string[] args)
    {

      // await ActivityDownloader.Run(new DateTime(2022, 8, 15));

      var activities = FileDatabase.GetPolylines().Select(FileDatabase.GetPolyline).Cast<string>().ToList();
      Console.Error.WriteLine($"Got {activities.Count} activities.");

      await new HeatmapDownloader(new ConsoleCookies()).LoadAround(CENTER_X, CENTER_Y, ZOOM);

      using var combined = Drawer.CombineTiles(CENTER_X - 1, CENTER_Y - 1, CENTER_X + 2, CENTER_Y + 2, ZOOM);
      combined.Save(Path.Combine(rtg, "combinedTiles.png"));

      using Graphics gfx = Graphics.FromImage(combined);
      gfx.Clear(Color.Transparent);

      foreach (var a in activities) {
        var points = GeoDecoder.GetPoints(a, CENTER_X - 1, CENTER_Y - 1, ZOOM, 512);
        if (points.Any()) {
          Drawer.DrawPath(combined, points);
        }
      }

      combined.Save(Path.Combine(rtg, "progressMask.png"));

      Console.WriteLine($"Wrote PNGs to {rtg}");

      // using var gsutil = Process.Start(new ProcessStartInfo{
      //   FileName = @"C:\Users\cwalsh\scoop\shims\gsutil.cmd",
      //   Arguments = $"-h \"Cache-Control: no-cache\" cp {Path.Combine(rtg, "*.png")} gs://webfiles-rtg-carlwa",
      //   UseShellExecute = false,
      // })  ?? throw new ArgumentNullException();
      // await gsutil.WaitForExitAsync();
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
