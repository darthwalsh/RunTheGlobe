using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Threading.Tasks;
using Newtonsoft.Json;
using RestSharp.Portable;
using StravaSharp;

namespace RunTheGlobe
{
  class ActivityDownloader
  {
    public static async Task<List<string>> Run()
    {
      Console.Error.WriteLine("Getting Activities");
      var (activities, client) = await GetActiviesAfter(new DateTime(2020, 12, 1)); // TODO(v0) dynamic date

      var results = new List<string>();
      var detailed = new List<Task<Activity>>();
      foreach (var a in activities)
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

    public static async Task<(List<ActivitySummary>, Client)> GetActiviesAfter(DateTime after)
    {
      var client = GetClient();
      return (await client.Activities.GetAthleteActivitiesAfter(after), client);
    }

    static Client GetClient()
    {
      // Not enough to use the read token from https://www.strava.com/settings/api ???
      // Access Token from python strava-cli works
      // TODO(app) use proper auth
      var home = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
      var accessJson = File.ReadAllText(Path.Combine(home, ".strava-cli", "access_token.json"));
      var access = JsonConvert.DeserializeObject<Dictionary<string, string>>(accessJson)["access_token"];

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
}
