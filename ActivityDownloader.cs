using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Newtonsoft.Json;
using RestSharp.Portable;
using StravaSharp;

namespace RunTheGlobe
{
  class ActivityDownloader
  {
    public static async Task<List<string>> Run(DateTime after)
    {
      Console.Error.WriteLine("Getting Activities");
      var client = GetClient();

      // TODO(v0) save last date and reuse
      var activities = client.Activities.GetAllActivitiesAfter(after);

      var results = new List<string>();
      var detailed = new List<Task<Activity>>();
      await foreach (var a in activities)
      {
        var poly = FileDatabase.GetPolyline(a.Id);
        if (poly == null)
        {
          Console.Error.WriteLine($"Downloading {a.Name} {a.StartDate}");
          detailed.Add(client.Activities.Get(a.Id));
        }
        else
        {
          Console.Error.WriteLine($"Cached {a.Name} {a.StartDate} {a.Id}");
          results.Add(poly);
        }
      }

      Task.WaitAll(detailed.ToArray());
      foreach (var a in detailed)
      {
        FileDatabase.SetPolyline(a.Result.Id, a.Result.Map.Polyline);
        results.Add(a.Result.Map.Polyline);
      }

      return results;
    }

    public static Client GetClient()
    {
      // Not enough to use the read token from https://www.strava.com/settings/api ???
      // Access Token from python strava-cli works
      // TODO(app) use proper auth
      var home = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
      var accessJson = File.ReadAllText(Path.Combine(home, ".strava-cli", "access_token.json"));
      var access = (string)JsonConvert.DeserializeObject<Dictionary<string, object>>(accessJson)["access_token"];

      var authenticator = new StaticAuthenticator(access);
      return new Client(authenticator);
    }

    class StaticAuthenticator : IAuthenticator
    {
      string accessToken;

      public StaticAuthenticator(string accessToken) {
        this.accessToken = accessToken;
      }

      public bool CanPreAuthenticate(IRestClient client, IRestRequest request, ICredentials credentials) => true;
      public Task PreAuthenticate(IRestClient client, IRestRequest request, ICredentials credentials)
      {
        return Task.Run(() =>
        {
          request.AddHeader("Authorization", "Bearer " + accessToken);
        });
      }

      public bool CanPreAuthenticate(IHttpClient client, IHttpRequestMessage request, ICredentials credentials) => false;
      public Task PreAuthenticate(IHttpClient client, IHttpRequestMessage request, ICredentials credentials) => throw new NotImplementedException();

      public bool CanHandleChallenge(IHttpClient client, IHttpRequestMessage request, ICredentials credentials, IHttpResponseMessage response) => false;
      public Task HandleChallenge(IHttpClient client, IHttpRequestMessage request, ICredentials credentials, IHttpResponseMessage response) => throw new NotImplementedException();
    }
  }

  public static class ActivityExtensions {
    public static async IAsyncEnumerable<ActivitySummary> GetAllActivitiesAfter(this ActivityClient client, DateTime after) {
      for (var page = 0; ; page++) {
        var activities = await client.GetAthleteActivities(page, itemsPerPage: 30);
        if (!activities.Any()) yield break;
        foreach (var a in activities) {
          if (a.StartDate >= after) {
            yield return a;
          }
        }
      }
    }
  }
}
