using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;

namespace RunTheGlobe
{
  interface IStravaCloudFrontCookies
  {
    Task<IDictionary<string, string>> GetCookies();
  }

  class HeatmapDownloader
  {
    static HttpClient client = new HttpClient();

    Task<IDictionary<string, string>> cookies;
    string externalServer;

    public HeatmapDownloader(IStravaCloudFrontCookies cookies)
    {
      this.cookies = cookies.GetCookies();
      this.externalServer = "c";
    }

    Bitmap Blank() {
      var blank = new Bitmap(512, 512);
      using Graphics gfx = Graphics.FromImage(blank);
      gfx.Clear(Color.Transparent);
      return blank;
    }

    async Task<Bitmap> Load(int x, int y, int z)
    {
      var query = HttpUtility.ParseQueryString("v=19");
      foreach (var (key, value) in await this.cookies)
      {
        query[key] = value;
      }
      var url = new UriBuilder($"https://heatmap-external-{externalServer}.strava.com/tiles-auth/run/bluered/{z}/{x}/{y}.png")
      {
        Query = query.ToString(),
      };

      try
      {
        Console.Error.WriteLine($"http GET {z}/{x}/{y}.png");
        return new Bitmap(await client.GetStreamAsync(url.Uri));
      }
      catch (HttpRequestException e)
      {
        if (e.StatusCode == HttpStatusCode.NotFound) return Blank();
        Console.Error.WriteLine("http non-404 error: " + url + " caused: " + e.ToString());
        throw;
      }
      catch (Exception e) {
        Console.Error.WriteLine("OTHER ERROR: caused: " + e.ToString());
        throw;
      }
    }

    public Task LoadAround(int centerX, int centerY, int z)
    {
      var tasks = Enumerable.Range(centerY - 1, 3).SelectMany(y =>
        Enumerable.Range(centerX - 1, 3)
        .Where(x => {
          using var image = FileDatabase.GetHeatmap(x, y, z); // MAYBE expensive to create this?
          return image == null;
        })
        .Select(async x =>
        {
          using var image = await Load(x, y, z);
          FileDatabase.SetHeatmap(x, y, z, image);
        })
      ).ToArray();

      return Task.WhenAll(tasks);
    }
  }
}
