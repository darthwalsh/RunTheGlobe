using System;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using StravaSharp;

namespace RunTheGlobe
{
  class GpxCopier
  {
    public static async Task Run()
    {
      var activity = await GetActivity();
      if (activity == null)
      {
        Console.Error.WriteLine("No activities!!!");
        return;
      }
      var (id, start) = activity.Value;
      var gpx = await DownloadGpx(id);
      var osmId = await UploadGpx(gpx, start);
      await StartEdit(osmId);
    }

    static async Task<(long, DateTime)?> GetActivity()
    {
      Console.Error.WriteLine("Getting Activities");
      var (activities, client) = await ActivityDownloader.GetActiviesAfter(DateTime.Today);

      ActivitySummary activity;
      switch (activities.Count)
      {
        case 0:
          activities = await client.Activities.GetAthleteActivities(1, 1);
          activity = activities.Single();
          break;
        case 1:
          activity = activities.Single();
          Console.Error.WriteLine($"{activity.Id} {activity.StartDate:hh:mm tt} {activity.Distance / 1609:0.0}mi {activity.Name}");
          break;
        default:
          throw new NotImplementedException("Should create picker?");
      }


      return (activity.Id, activity.StartDate);
    }

    static async Task<string> DownloadGpx(long id)
    {
      var start = DateTime.Now;
      Console.Error.WriteLine($"Opening browser to download {id}...");

      var psi = new ProcessStartInfo
      {
        FileName = $"https://www.strava.com/activities/{id}/export_gpx",
        UseShellExecute = true,
      };

      var p = Process.Start(psi) ?? throw new InvalidOperationException();
      await p.WaitForExitAsync();

      var downloads = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "Downloads");
      while (true) {
        var newest = new DirectoryInfo(downloads).GetFiles("*.gpx").OrderByDescending(f => f.LastWriteTime).FirstOrDefault();
        if (newest != null && newest.LastWriteTime > start) {
          return newest?.FullName ?? throw new InvalidOperationException();
        }
        await Task.Delay(500);
      }
    }

    static async Task<int> UploadGpx(string path, DateTime start)
    {
      // https://wiki.openstreetmap.org/wiki/API_v0.6#Create:_POST_.2Fapi.2F0.6.2Fgpx.2Fcreate

      Console.Error.WriteLine($"Using OSM API to upload {path}...");

      using var multiContent = new MultipartFormDataContent();

      using var gxp = File.OpenRead(path);
      using var file = new StreamContent(gxp);
      multiContent.Add(file, "file", Path.GetFileName(path));

      using var description = new StringContent($"Run ${start:yyyy-MM-dd} looking for paths");
      multiContent.Add(description, "description");

      using var tags = new StringContent("");
      multiContent.Add(tags, "tags");

      using var visibility = new StringContent("trackable");
      multiContent.Add(visibility, "visibility");

      using var request = new HttpRequestMessage
      {
        Method = HttpMethod.Post,
        Content = multiContent,
        RequestUri = new Uri("https://api.openstreetmap.org/api/0.6/gpx/create"),
      };

      var userpass = File.ReadAllText(Path.Combine(Program.rtg, "osm.txt"));
      string base64 = Convert.ToBase64String(System.Text.ASCIIEncoding.ASCII.GetBytes(userpass));
      request.Headers.Authorization = new AuthenticationHeaderValue("Basic", base64);

      using var response = await Program.client.SendAsync(request);
      response.EnsureSuccessStatusCode();

      var id = await response.Content.ReadAsStringAsync();
      return int.Parse(id);
    }

    static async Task StartEdit(long id)
    {
      Console.Error.WriteLine($"Opening OSM {id} in the browser...");

      var psi = new ProcessStartInfo
      {
        FileName = $"https://www.openstreetmap.org/edit?gpx={id}",
        UseShellExecute = true,
      };
      var p = Process.Start(psi) ?? throw new InvalidOperationException();
      await p.WaitForExitAsync();
    }
  }
}
